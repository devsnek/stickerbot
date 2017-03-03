const sharp = require('sharp');
const AWS = require('aws-sdk');
const config = require('../config');

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

  static s3upload(pack, name, stream) {
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

  static resizeImage(buffer) {
    return new Promise((resolve, reject) => {
      sharp(buffer)
        .resize(120, 120)
        .min()
        .toFormat('png')
        .toBuffer((err, buff, info) => {
          if (err) reject(info);
          else resolve(buff);
        });
    });
  }

  static noop() {} // eslint-disable-line
}

module.exports = Util;
