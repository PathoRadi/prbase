const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// const API_UL = process.env.LOCAL_URL;
const API_UL = process.env.PATHORADI_URL;

const CLIENT_ID = process.env.CLIENT_ID;
const CLEINT_SECRET = process.env.CLEINT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const USER_EMAIL = process.env.USER_EMAIL;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(email, username, token) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "Gmail",
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
      subject: "Thank you for Creating Stain.AI Account",
      text: `Hello ${username}, Please reset your password clicking on here.`,
      html: `<div>Hello ${username}</div><div> Please reset your password clicking on <a href="https://imaging.howard.edu/stainai/user/reset-password?email=${email}&token=${token}">here</a>.</div>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

// Create a function for reusable perpose
const generateRandomString = (myLength) => {
  const chars =
    "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
  const randomArray = Array.from(
    { length: myLength },
    (v, k) => chars[Math.floor(Math.random() * chars.length)]
  );

  const randomString = randomArray.join("");
  return randomString;
};

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

/* Create New User */
router.post("/create", (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const organization = req.body.organization;
  const email = req.body.email;
  const password = null;
  // create random toke
  const token = generateRandomString(30);
  // timestamp
  const timestamp = new Date();
  const role = email === `pathoradi.howard@gmail.com` ? "admin" : "user";

  db.query(
    "INSERT INTO user_info (firstname, lastname, organization, email, password, token, role, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
    [
      firstname,
      lastname,
      organization,
      email,
      password,
      token,
      role,
      timestamp,
    ],
    (err, results, fields) => {
      if (err) throw err;
      else {
        sendMail(email, `${firstname} ${lastname}`, token)
          .then((result) => console.log("sendMail sent...", result))
          .catch((error) => console.log(error.message));

        res.end(JSON.stringify(results));
      }
    }
  );
});

/* GET uploadInfo listing. */
router.get("/", function (req, res, next) {
  db.query(" SELECT * FROM  user_info", (err, results, fields) => {
    if (err) throw err;
    else res.end(JSON.stringify(results));
  });
});

/* Get User Information */
router.get("/:email", (req, res) => {
  const email = req.params.email;

  db.query(
    " SELECT * FROM  user_info WHERE email=?",
    [email],
    (err, results, fields) => {
      if (err) throw err;
      else res.end(JSON.stringify(results));
    }
  );
});

module.exports = router;
