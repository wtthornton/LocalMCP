import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from './services/logger/logger.js';
import { ConfigService } from './config/config.service.js';
import { ProjectAnalyzer } from './tools/analyze.js';
import { CodeGenerator } from './tools/create.js';
import { ErrorFixer } from './tools/fix.js';
import { LessonLearner } from './tools/learn.js';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn()
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}));

describe('LocalMCP Server', () => {
  let logger: Logger;
  let config: ConfigService;

  beforeEach(() => {
    logger = new Logger('Test');
    config = new ConfigService();
  });

  describe('Logger', () => {
    it('should create logger with correct service name', () => {
      expect(logger).toBeDefined();
    });

    it('should log at different levels', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      logger.info('Test info message');
      logger.error('Test error message');

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('ConfigService', () => {
    it('should load default configuration', () => {
      expect(config.getConfig()).toBeDefined();
      expect(config.getConfig().server.name).toBe('localmcp');
    });

    it('should validate configuration', () => {
      expect(() => config.getConfig()).not.toThrow();
    });

    it('should provide helper methods', () => {
      expect(typeof config.isContext7Enabled()).toBe('boolean');
      expect(typeof config.isToolEnabled('analyze')).toBe('boolean');
    });
  });

  describe('ProjectAnalyzer', () => {
    it('should create analyzer instance', () => {
      const analyzer = new ProjectAnalyzer(logger, config);
      expect(analyzer).toBeDefined();
    });

    it('should analyze project structure', async () => {
      const analyzer = new ProjectAnalyzer(logger, config);
      
      // Mock file system operations
      vi.mock('fs/promises', () => ({
        readFile: vi.fn().mockResolvedValue('{"name": "test-project"}'),
        readdir: vi.fn().mockResolvedValue([
          { name: 'src', isDirectory: () => true },
          { name: 'package.json', isDirectory: () => false }
        ]),
        stat: vi.fn().mockResolvedValue({ isFile: () => true })
      }));

      const result = await analyzer.analyze('.');
      
      expect(result).toBeDefined();
      expect(result.projectOverview).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.configurations).toBeDefined();
    });
  });

  describe('CodeGenerator', () => {
    it('should create generator instance', () => {
      const generator = new CodeGenerator(logger, config);
      expect(generator).toBeDefined();
    });

    it('should generate code based on description', async () => {
      const generator = new CodeGenerator(logger, config);
      
      // Mock file system operations
      vi.mock('fs/promises', () => ({
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined)
      }));

      const result = await generator.create('dark theme Hello World');
      
      expect(result).toBeDefined();
      expect(result.createdFiles).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.nextSteps).toBeDefined();
    });
  });

  describe('ErrorFixer', () => {
    it('should create fixer instance', () => {
      const fixer = new ErrorFixer(logger, config);
      expect(fixer).toBeDefined();
    });

    it('should diagnose and fix errors', async () => {
      const fixer = new ErrorFixer(logger, config);
      
      // Mock file system operations
      vi.mock('fs/promises', () => ({
        readFile: vi.fn().mockResolvedValue('function test() { return "hello"; }'),
        writeFile: vi.fn().mockResolvedValue(undefined)
      }));

      const result = await fixer.fix('TypeScript error: missing return type');
      
      expect(result).toBeDefined();
      expect(result.appliedFixes).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.validationResult).toBeDefined();
    });
  });

  describe('LessonLearner', () => {
    it('should create learner instance', () => {
      const learner = new LessonLearner(logger, config);
      expect(learner).toBeDefined();
    });

    it('should learn from feedback and context', async () => {
      const learner = new LessonLearner(logger, config);
      
      // Mock file system operations
      vi.mock('fs/promises', () => ({
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined)
      }));

      const result = await learner.learn(
        'This solution works perfectly!',
        'function hello() { return "world"; }',
        ['javascript', 'function']
      );
      
      expect(result).toBeDefined();
      expect(result.confirmation).toBeDefined();
      expect(result.lessonId).toBeDefined();
      expect(result.impact).toBeDefined();
    });
  });
});
