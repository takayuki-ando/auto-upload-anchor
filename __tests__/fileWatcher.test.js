const FileWatcher = require('../src/fileWatcher');
const chokidar = require('chokidar');

jest.mock('chokidar');

describe('FileWatcher', () => {
  let mockWatcher;
  let fileWatcher;
  let consoleSpy;

  beforeEach(() => {
    mockWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn(),
    };
    chokidar.watch.mockReturnValue(mockWatcher);
    
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create FileWatcher with required path', () => {
      const watchPath = '/test/path';
      fileWatcher = new FileWatcher(watchPath);

      expect(fileWatcher.watchPath).toBe(watchPath);
      expect(fileWatcher.watcher).toBeNull();
    });

    it('should create FileWatcher with default options', () => {
      fileWatcher = new FileWatcher('/test/path');

      expect(fileWatcher.options).toEqual({
        ignored: /[\/\\]\./,
        persistent: true
      });
    });

    it('should create FileWatcher with custom options', () => {
      const customOptions = { ignored: /\.tmp$/, persistent: false };
      fileWatcher = new FileWatcher('/test/path', customOptions);

      expect(fileWatcher.options).toEqual({
        ignored: /\.tmp$/,
        persistent: false
      });
    });
  });

  describe('start', () => {
    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
    });

    it('should start file watching successfully', () => {
      const result = fileWatcher.start();

      expect(chokidar.watch).toHaveBeenCalledWith('/test/path', {
        ignored: /[\/\\]\./,
        persistent: true
      });
      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(result).toBe(mockWatcher);
    });

    it('should throw error if watcher is already started', () => {
      fileWatcher.start();

      expect(() => {
        fileWatcher.start();
      }).toThrow('ファイル監視は既に開始されています');
    });

    it('should throw error if watch path is not provided', () => {
      fileWatcher.watchPath = null;

      expect(() => {
        fileWatcher.start();
      }).toThrow('監視パスが指定されていません');
    });

    it('should throw error if watch path is empty string', () => {
      fileWatcher.watchPath = '';

      expect(() => {
        fileWatcher.start();
      }).toThrow('監視パスが指定されていません');
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
    });

    it('should stop file watching', () => {
      fileWatcher.start();
      fileWatcher.stop();

      expect(mockWatcher.close).toHaveBeenCalled();
      expect(fileWatcher.watcher).toBeNull();
    });

    it('should not throw error when stopping already stopped watcher', () => {
      expect(() => {
        fileWatcher.stop();
      }).not.toThrow();
    });
  });

  describe('isMp3File', () => {
    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
    });

    it('should return true for .mp3 files', () => {
      expect(fileWatcher.isMp3File('/path/to/file.mp3')).toBe(true);
      expect(fileWatcher.isMp3File('/path/to/file.MP3')).toBe(true);
      expect(fileWatcher.isMp3File('file.mp3')).toBe(true);
    });

    it('should return false for non-mp3 files', () => {
      expect(fileWatcher.isMp3File('/path/to/file.txt')).toBe(false);
      expect(fileWatcher.isMp3File('/path/to/file.wav')).toBe(false);
      expect(fileWatcher.isMp3File('/path/to/file')).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      expect(fileWatcher.isMp3File(null)).toBe(false);
      expect(fileWatcher.isMp3File(undefined)).toBe(false);
      expect(fileWatcher.isMp3File('')).toBe(false);
      expect(fileWatcher.isMp3File(123)).toBe(false);
      expect(fileWatcher.isMp3File({})).toBe(false);
    });
  });

  describe('getFileName', () => {
    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
    });

    it('should extract filename from full path', () => {
      expect(fileWatcher.getFileName('/path/to/file.mp3')).toBe('file.mp3');
      expect(fileWatcher.getFileName('/Users/test/music.mp3')).toBe('music.mp3');
      expect(fileWatcher.getFileName('file.mp3')).toBe('file.mp3');
    });

    it('should handle paths with multiple extensions', () => {
      expect(fileWatcher.getFileName('/path/file.backup.mp3')).toBe('file.backup.mp3');
    });

    it('should handle invalid inputs', () => {
      expect(fileWatcher.getFileName(null)).toBe('');
      expect(fileWatcher.getFileName(undefined)).toBe('');
      expect(fileWatcher.getFileName('')).toBe('');
      expect(fileWatcher.getFileName(123)).toBe('');
    });
  });

  describe('handleNewMp3File', () => {
    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
    });

    it('should process MP3 file and return filename', () => {
      const filePath = '/path/to/test.mp3';
      const result = fileWatcher.handleNewMp3File(filePath);

      expect(console.log).toHaveBeenCalledWith(`MP3ファイル処理中: ${filePath}`);
      expect(console.log).toHaveBeenCalledWith('ファイル名: test.mp3');
      expect(result).toBe('test.mp3');
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      fileWatcher.handleError(error);

      expect(console.error).toHaveBeenCalledWith('ファイル監視システムエラー:', error);
    });
  });

  describe('isWatching', () => {
    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
    });

    it('should return false when not watching', () => {
      expect(fileWatcher.isWatching()).toBe(false);
    });

    it('should return true when watching', () => {
      fileWatcher.start();
      expect(fileWatcher.isWatching()).toBe(true);
    });

    it('should return false after stopping', () => {
      fileWatcher.start();
      fileWatcher.stop();
      expect(fileWatcher.isWatching()).toBe(false);
    });
  });

  describe('event handlers', () => {
    let addHandler, errorHandler, readyHandler;

    beforeEach(() => {
      fileWatcher = new FileWatcher('/test/path');
      jest.spyOn(fileWatcher, 'handleNewMp3File');
      jest.spyOn(fileWatcher, 'handleError');
      
      fileWatcher.start();
      
      const calls = mockWatcher.on.mock.calls;
      addHandler = calls.find(call => call[0] === 'add')[1];
      errorHandler = calls.find(call => call[0] === 'error')[1];
      readyHandler = calls.find(call => call[0] === 'ready')[1];
    });

    describe('add event handler', () => {
      it('should handle MP3 file addition', () => {
        const mp3Path = '/test/file.mp3';
        addHandler(mp3Path);

        expect(console.log).toHaveBeenCalledWith(`新しいMP3ファイルが検出されました: ${mp3Path}`);
        expect(fileWatcher.handleNewMp3File).toHaveBeenCalledWith(mp3Path);
      });

      it('should ignore non-MP3 files', () => {
        const txtPath = '/test/file.txt';
        addHandler(txtPath);

        expect(console.log).not.toHaveBeenCalledWith(`新しいMP3ファイルが検出されました: ${txtPath}`);
        expect(fileWatcher.handleNewMp3File).not.toHaveBeenCalled();
      });
    });

    describe('error event handler', () => {
      it('should handle errors', () => {
        const error = new Error('Watcher error');
        errorHandler(error);

        expect(console.log).toHaveBeenCalledWith(`ファイル監視エラー: ${error}`);
        expect(fileWatcher.handleError).toHaveBeenCalledWith(error);
      });
    });

    describe('ready event handler', () => {
      it('should log ready message', () => {
        readyHandler();

        expect(console.log).toHaveBeenCalledWith('ファイル監視を開始しました: /test/path');
        expect(console.log).toHaveBeenCalledWith('新しいMP3ファイルの作成を監視中...');
      });
    });
  });
});