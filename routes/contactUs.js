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

async function sendMail(form) {
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
      to: form.email,
      cc: `hustai.chhsu@gmail.com, ${USER_EMAIL}`,
      subject: "[Stain.Ai] contact us message",
      // text: `Hello ${username}, Please reset your password clicking on here.`,
      html: `First name: ${form.firstName}, Last name: ${form.lastName}, Email: ${form.email}, Message: ${form.message}`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

router.post("/", (req, res) => {
    return sendMail(req.body)
    .then((result) => {
        res.end(JSON.stringify({ result: true }));
        console.log("sendMail sent...", result)
    })
    .catch((error) => console.log(error.message));
});

module.exports = router;
