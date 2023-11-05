const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// const API_UL = process.env.LOCAL_URL;
const API_UL = process.env.PATHORADI_URL;

const STORAGE_URL = "https://pathoradi.blob.core.windows.net/uploaded/";

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
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: USER_EMAIL,
      to: email,
      subject: `[Stain.AI] Your process id is ${project}`,
      text: `Hello ${username} Your project is ${project}.`,
      html: `<div>Hello ${username}</div><div> Your project is ${project}.</div>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

async function sendToAdmin(username, project) {
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
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: USER_EMAIL,
      to: "hsiuchuan.shih@howard.edu",
      subject: `[Stain.AI] New Upload Info from ${username}`,
      //text: `New Upload Info from ${username}, download here: http://localhost:3000/uploadInfo/${id}`,
      html: `<div>New Upload Info from ${username}.</div><br/><div> Download Link:  <a href='${API_UL}/${project}'> here </a></div><br/>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

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

/* GET uploadInfo listing. */
// router.get('/', function(req, res, next) {
//   res.send({
//     message: 'upload info'
//   });
// });

router.post("/create", (req, res) => {
  const userid = req.body.userid;
  const username = req.body.username;
  const email = req.body.email;
  const project = req.body.project;

  const uploadInfo = req.body.uploadInfo;

  console.log(uploadInfo)

  Object.values(uploadInfo).map((info) => {

    const species = info.species;
    const strain = info.strain;
    const treatment = info.treatment;
    const organ = info.organ;
    const slice = info.slice;
    const pixel = info.pixel;
    const region = info.region;
    const structure = info.structure;
    const images = info.images.join(',');

    const status = "pendding";
    const timestamp = new Date();
    console.log(info)

     db.query(
    "INSERT INTO upload_info (project, species, strain, treatment, organ, slice, pixel, region,structure, images, status, timestamp, userid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [
      project,
      species,
      strain,
      treatment,
      organ,
      slice,
      pixel,
      region,
      structure,
      images,
      status,
      timestamp,
      userid,
    ],
    (err, results, fields) => {
      if (err) throw err;
      else {
    

      }})

  })

  sendMail(email, username, project)
  .then((result) => console.log("sendMail sent...", result))
  .catch((error) => console.log(error.message));


  sendToAdmin(username, project)
  .then((result) => console.log("sendToAdmin sent...", result))
  .catch((error) => console.log(error.message));

  res.end();

});

router.get("/", (req, res) => {
  console.dir(
    " SELECT * FROM  upload_info JOIN user_info ON upload_info.userid = user_info.userid"
  );

  db.query(
    " SELECT * FROM  upload_info JOIN user_info ON upload_info.userid = user_info.userid",
    (err, results, fields) => {
      if (err) throw err;
      else res.end(JSON.stringify(results));
    }
  );
});

router.get("/:project", (req, res) => {
  const project = req.params.project;

  db.query(
    " SELECT * FROM  upload_info WHERE project=?",
    [project],
    (err, results, fields) => {
      if (err) throw err;
      else res.end(JSON.stringify(results));
    }
  );
});

router.get("/user/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    " SELECT * FROM  upload_info WHERE userid=?",
    [id],
    (err, results, fields) => {
      if (err) throw err;
      else res.end(JSON.stringify(results));
    }
  );
});

module.exports = router;
