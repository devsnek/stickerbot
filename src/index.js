const Discord = require('discord.js');
const config = require('../config');
const superagent = require('superagent');
const Util = require('./Util');
const Storage = require('./Storage');

const client = new Discord.Client();

const commands = {
  upload: (message, content) => {
    const match = /^(.+)\/(.+) (.+)/i.exec(content);
    if (!match) return;
    const pack = match[1];
    const sticker = match[2];
    const remote = match[3].replace(/<|>/g, '');
    const key = `${pack}-${sticker}`;
    const front = `${pack}/${sticker}`;
    if (!Storage.has(key) || Storage.get(key).owner === message.author.id) {
      superagent.get(remote)
        .then((r) => Util.resizeImage(r.body))
        .then((b) => Util.s3upload(pack, sticker, b))
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
  if (content.startsWith('put') || content.startsWith('add')) {
    commands.upload(message, content.replace(/^put|^add/, '').trim());
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
