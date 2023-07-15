const nodemailer = require('nodemailer');
const { google } = require('googleapis');

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

async function sendMail(email, username, project) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: USER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: 'MorStain <pathoradi.howard@gmail.com>',
      to: email,
      subject: 'Email from MorStain Team',
      text: `Hello ${username} Your proccess id is pathoradi_${id}.`,
      html: `<div>Hello ${username}</div><div> Your proccess id is ${project}.</div>`,
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
          user: USER_EMAIL,
          clientId: CLIENT_ID,
          clientSecret: CLEINT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
  
      const mailOptions = {
        from: `MorSTain <pathoradi.howard@gmail.com>`,
        to: 'hsiuchuan.shih@howard.edu',
        subject: `New Upload Info from ${username}`,
        //text: `New Upload Info from ${username}, download here: http://localhost:3000/uploadInfo/${id}`,
        html: `<div>New Upload Info from ${username}.</div><br/><div> Download Link:  <a href='${API_UL}/${id}'> here </a></div><br/><div>From MorSTain team </div>`,
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
  host: process.env.MySQL_HOST,
  user: process.env.MySQL_USER,
  password: process.env.MySQL_PASSWORD,
  database: process.env.MySQL_DB,
  port: process.env.MySQL_PORT,
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
  const thickness = req.body.thickness;
  const pixel = req.body.pixel;
  const sample = req.body.sample;
  const images = req.body.images;
  const userid = req.body.userid;
  const project = req.body.project;

  db.query(
    "INSERT INTO imagme_uploaded_info (project, thickness, pixel, images, userid) VALUES (?, ?, ?, ?, ?);",
    [project, thickness, pixel, images, userid],
    (err, results, fields) => {
      if (err) throw err;
      else {
        sendMail(email, username, results.project)
        .then((result) => console.log('sendMail sent...', result))
        .catch((error) => console.log(error.message));

        sendToAdmin(username, results.insertId)
        .then((result) => console.log('sendToAdmin sent...', result))
        .catch((error) => console.log(error.message));
        
        res.end(JSON.stringify(results))
      }
    }
  );
});


router.get("/:id", (req, res) => {
    const id = req.params.id;

    db.query(
        " SELECT * FROM  image_uploaded_info WHERE imageid=?",[id],
        (err, results, fields) => {
            if (err) throw err;
            else res.end(JSON.stringify(results));
        }
    )

});

module.exports = router;
