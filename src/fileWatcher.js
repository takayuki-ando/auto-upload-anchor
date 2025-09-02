const chokidar = require('chokidar');
const path = require('path');

class FileWatcher {
  constructor(watchPath, options = {}) {
    this.watchPath = watchPath;
    this.options = {
      ignored: /[\/\\]\./,
      persistent: true,
      ...options
    };
    this.watcher = null;
  }

  start() {
    if (this.watcher) {
      throw new Error('ファイル監視は既に開始されています');
    }

    if (!this.watchPath) {
      throw new Error('監視パスが指定されていません');
    }

    this.watcher = chokidar.watch(this.watchPath, this.options);

    this.watcher
      .on('add', (filePath) => {
        if (this.isMp3File(filePath)) {
          console.log(`新しいMP3ファイルが検出されました: ${filePath}`);
          this.handleNewMp3File(filePath);
        }
      })
      .on('error', (error) => {
        console.log(`ファイル監視エラー: ${error}`);
        this.handleError(error);
      })
      .on('ready', () => {
        console.log(`ファイル監視を開始しました: ${this.watchPath}`);
        console.log('新しいMP3ファイルの作成を監視中...');
      });

    return this.watcher;
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  isMp3File(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }
    return filePath.toLowerCase().endsWith('.mp3');
  }

  handleNewMp3File(filePath) {
    console.log(`MP3ファイル処理中: ${filePath}`);
    const fileName = this.getFileName(filePath);
    console.log(`ファイル名: ${fileName}`);
    return fileName;
  }

  getFileName(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return '';
    }
    return path.basename(filePath);
  }

  handleError(error) {
    console.error('ファイル監視システムエラー:', error);
  }

  isWatching() {
    return this.watcher !== null;
  }
}

module.exports = FileWatcher;