// const fs = require('fs');

// const dbConfig = {
//   host: process.env.MySQL_HOST,
//   user: process.env.MySQL_USER,
//   password: process.env.MySQL_PASSWORD,
//   database: process.env.MySQL_DB,
//   port: process.env.MySQL_PORT,
//   ssl: { 
//     ca: fs.readFileSync('DigiCertGlobalRootCA.crt.pem') 
//   },
// };

// module.exports = dbConfig;


const fs = require("fs");
const path = require("path");

const caPath = path.join(__dirname, "..", "DigiCertGlobalRootG2.crt.pem");

// console.log("[DB SSL] caPath =", caPath);
// console.log("[DB SSL] ca exists =", fs.existsSync(caPath));
// if (fs.existsSync(caPath)) {
//   console.log("[DB SSL] ca bytes =", fs.readFileSync(caPath).length);
// }

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