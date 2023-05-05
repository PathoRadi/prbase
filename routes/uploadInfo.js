const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLEINT_SECRET = process.env.CLEINT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(email, username, id) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.USER_EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLEINT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: 'PathoRadi <janice.hc.shih@gmail.com>',
      to: email,
      subject: 'Email from PathoRadi Team',
      text: `Hello ${username} Your proccess id is pathoradi_${id}.`,
      html: `<div>Hello ${username}</div><div> Your proccess id is pathoradi_${id}.</div>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

async function sendToAdmin(username, id) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();
  
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.USER_EMAIL,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLEINT_SECRET,
          refreshToken:process.env.REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
  
      const mailOptions = {
        from: `PathoRadi <${props.env.USER_EMAIL}>`,
        to: 'chaohsiung.hsu@howard.edu;tsangwei.tu@howard.edu;hsiuchuan.shih@howard.edu',
        subject: `New Upload Info from ${username}`,
        text: `New Upload Info from ${username}, download here: ${process.env.PATHORADI_URL}/${id}`,
        html: `<div>New Upload Info from ${username}.</div><div> Download here: <a href='${pathoradiURL}/${id}'>${pathoradiURL}/${id}</a></div>`,
      };
  
      const result = await transport.sendMail(mailOptions);
      return result;
    } catch (error) {
      return error;
    }
  }


var express = require('express');
var router = express.Router();

const mysql = require("mysql");

const fs = require("fs");
var config = {
  host: "prbase.mysql.database.azure.com",
  user: "prbase",
  password: "2Axijoll@",
  database: "prbase",
  port: 3306,
  ssl: { ca: fs.readFileSync("DigiCertGlobalRootCA.crt.pem") },
};

const db = new mysql.createConnection(config);

/* GET uploadInfo listing. */
router.get('/', function(req, res, next) {
  res.send({
    message: 'upload info'
  });
});

router.post("/create", (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const project = req.body.project;
  const thickness = req.body.thickness;
  const pixel = req.body.pixel;
  const sample = req.body.sample;
  const rawImages = req.body.rawImages;

  db.query(
    "INSERT INTO upload_info (username, email, project, thickness, pixel, sample, rawImages) VALUES (?, ?, ?, ?, ?, ?, ?);",
    [username, email, project, thickness, pixel, sample, rawImages],
    (err, results, fields) => {
      if (err) throw err;
      else {
        sendMail(email, username, results.insertId)
        .then((result) => console.log('Email sent...', result))
        .catch((error) => console.log(error.message));

        sendToAdmin(username, results.insertId)
        .then((result) => console.log('Email sent...', result))
        .catch((error) => console.log(error.message));
        
        res.end(JSON.stringify(results))
      }
    }
  );
});


router.get("/:id", (req, res) => {
    const id = req.params.id;

    db.query(
        " SELECT * FROM  upload_info WHERE userid=?",[id],
        (err, results, fields) => {
            if (err) throw err;
            else res.end(JSON.stringify(results));
        }
    )

});

module.exports = router;
