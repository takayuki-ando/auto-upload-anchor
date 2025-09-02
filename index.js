const chokidar = require('chokidar');
const path = require('path');

const watchedPath = '/Users/andoutakayuki/Music/GarageBand/ハイサークルテンプル/02_公開済み';

const watcher = chokidar.watch(watchedPath, {
  ignored: /[\/\\]\./, 
  persistent: true
});

watcher
  .on('add', path => {
    if (path.toLowerCase().endsWith('.mp3')) {
      console.log(`新しいMP3ファイルが検出されました: ${path}`);
      handleNewMp3File(path);
    }
  })
  .on('error', error => console.log(`ファイル監視エラー: ${error}`));

function handleNewMp3File(filePath) {
  console.log(`MP3ファイル処理中: ${filePath}`);
  const fileName = path.basename(filePath);
  console.log(`ファイル名: ${fileName}`);
}

console.log(`ファイル監視を開始しました: ${watchedPath}`);
console.log('新しいMP3ファイルの作成を監視中...');