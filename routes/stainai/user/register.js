const express = require('express');
const mysql = require('mysql');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const sendMail = require('../../../utils/send-mail');

router.post("/", async (req, res) => {
  const { firstname, lastname, organization, email } = req.body;

  if (!firstname || !lastname || !organization || !email) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const dbConfig = {
    host: process.env.MySQL_HOST,
    user: process.env.MySQL_USER,
    password: process.env.MySQL_PASSWORD,
    database: process.env.MySQL_DB,
    port: process.env.MySQL_PORT,
    ssl: { ca: fs.readFileSync('DigiCertGlobalRootCA.crt.pem') },
  };

  console.log('dbConfig:', dbConfig);

  // Create a MySQL connection
  const db = mysql.createConnection(dbConfig);

  try {
    // Using Promises with mysql2 (better for async/await)
    const [rows] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM stainai_user_info WHERE email = ?', [email], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (rows) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const token = uuidv4();
    // Insert the new user into the database
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO stainai_user_info (firstname, lastname, organization, email, password, token, token_expiry, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          firstname,
          lastname,
          organization,
          email,
          null,  // Password can be set later
          token,
          new Date(Date.now() + 60 * 60 * 1000),  // Token expires in 1 hour
          new Date(),  // current timestamp
        ],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });

    // Send verification email
    const from = process.env.GMAIL_USER || 'imaging.howard@gmail.com';
    const to = email;
    const verificationUrl = `${process.env.STAINAI_URL}/stainai/user/password-reset?token=${token}`;
    const subject = 'Email Verification for Your STAIN.AI Account';

    const message = `
      <p>Hi ${firstname},</p>
      <p>Thank you for registering with STAIN.AI! To complete your registration, please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}" style="color: #007bff; text-decoration: none;">Verify Your Email</a></p>
      <p>If you didn't sign up for an account, you can safely ignore this email.</p>
      <p>Best regards,<br />The STAIN.AI Team</p>
    `;

    sendMail(from, to, subject, message);

    return res.status(200).json({ message: 'Registration successful. Please check your email for verification.' });

  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  } finally {
    db.end();  // Make sure the database connection is closed after the operation
  }
});

module.exports = router;