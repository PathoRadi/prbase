const fs = require("fs");
const path = require("path");

const caPath = path.join(__dirname, "..", "DigiCertGlobalRootG2.crt.pem");

module.exports = {
  host: process.env.MySQL_HOST,
  user: process.env.MySQL_USER,
  password: process.env.MySQL_PASSWORD,
  database: process.env.MySQL_DB,
  port: Number(process.env.MySQL_PORT || 3306),
  ssl: {
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: true,
  },
};