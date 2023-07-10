const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// const API_UL = process.env.LOCAL_URL;
const API_UL = process.env.PATHORADI_URL;

const CLIENT_ID = process.env.CLIENT_ID;
const CLEINT_SECRET = process.env.CLEINT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const REDIRECT_URI = process.env.REDIRECT_URI;

const USER_EMAIL = process.env.USER_EMAIL;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

var express = require("express");
var router = express.Router();

const mysql = require("mysql");

const fs = require("fs");
var config = {
  host: process.env.MySQL_HOST,
  user: process.env.MySQL_USER,
  password: process.env.MySQL_PASSWORD,
  database: process.env.MySQL_DB,
  port: process.env.MySQL_PORT,
  ssl: { ca: fs.readFileSync("DigiCertGlobalRootCA.crt.pem") },
};

const db = new mysql.createConnection(config);

router.post("/", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query(
    `SELECT * FROM user_info WHERE email='${email}' and password='${password}'`,
    (err, results, fields) => {
      if (err) throw err;
      else {
        if (results.length === 1) res.end(JSON.stringify({ ...results[0], allow: true }));
        else res.end(JSON.stringify({ ...results,allow: false }));
      }
    }
  );
});

module.exports = router;
