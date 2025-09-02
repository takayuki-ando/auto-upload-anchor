const chokidar = require('chokidar');
const path = require('path');

const DEFAULT_WATCHED_PATH = '/Users/andoutakayuki/Music/GarageBand/ハイサークルテンプル/02_公開済み';

function isMp3File(filePath) {
  return filePath.toLowerCase().endsWith('.mp3');
}

function handleNewMp3File(filePath) {
  console.log(`MP3ファイル処理中: ${filePath}`);
  const fileName = path.basename(filePath);
  console.log(`ファイル名: ${fileName}`);
  return fileName;
}

function handleFileAdd(filePath) {
  if (isMp3File(filePath)) {
    console.log(`新しいMP3ファイルが検出されました: ${filePath}`);
    return handleNewMp3File(filePath);
  }
  return null;
}

function handleWatcherError(error) {
  console.log(`ファイル監視エラー: ${error}`);
}

function createFileWatcher(watchedPath = DEFAULT_WATCHED_PATH, options = {}) {
  const defaultOptions = {
    ignored: /[\/\\]\./,
    persistent: true,
    ...options
  };
  
  const watcher = chokidar.watch(watchedPath, defaultOptions);
  
  watcher
    .on('add', handleFileAdd)
    .on('error', handleWatcherError);
    
  return watcher;
}

function startFileWatcher(watchedPath = DEFAULT_WATCHED_PATH) {
  console.log(`ファイル監視を開始しました: ${watchedPath}`);
  console.log('新しいMP3ファイルの作成を監視中...');
  return createFileWatcher(watchedPath);
}

// Export functions for testing
module.exports = {
  isMp3File,
  handleNewMp3File,
  handleFileAdd,
  handleWatcherError,
  createFileWatcher,
  startFileWatcher,
  DEFAULT_WATCHED_PATH
};

// Start the watcher if this file is run directly
if (require.main === module) {
  startFileWatcher();
}