import { describe, it, expect } from 'vitest';
import { ToolAnalyzer } from '../../../src/analyzer/tool';

describe('ToolAnalyzer', () => {
  describe('analyze', () => {
    it('should count tool invocations', () => {
      const entries = [
        {
          type: 'tool_invocation',
          tool: 'Bash',
          timestamp: '2025-01-01T00:00:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Read',
          timestamp: '2025-01-01T00:01:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Bash',
          timestamp: '2025-01-01T00:02:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Write',
          timestamp: '2025-01-01T00:03:00Z'
        },
        {
          type: 'subagent_invocation',
          agent: 'code-reviewer',
          timestamp: '2025-01-01T00:04:00Z'
        }
      ];

      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.totalInvocations).toBe(4);
      expect(result.uniqueTools).toBe(3);
      expect(result.toolCounts).toEqual({
        'Bash': 2,
        'Read': 1,
        'Write': 1
      });
    });

    it('should handle empty input', () => {
      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze([]);

      expect(result.totalInvocations).toBe(0);
      expect(result.uniqueTools).toBe(0);
      expect(result.toolCounts).toEqual({});
    });

    it('should handle entries without tool invocations', () => {
      const entries = [
        { type: 'subagent_invocation', agent: 'test-writer' },
        { type: 'message', content: 'Hello' },
        { type: 'error', message: 'Error occurred' }
      ];

      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.totalInvocations).toBe(0);
      expect(result.uniqueTools).toBe(0);
      expect(result.toolCounts).toEqual({});
    });

    it('should calculate tool percentages', () => {
      const entries = [
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Read' },
        { type: 'tool_invocation', tool: 'Read' },
        { type: 'tool_invocation', tool: 'Write' }
      ];

      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.toolPercentages).toEqual({
        'Bash': 50.00,
        'Read': 33.33,
        'Write': 16.67
      });
    });

    it('should track tool timeline', () => {
      const entries = [
        {
          type: 'tool_invocation',
          tool: 'Bash',
          timestamp: '2025-01-01T10:00:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Read',
          timestamp: '2025-01-01T10:05:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Bash',
          timestamp: '2025-01-01T10:10:00Z'
        }
      ];

      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.timeline).toHaveLength(3);
      expect(result.timeline[0]).toEqual({
        tool: 'Bash',
        timestamp: '2025-01-01T10:00:00Z',
        index: 0
      });
      expect(result.timeline[1]).toEqual({
        tool: 'Read',
        timestamp: '2025-01-01T10:05:00Z',
        index: 1
      });
      expect(result.timeline[2]).toEqual({
        tool: 'Bash',
        timestamp: '2025-01-01T10:10:00Z',
        index: 2
      });
    });

    it('should track tool categories', () => {
      const entries = [
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Read' },
        { type: 'tool_invocation', tool: 'Write' },
        { type: 'tool_invocation', tool: 'Edit' },
        { type: 'tool_invocation', tool: 'MultiEdit' },
        { type: 'tool_invocation', tool: 'Grep' },
        { type: 'tool_invocation', tool: 'Glob' }
      ];

      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze(entries);
      const categories = analyzer.categorizeTools(result);

      expect(categories).toEqual({
        'execution': ['Bash'],
        'file_operations': ['Read', 'Write', 'Edit', 'MultiEdit'],
        'search': ['Grep', 'Glob']
      });
    });
  });

  describe('getTopTools', () => {
    it('should return top N tools by invocation count', () => {
      const entries = [
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Read' },
        { type: 'tool_invocation', tool: 'Read' },
        { type: 'tool_invocation', tool: 'Read' },
        { type: 'tool_invocation', tool: 'Write' },
        { type: 'tool_invocation', tool: 'Write' },
        { type: 'tool_invocation', tool: 'Edit' }
      ];

      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze(entries);
      const topTools = analyzer.getTopTools(result, 3);

      expect(topTools).toHaveLength(3);
      expect(topTools[0]).toEqual({ name: 'Bash', count: 4, percentage: 40.00 });
      expect(topTools[1]).toEqual({ name: 'Read', count: 3, percentage: 30.00 });
      expect(topTools[2]).toEqual({ name: 'Write', count: 2, percentage: 20.00 });
    });

    it('should handle request for more tools than available', () => {
      const entries = [
        { type: 'tool_invocation', tool: 'Bash' },
        { type: 'tool_invocation', tool: 'Read' }
      ];

      const analyzer = new ToolAnalyzer();
      const result = analyzer.analyze(entries);
      const topTools = analyzer.getTopTools(result, 10);

      expect(topTools).toHaveLength(2);
    });
  });

  describe('filterByTimeRange', () => {
    it('should filter entries by time range', () => {
      const entries = [
        {
          type: 'tool_invocation',
          tool: 'Bash',
          timestamp: '2025-01-01T09:00:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Read',
          timestamp: '2025-01-01T10:00:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Write',
          timestamp: '2025-01-01T11:00:00Z'
        },
        {
          type: 'tool_invocation',
          tool: 'Edit',
          timestamp: '2025-01-01T12:00:00Z'
        }
      ];

      const analyzer = new ToolAnalyzer();
      const filtered = analyzer.filterByTimeRange(
        entries,
        '2025-01-01T10:00:00Z',
        '2025-01-01T11:59:59Z'
      );

      const result = analyzer.analyze(filtered);
      expect(result.totalInvocations).toBe(2);
      expect(result.toolCounts).toEqual({
        'Read': 1,
        'Write': 1
      });
    });
  });

  describe('getToolStatistics', () => {
    it('should calculate tool usage statistics', () => {
      const entries = [
        { type: 'tool_invocation', tool: 'Bash', duration: 100 },
        { type: 'tool_invocation', tool: 'Bash', duration: 200 },
        { type: 'tool_invocation', tool: 'Bash', duration: 300 },
        { type: 'tool_invocation', tool: 'Read', duration: 50 },
        { type: 'tool_invocation', tool: 'Read', duration: 150 }
      ];

      const analyzer = new ToolAnalyzer();
      const stats = analyzer.getToolStatistics(entries);

      expect(stats['Bash']).toEqual({
        count: 3,
        totalDuration: 600,
        averageDuration: 200,
        minDuration: 100,
        maxDuration: 300
      });

      expect(stats['Read']).toEqual({
        count: 2,
        totalDuration: 200,
        averageDuration: 100,
        minDuration: 50,
        maxDuration: 150
      });
    });
  });
});