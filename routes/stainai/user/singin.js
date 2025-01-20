const express = require('express');
const mysql = require('mysql');
const router = express.Router();
const bcrypt = require('bcryptjs');

const dbConfig = require('../../../config/dbConfig');

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  console.log('email:', email);
  console.log('password:', password);

  if (!email || !password) {
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
      return res.status(400).json({ message: 'Acount not found.' });
    }

    const hashedPassword = user?.password;
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (isMatch) {
      return res.status(200).json({
        user: {
          userid: user?.userid,
          email: user?.email,
          firstname: user?.firstname,
          lastname: user?.lastname,
          organization: user?.organization,
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;