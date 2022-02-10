'use strict';
let dotenv = require('dotenv');
dotenv.config();

let { generateKeyPair } = require('crypto');
let fs = require('fs');

if (!fs.existsSync('certs/')) fs.mkdirSync('certs/');

generateKeyPair(
  'rsa',
  {
    modulusLength: 512,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  },
  (error, pub, priv) => {
    if (error) return console.log(error);

    fs.writeFileSync('certs/publicKey.pem', pub);
    fs.writeFileSync('certs/privateKey.pem', priv);
  }
);