const express = require('express');
const router = express.Router();
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const mysql = require('mysql');
const sendMail = require('../../../utils/send-mail');
const dbConfig = require('../../../config/dbConfig');

// Set up multer to handle file uploads to memory (no local storage)
const upload = multer({ storage: multer.memoryStorage() });  // Use memory storage to avoid local disk storage

router.post('/', upload.array('files[]'), async (req, res) => {
  const { username, project } = req.body;

  // Ensure necessary parameters are provided
  if (!username || !project || !req.files || req.files.length === 0) {
    return res.status(400).send("Missing parameters or files");
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

    // Loop over the uploaded files and upload them to Azure Blob Storage
    for (const file of req.files) {
      const blobClient = containerClient.getBlockBlobClient(`${username}/${project}/${file.originalname}`);
      
      // Upload the file directly from memory (using Buffer from multer's memoryStorage)
      await blobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
      });

      console.log(`Uploaded ${file.originalname} to Azure Blob Storage`);
    }

    // Create a MySQL connection and update the database status
    const db = mysql.createConnection(dbConfig);

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
            return res.status(200).send(`Files for project ${project} uploaded successfully.`);
          })
          .catch(mailError => {
            console.error('Error sending email:', mailError);
            return res.status(500).send('Error sending email');
          });
      });
    });
    
  } catch (error) {
    console.error('Error during upload:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;