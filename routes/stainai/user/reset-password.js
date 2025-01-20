const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const router = express.Router();

const dbConfig = require('../../../config/dbConfig');

router.post("/", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Create a MySQL connection
  const db = mysql.createConnection(dbConfig);

  try {
    // Using Promises with mysql2 (better for async/await)
    const [user] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM stainai_user_info WHERE token = ?', [token], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const tokenExpiry = user?.token_expiry;  
    const now = new Date();
    if (now > new Date(tokenExpiry)) {
      return res.status(400).json({ message: 'Token has expired' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await new Promise((resolve, reject) => {
      db.query('UPDATE stainai_user_info SET password = ?, token = NULL WHERE userid = ?', [hashedPassword, user?.userid], (err, results) => {
        if (err) return reject(err);
        console.log(results);  // This is the OkPacket object
        resolve(results);
      });
    });
    
    // Check if the update was successful
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Password reset successfully' });
    } else {
      return res.status(400).json({ message: 'Failed to reset password' });
    }

  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;