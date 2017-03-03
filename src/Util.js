const sharp = require('sharp');
const AWS = require('aws-sdk');
const config = require('../config');
const AdmZip = require('adm-zip');

// Set credentials and region
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-west-2',
  credentials: new AWS.Credentials({
    accessKeyId: config.aws.key,
    secretAccessKey: config.aws.secret,
  }),
});


class Util {
  constructor() {
    throw new Error(`plz do not instantiate this class :P`);
  }

  static upload(pack, name, stream) {
    return new Promise((resolve, reject) => {
      s3.upload({
        Bucket: 'discord-stickers',
        Key: `${pack}/${name}.png`,
        ContentType: 'image/png',
        Body: stream,
      }, (err, data) => {
        if (err) reject(err);
        if (data) resolve(data);
      });
    });
  }

  static resize(buffer) {
    return new Promise((resolve, reject) => {
      sharp(buffer)
        .resize(120, 120)
        .min()
        .png({
          progressive: true,
          compressionLevel: 5,
        })
        .toBuffer((err, buff) => {
          if (err) reject(err);
          else resolve(buff);
        });
    });
  }

  static inflate(buffer) {
    return new Promise((resolve, reject) => {
      const zip = new AdmZip(buffer);
      if (zip.getEntries) resolve(zip);
      else reject(zip);
    });
  }

  static noop() {} // eslint-disable-line
}

module.exports = Util;
