const express = require('express');
const router = express.Router();
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const mysql = require('mysql');
const sendMail = require('../../../utils/send-mail');
const dbConfig = require('../../../config/dbConfig');

// Set up multer to handle file uploads
const upload = multer({ dest: '/tmp/uploads' }); // Temporary directory for uploads

router.post('/', upload.array('files[]'), async (req, res) => {
  const { username, project, folderPath } = req.body; // Accept folderPath as part of request body

  // Ensure folderPath is provided
  if (!folderPath) {
    return res.status(400).send("Missing folderPath");
  }

  // Ensure necessary parameters are provided
  if (!username || !project === 0) {
    return res.status(400).send("Missing parameters");
  }

  try {
    // Azure connection setup
    const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
    if (!AZURE_CONNECTION_STRING) {
      throw new Error('Azure connection string is not defined');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('uploaded');

    // Check if the container exists
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      return res.status(404).send('Container not found');
    }

    // Check if the folder exists on your local machine
    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
      return res.status(404).send(`The specified folder ${folderPath} does not exist or is not a directory`);
    }

    // Set up the temp directory for the zip file in the Azure environment
    const tempDirectory = path.join('/tmp', 'zipped_files');  // Writable temp directory in Azure
    if (!fs.existsSync(tempDirectory)) {
      fs.mkdirSync(tempDirectory);  // Create the directory if it doesn't exist
    }

    const zipFileName = `results.zip`;
    const zipFilePath = path.join(tempDirectory, zipFileName);

    // Create a zip file of the folder specified by folderPath
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    // Add the folder to the zip archive
    archive.directory(folderPath, false);  // Add the contents of folderPath to the zip (false means don't include folder name itself)
    await archive.finalize();

    output.on('close', function () {
      console.log(`ZIP file created: ${zipFilePath}, total bytes: ${archive.pointer()}`);

      // Read the zip file and upload it to Azure Blob Storage
      const zipStream = fs.createReadStream(zipFilePath);
      const blobClient = containerClient.getBlockBlobClient(`${username}/${project}/${zipFileName}`);

      // Upload the zip file to Azure Blob Storage
      blobClient.uploadStream(zipStream, undefined, undefined, { blobHTTPHeaders: { blobContentType: 'application/zip' } })
        .then(() => {
          console.log(`Successfully uploaded ZIP file to Azure Blob Storage: ${zipFileName}`);

          // Optionally, delete the local zip file after upload
          fs.unlinkSync(zipFilePath);

          // Send success response
          // Create a MySQL connection
          const db = mysql.createConnection(dbConfig);

          // Update the status of the project in the database
          db.query('UPDATE stainai_upload_info SET status = "done" WHERE project = ?', [project], (err, results) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).send('Database update failed');
            }

            // Get user email
            db.query('SELECT DISTINCT email FROM stainai_user_info, stainai_upload_info WHERE stainai_user_info.userid = stainai_upload_info.userid and project = ?', [project], (err, userinfo) => {
              if (err) {
                console.error('Error retrieving user info:', err);
                return res.status(500).send('Error retrieving user info');
              }

              const email = userinfo.map(info => info.email).filter(Boolean).join(', ');

              // Close the database connection
              db.end();

              // Send the email to the user
              const from = process.env.GMAIL_USER || 'imaging.howard@gmail.com';
              const to = email;
              const subject = 'STAIN.AI: Your results are ready for download';
              const message = `
                <p>Hi ${username},</p>
                <p>Your results for project ${project} are ready. Click the link below to download the results:</p>
                <a href="https://imaging.howard.edu/stainai/user/dashboard">link</a>
                <p>Best regards,<br />The STAIN.AI Team</p>
              `;

              sendMail(from, to, subject, message)
                .then(() => {
                  return res.status(200).send(`Folder ${project} for ${username} has been zipped and uploaded successfully.`);
                })
                .catch(mailError => {
                  console.error('Error sending email:', mailError);
                  return res.status(500).send('Error sending email');
                });
            });
          });
        })
        .catch(uploadError => {
          console.error('Error uploading file to Azure:', uploadError);
          return res.status(500).send('Error uploading the zip file');
        });
    });

    output.on('error', (err) => {
      console.error('Error during ZIP creation:', err);
      return res.status(500).send('Error zipping the files');
    });

  } catch (error) {
    console.error('Error during upload:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;