const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const clientEnvPath = path.resolve(__dirname, './.env');

if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, clientEnvPath);
  console.log('.env copied to client/.env');
}