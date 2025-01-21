const express = require('express');
const mysql = require('mysql');
const sendMail = require('../../utils/send-mail');
const router = express.Router();

const dbConfig = require('../../config/dbConfig');

// Example POST route for /contact
router.post("/", async (req, res) => {

  console.log('req.body', req.body);
  const { userid,
    username,
    email,
    project,
    uploadInfo } = req.body;

  // Validate request body
  if (!project || !email || !userid || !uploadInfo) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Create a MySQL connection
  const db = mysql.createConnection(dbConfig);
  try {

    for (const info of uploadInfo) {
      console.log('INFO:', info);
      console.log('IMAGES:', info.images); // Inspect the images array

      // Flatten images if they are nested arrays
      const imagesArray = Array.isArray(info.images) ? info.images.flat() : [];
      const imagesString = imagesArray.join(',');

      try {
        const result = await new Promise((resolve, reject) => {
          const query = `
            INSERT INTO stainai_upload_info 
            (project, species, strain, treatment, organ, slice, pixel, region, structure, images, status, timestamp, userid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            project,
            info.species,
            info.strain,
            info.treatment,
            info.organ,
            info.slice,
            info.pixel,
            info.region,
            info.structure,
            imagesString,
            'pending',
            new Date(),
            userid,
          ];

          db.query(query, values, (err, results) => {
            if (err) {
              console.error('Database error:', err);  // Log the error for debugging
              return reject(err);
            }
            console.log('Inserted row:', results);  // Log the results of the insertion
            resolve(results);
          });
        });
      } catch (error) {
        console.error('Error during upload:', error);
      }
    }


    // Send a confirmation email to the user
    let from = process.env.GMAIL_USER || 'imaging.howard@gmail.com';
    let to = email;

    let subject = `[Stain.AI] Your process id is ${project}`;

    let message = `
        <p>Hi ${username},</p>
        <p>Thank you for submitting your images to STAIN.AI! Your process id is ${project}. We will notify you once the process is completed.</p>
        <p>Best regards,<br />The STAIN.AI Team</p>
      `;

    sendMail(from, to, subject, message);

    // Send a confirmation email to the STAIN.AI Team
    from = process.env.GMAIL_USER || 'imaging.howard@gmail.com';
    to = process.env.GMAIL_USER || 'imaging.howard@gmail.com';
    subject = `[Stain.AI] New Upload Images from ${username}`;

    message = `
        <p>Hi STAIN.AI Team,</p>
        <p>${username} has submitted new images to STAIN.AI. Please check the admin panel for more details.</p>
        <p>Download Link:  <a href='https://prbase.azurewebsites.net/internal/download-images?username=${username}&project=${project}'/> here - https://prbase.azurewebsites.net/internal/download-images?username=${username}&project=${project} </a></p>
      `;

    sendMail(from, to, subject, message);

    // Return a success response with the result
    res.status(200).json({ message: 'Upload info inserted successfully' });


  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  } finally {
    db.end();  // Make sure the database connection is closed after the operation
  }


});

module.exports = router;