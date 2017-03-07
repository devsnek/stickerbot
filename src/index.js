const { Client } = require('discord.js');
const config = require('../config');
const superagent = require('superagent');
const Util = require('./Util');
const Storage = require('./Storage');

const client = new Client();

const commands = {
  uploadSingle: (message, content) => {
    const match = /^(.+)\/(.+) (.+)/i.exec(content);
    if (!match) return;
    const pack = match[1];
    const sticker = match[2];
    const remote = match[3].replace(/<|>/g, '');
    const key = `${pack}-${sticker}`;
    const front = `${pack}/${sticker}`;
    if (!Storage.has(key) || Storage.get(key).owner === message.author.id) {
      superagent.get(remote)
        .then((r) => Util.resize(r.body))
        .then((b) => Util.upload(pack, sticker, b))
        .then(() => {
          Storage.set(key, {
            owner: message.author.id,
          });
          message.reply(`**Created \`${front}\`!**`);
          console.log('CREATED', key);
        })
        .catch((e) => {
          console.error(e);
          message.reply(`**Failed to create \`${front}\`!**`);
        });
    } else {
      message.reply(`**You do not have permission to overwrite \`${front}\`!**`);
    }
  },
  uploadZip: async (message, content) => {
    const [pack, remote] = content.split(' ');
    if (!pack || !remote) return;
    superagent.get(remote)
      .parse((res, cb) => {
        res.data = '';
        res.setEncoding('binary');
        res.on('data', (chunk) => {
          res.data += chunk;
        });
        res.on('end', () => {
          cb(null, new Buffer(res.data, 'binary'));
        });
      })
      .buffer(true)
      .then((r) => Util.inflate(r.body))
      .then((inflated) =>
        Promise.all(inflated.getEntries().map(f =>
          Util.resize(f.getData()).then((data) => Util.upload(pack, f.entryName, data))
        ))
      )
      .then((done) => {
        console.log(done);
        // purposely not a template literal until i finish this
        return message.reply('**Added ${count} cards to ${pack} pack!**');
      })
      .catch((e) => {
        console.error(e);
        message.reply(`**Failed to upload zip!**`);
      });
  },
  get: (message, content) => {
    const match = /^(.+)\/(.+)/i.exec(content);
    if (!match) return;
    const pack = match[1];
    const sticker = match[2];
    const url = `${config.s3url}/${pack}/${sticker}.png`;
    message.delete().catch(Util.noop);
    message.channel.sendFile(url, `${pack}-${sticker}.png`).catch(e => console.error(url, e.message, e.status));
    return;
  },
};

client.on('message', (message) => {
  if (!message.content.startsWith('s!')) return;
  const content = message.cleanContent.replace('s!', '').trim();
  if (content.startsWith('putzip')) {
    commands.uploadZip(message, content.replace(/^putzip/, '').trim());
  } else if (content.startsWith('put') || content.startsWith('add')) {
    commands.uploadSingle(message, content.replace(/^put|^add/, '').trim());
    return;
  } else {
    commands.get(message, content);
    return;
  }
});

client.on('ready', () => {
  console.log('[CLIENT] Ready!', client.user.username, client.user.id);
});

client.login(config.token);
