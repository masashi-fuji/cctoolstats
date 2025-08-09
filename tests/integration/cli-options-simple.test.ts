import { describe, it, expect } from 'vitest';
import { parseArgs } from '../../src/cli';

describe('CLI Options Parse Integration', () => {
  describe('project selection options', () => {
    it('should correctly parse --current option', () => {
      const args = parseArgs(['--current']);
      expect(args.current).toBe(true);
      expect(args.all).toBe(false);
      expect(args.project).toBeUndefined();
    });

    it('should correctly parse --all option', () => {
      const args = parseArgs(['--all']);
      expect(args.all).toBe(true);
      expect(args.current).toBe(false);
      expect(args.project).toBeUndefined();
    });

    it('should correctly parse --project option', () => {
      const projectPath = '/path/to/project';
      const args = parseArgs(['--project', projectPath]);
      expect(args.project).toBe(projectPath);
      expect(args.current).toBe(false);
      expect(args.all).toBe(false);
    });

    it('should default to current when no option specified', () => {
      const args = parseArgs([]);
      expect(args.current).toBe(true);
      expect(args.all).toBe(false);
      expect(args.project).toBeUndefined();
    });

    it('should combine project options with other CLI options', () => {
      const args = parseArgs([
        '--all',
        '--format', 'json',
        '--verbose',
        '--thousand-separator'
      ]);
      
      expect(args.all).toBe(true);
      expect(args.format).toBe('json');
      expect(args.verbose).toBe(true);
      expect(args.thousandSeparator).toBe(true);
    });

    it('should handle project option with format options', () => {
      const args = parseArgs([
        '--project', '/specific/path',
        '--format', 'csv',
        '--output', 'results.csv'
      ]);
      
      expect(args.project).toBe('/specific/path');
      expect(args.format).toBe('csv');
      expect(args.output).toBe('results.csv');
    });

    it('should prioritize explicit files over project options', () => {
      const args = parseArgs([
        'file1.jsonl',
        'file2.jsonl',
        '--all'  // This should not affect file selection
      ]);
      
      expect(args.paths).toEqual(['file1.jsonl', 'file2.jsonl']);
      expect(args.all).toBe(true); // Still parsed but won't be used when files are provided
    });
  });

  describe('option conflicts', () => {
    it('should let --all override --current', () => {
      const args = parseArgs(['--current', '--all']);
      expect(args.all).toBe(true);
      expect(args.current).toBe(false);
    });

    it('should let --project override --all', () => {
      const args = parseArgs(['--all', '--project', '/path']);
      expect(args.project).toBe('/path');
      expect(args.all).toBe(false);
      expect(args.current).toBe(false);
    });

    it('should let --current override --project', () => {
      const args = parseArgs(['--project', '/path', '--current']);
      expect(args.current).toBe(true);
      expect(args.project).toBeUndefined();
      expect(args.all).toBe(false);
    });
  });

  describe('help text validation', () => {
    it('should have all project options in parseArgs', () => {
      // Verify that the interface supports all required options
      const args = parseArgs([]);
      expect(args).toHaveProperty('current');
      expect(args).toHaveProperty('all');
      expect(args).toHaveProperty('project');
    });
  });
});