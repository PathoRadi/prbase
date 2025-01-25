const express = require('express');
const router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');
const archiver = require('archiver');
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');
const sendMail = require('../../../utils/send-mail');

const dbConfig = require('../../../config/dbConfig');

router.get('/', async (req, res) => {
  const { username, project, folderPath } = req.query;

  if (!username || !project || !folderPath) {
    console.error("Missing parameters:", { username, project, folderPath });
    return res.status(400).send("Missing parameters");
  }

  try {
    // upload results to Azure Blob Storage
    const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
    if (!AZURE_CONNECTION_STRING) {
      throw new Error('Azure connection string is not defined');
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('uploaded');

    // Check if the container exists
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.log(`Container does not exist: ${containerName}`);
      return res.status(404).send(`Container not found: ${containerName}`);
    }

    if (typeof folderPath !== 'string' || !fs.existsSync(folderPath)) {
      return res.status(404).send(`Folder not found at ${folderPath}`);
    }

    const tempDirectory = path.join('/tmp', 'zipped_files');  // /tmp is a writable area in Azure
    if (!fs.existsSync(tempDirectory)) {
      fs.mkdirSync(tempDirectory); // Create directory if it doesn't exist
    }

    // Prepare the zip file name
    const zipFileName = `results.zip`;
    const zipFilePath = path.join(tempDirectory, zipFileName);

    console.log(`Zipping folder: ${folderPath} to ${zipFilePath}`);


    // Create a write stream for the ZIP file
    const output = fs.createWriteStream(zipFilePath);

    // Create an Archiver instance to zip the folder
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    // Add the folder to the zip archive
    archive.directory(folderPath, false);  // false means do not include the folder name in the zip file

    // Finalize the zip creation
    await archive.finalize();

    /*
    **  Update db with done status
    **  Send email to user
    */
    output.on('close', function () {
      console.log(`ZIP file created: ${zipFilePath}, total bytes: ${archive.pointer()}`);

      // Read the zip file to upload it to Azure Blob Storage
      const zipStream = fs.createReadStream(zipFilePath);
      const blobClient = containerClient.getBlockBlobClient(`${username}/${project}/${zipFileName}`);

      // Upload the zip file to Azure Blob Storage
      blobClient.uploadStream(zipStream, undefined, undefined, { blobHTTPHeaders: { blobContentType: 'application/zip' } })
        .then(() => {
          console.log(`Successfully uploaded ZIP file to Azure Blob Storage: ${zipFileName}`);

          // Optionally, delete the local zip file after upload
          fs.unlinkSync(zipFilePath);


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
      return res.status(500).send('Error zipping the folder');
    });


  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;