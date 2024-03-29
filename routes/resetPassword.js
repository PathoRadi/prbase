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

async function sendMail(email) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: USER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: USER_EMAIL,
      to: email,
      cc: USER_EMAIL,
      subject: "[Stain.AI] Rest Your Stain.AI Password successfully!",
      // text: `Hello ${username}, Please reset your password clicking on here.`,
      html: `Rest Your MorStain Password successfully! Please sin in your account <a href="https://imaging.howard.edu/stainai/user/signin">here</a>.</div>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

router.get("/", function (req, res, next) {
  const email = req.query.email;
  const token = req.query.token;

  db.query(
    `SELECT * FROM user_info WHERE email='${email}' and token='${token}'`,
    (err, results, fields) => {
      if (err) throw err;
      else {
        if (results.length === 1) res.end(JSON.stringify({ allow: true }));
        else res.end(JSON.stringify({ allow: false }));
      }
    }
  );
});

router.post("/update", (req, res) => {
  // const username = req.body.username;
  const email = req.body.email;
  const token = req.body.token;
  const password = req.body.password;

  //UPDATE user_info SET password = '${password}' WHERE email='${email}' and token='${token}'

  console.dir(
    `UPDATE user_info SET password='${password}' WHERE email='${email}' and token='${token}'`
  );

  db.query(
    `UPDATE user_info SET password='${password}' WHERE email='${email}' and token='${token}'`,
    (err, results, fields) => {
      if (err) throw err;
      else {
        console.dir(results);
        res.end(JSON.stringify({ result: true }));
      }
    }
  );

  sendMail(email)
    .then((result) => console.log("sendMail sent...", result))
    .catch((error) => console.log(error.message));
});

module.exports = router;
