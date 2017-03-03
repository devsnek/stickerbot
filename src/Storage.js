const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('localstorage');

class Storage {
  get(key) {
    let value = localStorage.getItem(key);
    if (value !== null) {
      try {
        value = JSON.parse(value);
      } catch (e) {} // eslint-disable-line no-empty
    }
    return value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}

module.exports = new Storage;
