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

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send({
    message: 'Hello World'
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
      else console.log("Inserted " + results.affectedRows + " row(s).");
    }
  );
});

module.exports = router;
