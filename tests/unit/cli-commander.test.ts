import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseArgs, run } from '../../src/cli-commander';
import * as path from 'path';
import * as os from 'os';
import * as fileFinder from '../../src/utils/file-finder';

vi.mock('../../src/utils/file-finder', () => ({
  findClaudeLogFiles: vi.fn()
}));

describe('CLI Commander', () => {
  describe('parseArgs', () => {
    it('should parse default arguments', () => {
      const args = parseArgs([]);
      expect(args.paths).toEqual([]);
      expect(args.format).toBe('table');
      expect(args.output).toBeUndefined();
      expect(args.verbose).toBe(false);
      expect(args.help).toBe(false);
      expect(args.version).toBe(false);
    });

    it('should parse path arguments', () => {
      const args = parseArgs(['/path/to/file1.jsonl', '/path/to/file2.jsonl']);
      expect(args.paths).toEqual(['/path/to/file1.jsonl', '/path/to/file2.jsonl']);
    });

    it('should parse format option', () => {
      const args = parseArgs(['--format', 'json']);
      expect(args.format).toBe('json');
    });

    it('should parse short format option', () => {
      const args = parseArgs(['-f', 'csv']);
      expect(args.format).toBe('csv');
    });

    it('should parse output option', () => {
      const args = parseArgs(['--output', 'result.txt']);
      expect(args.output).toBe('result.txt');
    });

    it('should parse short output option', () => {
      const args = parseArgs(['-o', 'result.txt']);
      expect(args.output).toBe('result.txt');
    });

    it('should parse verbose flag', () => {
      const args = parseArgs(['--verbose']);
      expect(args.verbose).toBe(true);
    });

    it('should parse short verbose flag', () => {
      const args = parseArgs(['-v']);
      expect(args.verbose).toBe(true);
    });

    it('should parse help flag', () => {
      const args = parseArgs(['--help']);
      expect(args.help).toBe(true);
    });

    it('should parse short help flag', () => {
      const args = parseArgs(['-h']);
      expect(args.help).toBe(true);
    });

    it('should parse version flag', () => {
      const args = parseArgs(['--version']);
      expect(args.version).toBe(true);
    });

    it('should parse combined arguments', () => {
      const args = parseArgs([
        '/path/to/file.jsonl',
        '--format', 'json',
        '--output', 'result.json',
        '--verbose'
      ]);
      expect(args.paths).toEqual(['/path/to/file.jsonl']);
      expect(args.format).toBe('json');
      expect(args.output).toBe('result.json');
      expect(args.verbose).toBe(true);
    });

    it('should parse color option', () => {
      const args = parseArgs(['--color']);
      expect(args.color).toBe(true);
    });

    it('should parse no-color option', () => {
      const args = parseArgs(['--no-color']);
      expect(args.color).toBe(false);
    });

    it('should parse improved option', () => {
      const args = parseArgs(['--improved']);
      expect(args.improved).toBe(true);
    });

    it('should parse thousand-separator option', () => {
      const args = parseArgs(['--thousand-separator']);
      expect(args.thousandSeparator).toBe(true);
    });

    describe('project selection options', () => {
      it('should parse --current option', () => {
        const args = parseArgs(['--current']);
        expect(args.current).toBe(true);
        expect(args.all).toBe(false);
        expect(args.project).toBeUndefined();
      });

      it('should parse --all option', () => {
        const args = parseArgs(['--all']);
        expect(args.all).toBe(true);
        expect(args.current).toBe(false);
        expect(args.project).toBeUndefined();
      });

      it('should parse --project option with path', () => {
        const args = parseArgs(['--project', '/path/to/project']);
        expect(args.project).toBe('/path/to/project');
        expect(args.current).toBe(false);
        expect(args.all).toBe(false);
      });

      it('should default to current project when no project option is specified', () => {
        const args = parseArgs([]);
        expect(args.current).toBe(true);
        expect(args.all).toBe(false);
        expect(args.project).toBeUndefined();
      });

      it('should handle conflicting options (--current and --all)', () => {
        const args = parseArgs(['--current', '--all']);
        // Last option wins in Commander
        expect(args.all).toBe(true);
        expect(args.current).toBe(false);
      });

      it('should handle conflicting options (--project and --all)', () => {
        const args = parseArgs(['--project', '/path/to/project', '--all']);
        // Last option wins
        expect(args.all).toBe(true);
        expect(args.project).toBeUndefined();
      });

      it('should combine project options with other options', () => {
        const args = parseArgs([
          '--all',
          '--format', 'json',
          '--verbose'
        ]);
        expect(args.all).toBe(true);
        expect(args.format).toBe('json');
        expect(args.verbose).toBe(true);
      });
    });
  });
});