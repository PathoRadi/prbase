const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const dbConfig = require('../../../config/dbConfig');

router.get('/', async (req, res) => {
  const { userid } = req.query;

  if (!userid) {
    console.error("Missing parameters:", { userid});
    return res.status(400).send("Missing parameters");
  }

  try {
    // Create a MySQL connection
    const db = mysql.createConnection(dbConfig);
    const uploadImageProjects = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM stainai_upload_info WHERE userid = ?', [userid], (err, results) => {
        if (err) return reject(err);
        resolve(results); // Resolve the results as an array
      });
    });

    if (!uploadImageProjects) {
      return res.status(400).json({ message: 'Invalid Project' });
    }

    return res.status(200).json(uploadImageProjects);

  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;