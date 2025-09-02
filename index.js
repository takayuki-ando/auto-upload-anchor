const FileWatcher = require('./src/fileWatcher');

const watchedPath = '/Users/andoutakayuki/Music/GarageBand/ハイサークルテンプル/02_公開済み';

const fileWatcher = new FileWatcher(watchedPath);
fileWatcher.start();