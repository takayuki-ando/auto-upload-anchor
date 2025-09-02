const {
  isMp3File,
  handleNewMp3File,
  handleFileAdd,
  handleWatcherError,
  createFileWatcher,
  startFileWatcher,
  DEFAULT_WATCHED_PATH
} = require('./index');

const chokidar = require('chokidar');
const path = require('path');

// Mock chokidar
jest.mock('chokidar');

// Mock console methods to test logging
const originalConsoleLog = console.log;
let consoleLogSpy;

beforeEach(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  consoleLogSpy.mockRestore();
});

describe('ファイル監視システム', () => {
  describe('isMp3File', () => {
    test('should return true for .mp3 files', () => {
      expect(isMp3File('/path/to/file.mp3')).toBe(true);
      expect(isMp3File('/path/to/FILE.MP3')).toBe(true);
      expect(isMp3File('song.mp3')).toBe(true);
    });

    test('should return false for non-.mp3 files', () => {
      expect(isMp3File('/path/to/file.txt')).toBe(false);
      expect(isMp3File('/path/to/file.wav')).toBe(false);
      expect(isMp3File('/path/to/file')).toBe(false);
      expect(isMp3File('')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isMp3File('.mp3')).toBe(true);
      expect(isMp3File('file.mp3.backup')).toBe(false);
      expect(isMp3File('mp3')).toBe(false);
    });
  });

  describe('handleNewMp3File', () => {
    test('should process mp3 file and return filename', () => {
      const filePath = '/path/to/test-song.mp3';
      const result = handleNewMp3File(filePath);
      
      expect(result).toBe('test-song.mp3');
      expect(consoleLogSpy).toHaveBeenCalledWith(`MP3ファイル処理中: ${filePath}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('ファイル名: test-song.mp3');
    });

    test('should handle files with Japanese characters', () => {
      const filePath = '/path/to/音楽ファイル.mp3';
      const result = handleNewMp3File(filePath);
      
      expect(result).toBe('音楽ファイル.mp3');
      expect(consoleLogSpy).toHaveBeenCalledWith(`MP3ファイル処理中: ${filePath}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('ファイル名: 音楽ファイル.mp3');
    });

    test('should handle root level files', () => {
      const filePath = 'song.mp3';
      const result = handleNewMp3File(filePath);
      
      expect(result).toBe('song.mp3');
    });

    test('should handle empty paths gracefully', () => {
      const result = handleNewMp3File('');
      expect(result).toBe('');
    });
  });

  describe('handleFileAdd', () => {
    test('should process mp3 files', () => {
      const filePath = '/path/to/new-song.mp3';
      const result = handleFileAdd(filePath);
      
      expect(result).toBe('new-song.mp3');
      expect(consoleLogSpy).toHaveBeenCalledWith(`新しいMP3ファイルが検出されました: ${filePath}`);
    });

    test('should ignore non-mp3 files', () => {
      const filePath = '/path/to/document.txt';
      const result = handleFileAdd(filePath);
      
      expect(result).toBeNull();
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('新しいMP3ファイルが検出されました'));
    });

    test('should handle mixed case extensions', () => {
      expect(handleFileAdd('/path/to/song.MP3')).toBe('song.MP3');
      expect(handleFileAdd('/path/to/song.Mp3')).toBe('song.Mp3');
    });
  });

  describe('handleWatcherError', () => {
    test('should log error messages', () => {
      const error = new Error('ファイルシステムエラー');
      handleWatcherError(error);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(`ファイル監視エラー: ${error}`);
    });

    test('should handle string errors', () => {
      const error = 'アクセス権限がありません';
      handleWatcherError(error);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(`ファイル監視エラー: ${error}`);
    });
  });

  describe('createFileWatcher', () => {
    let mockWatcher;

    beforeEach(() => {
      mockWatcher = {
        on: jest.fn().mockReturnThis()
      };
      chokidar.watch = jest.fn().mockReturnValue(mockWatcher);
    });

    test('should create watcher with default options', () => {
      const result = createFileWatcher();
      
      expect(chokidar.watch).toHaveBeenCalledWith(DEFAULT_WATCHED_PATH, {
        ignored: /[\/\\]\./,
        persistent: true
      });
      expect(mockWatcher.on).toHaveBeenCalledWith('add', handleFileAdd);
      expect(mockWatcher.on).toHaveBeenCalledWith('error', handleWatcherError);
      expect(result).toBe(mockWatcher);
    });

    test('should create watcher with custom path', () => {
      const customPath = '/custom/path';
      createFileWatcher(customPath);
      
      expect(chokidar.watch).toHaveBeenCalledWith(customPath, {
        ignored: /[\/\\]\./,
        persistent: true
      });
    });

    test('should merge custom options', () => {
      const customOptions = { persistent: false, ignoreInitial: true };
      createFileWatcher(DEFAULT_WATCHED_PATH, customOptions);
      
      expect(chokidar.watch).toHaveBeenCalledWith(DEFAULT_WATCHED_PATH, {
        ignored: /[\/\\]\./,
        persistent: false,
        ignoreInitial: true
      });
    });

    test('should override default options with custom ones', () => {
      const customOptions = { ignored: /node_modules/ };
      createFileWatcher(DEFAULT_WATCHED_PATH, customOptions);
      
      expect(chokidar.watch).toHaveBeenCalledWith(DEFAULT_WATCHED_PATH, {
        ignored: /node_modules/,
        persistent: true
      });
    });
  });

  describe('startFileWatcher', () => {
    let mockWatcher;

    beforeEach(() => {
      mockWatcher = {
        on: jest.fn().mockReturnThis()
      };
      chokidar.watch = jest.fn().mockReturnValue(mockWatcher);
    });

    test('should start watcher with default path and log startup messages', () => {
      const result = startFileWatcher();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(`ファイル監視を開始しました: ${DEFAULT_WATCHED_PATH}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('新しいMP3ファイルの作成を監視中...');
      expect(chokidar.watch).toHaveBeenCalledWith(DEFAULT_WATCHED_PATH, expect.any(Object));
      expect(result).toBe(mockWatcher);
    });

    test('should start watcher with custom path', () => {
      const customPath = '/custom/music/folder';
      startFileWatcher(customPath);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(`ファイル監視を開始しました: ${customPath}`);
      expect(chokidar.watch).toHaveBeenCalledWith(customPath, expect.any(Object));
    });
  });

  describe('DEFAULT_WATCHED_PATH', () => {
    test('should be defined as expected path', () => {
      expect(DEFAULT_WATCHED_PATH).toBe('/Users/andoutakayuki/Music/GarageBand/ハイサークルテンプル/02_公開済み');
    });
  });

  describe('Integration tests', () => {
    let mockWatcher;

    beforeEach(() => {
      mockWatcher = {
        on: jest.fn().mockReturnThis()
      };
      chokidar.watch = jest.fn().mockReturnValue(mockWatcher);
    });

    test('should handle complete workflow for mp3 file detection', () => {
      const watcher = createFileWatcher();
      
      // Simulate file addition
      const addHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
      addHandler('/path/to/new-song.mp3');
      
      expect(consoleLogSpy).toHaveBeenCalledWith('新しいMP3ファイルが検出されました: /path/to/new-song.mp3');
      expect(consoleLogSpy).toHaveBeenCalledWith('MP3ファイル処理中: /path/to/new-song.mp3');
      expect(consoleLogSpy).toHaveBeenCalledWith('ファイル名: new-song.mp3');
    });

    test('should handle error in file watching', () => {
      const watcher = createFileWatcher();
      
      // Simulate error
      const errorHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'error')[1];
      const testError = new Error('Permission denied');
      errorHandler(testError);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(`ファイル監視エラー: ${testError}`);
    });
  });

  describe('Module entry point', () => {
    test('should be testable when required as module', () => {
      // This test verifies that the module exports work correctly
      // The actual entry point (require.main === module) is tested implicitly
      // by the fact that all our imports work
      expect(typeof isMp3File).toBe('function');
      expect(typeof handleNewMp3File).toBe('function');
      expect(typeof handleFileAdd).toBe('function');
      expect(typeof handleWatcherError).toBe('function');
      expect(typeof createFileWatcher).toBe('function');
      expect(typeof startFileWatcher).toBe('function');
      expect(typeof DEFAULT_WATCHED_PATH).toBe('string');
    });
  });
});