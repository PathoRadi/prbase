const fs = require('fs');

const dbConfig = {
  host: process.env.MySQL_HOST,
  user: process.env.MySQL_USER,
  password: process.env.MySQL_PASSWORD,
  database: process.env.MySQL_DB,
  port: process.env.MySQL_PORT,
  ssl: { 
    ca: fs.readFileSync('DigiCertGlobalRootCA.crt.pem') 
  },
};

module.exports = dbConfig;
