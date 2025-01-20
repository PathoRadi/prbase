const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const sendMail = require('../../../utils/send-mail');
const dbConfig = require('../../../config/dbConfig');

router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Create a MySQL connection
  const db = mysql.createConnection(dbConfig);

  try {
    const [user] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM stainai_user_info WHERE email = ?', [email], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    // Generate a unique reset token
    const token = uuidv4();
    // Set the token expiration time (1 hour from now)
    const token_expiry = new Date(Date.now() + 60 * 60 * 1000);

    const result = await new Promise((resolve, reject) => {
      db.query('UPDATE stainai_user_info SET token = ?, token_expiry = ? WHERE email = ?', [token, token_expiry, email], (err, results) => {
        if (err) return reject(err);
        console.log(results);  // This is the OkPacket object
        resolve(results);
      });
    });

    // Check if the update was successful
    if (result.affectedRows > 0) {
      // Generate the password reset URL
      const resetUrl = `${process.env.STAINAI_URL}/stainai/user/reset-password?token=${token}`;

      // Email content
      const from = process.env.GMAIL_USER || 'imaging.howard@gmail.com';
      const subject = 'Password Reset Request for Your STAIN.AI Account';
      const message = `
            <p>Hello,</p>
            <p>We received a request to reset your STAIN.AI account password. To reset your password, please click the link below:</p>
            <p><a href="${resetUrl}" style="color: #007bff; text-decoration: none;">Reset Your Password</a></p>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br />The STAIN.AI Team</p>
          `;

      // Send the email
      sendMail(from, email, subject, message);

      // Respond to the client
      return res.status(200).json({ message: 'A password reset link has been sent to your email address. Please check your inbox.' });
    } else {
      return res.status(400).json({ message: 'Failed to reset password' });
    }


  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;