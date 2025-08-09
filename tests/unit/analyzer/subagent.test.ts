import { describe, it, expect } from 'vitest';
import { SubagentAnalyzer } from '../../../src/analyzer/subagent';

describe('SubagentAnalyzer', () => {
  describe('analyze', () => {
    it('should count subagent invocations', () => {
      const entries = [
        {
          type: 'subagent',
          name: 'code-reviewer',
          timestamp: '2025-01-01T00:00:00Z'
        },
        {
          type: 'subagent',
          name: 'test-writer',
          timestamp: '2025-01-01T00:01:00Z'
        },
        {
          type: 'subagent',
          name: 'code-reviewer',
          timestamp: '2025-01-01T00:02:00Z'
        },
        {
          type: 'tool_use',
          name: 'Bash',
          timestamp: '2025-01-01T00:03:00Z'
        }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.totalInvocations).toBe(3);
      expect(result.uniqueAgents).toBe(2);
      expect(result.agentCounts).toEqual({
        'code-reviewer': 2,
        'test-writer': 1
      });
    });

    it('should handle empty input', () => {
      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze([]);

      expect(result.totalInvocations).toBe(0);
      expect(result.uniqueAgents).toBe(0);
      expect(result.agentCounts).toEqual({});
    });

    it('should handle entries without subagent invocations', () => {
      const entries = [
        { type: 'tool_use', name: 'Bash' },
        { type: 'message', content: 'Hello' },
        { type: 'error', message: 'Error occurred' }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.totalInvocations).toBe(0);
      expect(result.uniqueAgents).toBe(0);
      expect(result.agentCounts).toEqual({});
    });

    it('should calculate agent percentages', () => {
      const entries = [
        { type: 'subagent', name: 'agent-a' },
        { type: 'subagent', name: 'agent-a' },
        { type: 'subagent', name: 'agent-b' },
        { type: 'subagent', name: 'agent-b' },
        { type: 'subagent', name: 'agent-b' },
        { type: 'subagent', name: 'agent-c' }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.agentPercentages).toEqual({
        'agent-a': 33.33,
        'agent-b': 50.00,
        'agent-c': 16.67
      });
    });

    it('should track agent timeline', () => {
      const entries = [
        {
          type: 'subagent',
          name: 'agent-a',
          timestamp: '2025-01-01T10:00:00Z'
        },
        {
          type: 'subagent',
          name: 'agent-b',
          timestamp: '2025-01-01T10:05:00Z'
        },
        {
          type: 'subagent',
          name: 'agent-a',
          timestamp: '2025-01-01T10:10:00Z'
        }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.timeline).toHaveLength(3);
      expect(result.timeline[0]).toEqual({
        agent: 'agent-a',
        timestamp: '2025-01-01T10:00:00Z',
        index: 0
      });
      expect(result.timeline[1]).toEqual({
        agent: 'agent-b',
        timestamp: '2025-01-01T10:05:00Z',
        index: 1
      });
      expect(result.timeline[2]).toEqual({
        agent: 'agent-a',
        timestamp: '2025-01-01T10:10:00Z',
        index: 2
      });
    });
  });

  describe('getTopAgents', () => {
    it('should return top N agents by invocation count', () => {
      const entries = [
        { type: 'subagent', name: 'agent-a' },
        { type: 'subagent', name: 'agent-a' },
        { type: 'subagent', name: 'agent-a' },
        { type: 'subagent', name: 'agent-b' },
        { type: 'subagent', name: 'agent-b' },
        { type: 'subagent', name: 'agent-c' },
        { type: 'subagent', name: 'agent-d' }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);
      const topAgents = analyzer.getTopAgents(result, 2);

      expect(topAgents).toHaveLength(2);
      expect(topAgents[0]).toEqual({ name: 'agent-a', count: 3, percentage: 42.86 });
      expect(topAgents[1]).toEqual({ name: 'agent-b', count: 2, percentage: 28.57 });
    });

    it('should handle request for more agents than available', () => {
      const entries = [
        { type: 'subagent', name: 'agent-a' },
        { type: 'subagent', name: 'agent-b' }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);
      const topAgents = analyzer.getTopAgents(result, 10);

      expect(topAgents).toHaveLength(2);
    });
  });

  describe('filterByTimeRange', () => {
    it('should filter entries by time range', () => {
      const entries = [
        {
          type: 'subagent',
          name: 'agent-a',
          timestamp: '2025-01-01T09:00:00Z'
        },
        {
          type: 'subagent',
          name: 'agent-b',
          timestamp: '2025-01-01T10:00:00Z'
        },
        {
          type: 'subagent',
          name: 'agent-c',
          timestamp: '2025-01-01T11:00:00Z'
        },
        {
          type: 'subagent',
          name: 'agent-d',
          timestamp: '2025-01-01T12:00:00Z'
        }
      ];

      const analyzer = new SubagentAnalyzer();
      const filtered = analyzer.filterByTimeRange(
        entries,
        '2025-01-01T10:00:00Z',
        '2025-01-01T11:59:59Z'
      );

      const result = analyzer.analyze(filtered);
      expect(result.totalInvocations).toBe(2);
      expect(result.agentCounts).toEqual({
        'agent-b': 1,
        'agent-c': 1
      });
    });
  });

  describe('Task tool with subagent_type', () => {
    it('should detect subagents from Task tool with subagent_type', () => {
      const entries = [
        { type: 'subagent', name: 'agent-a' },
        { type: 'tool_use', name: 'Task', input: { subagent_type: 'code-reviewer' } },
        { type: 'tool_use', name: 'Task', input: { subagent_type: 'test-writer' } },
        { type: 'tool_use', name: 'Task', input: {} }, // Task without subagent_type
        { type: 'tool_use', name: 'Bash' }, // Regular tool
        { type: 'tool_use', name: 'Task', input: { subagent_type: 'code-reviewer' } }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.totalInvocations).toBe(4); // agent-a + 3 Task with subagent_type
      expect(result.uniqueAgents).toBe(3);
      expect(result.agentCounts).toEqual({
        'agent-a': 1,
        'code-reviewer': 2,
        'test-writer': 1
      });
    });

    it('should handle mixed Task tool invocations', () => {
      const entries = [
        { type: 'tool_use', name: 'Task', input: { subagent_type: 'agent-a' } },
        { type: 'tool_use', name: 'Task', input: { command: 'some command' } }, // Task for general command
        { type: 'tool_use', name: 'Task', input: { subagent_type: 'agent-b' } },
        { type: 'subagent', name: 'agent-c' }
      ];

      const analyzer = new SubagentAnalyzer();
      const result = analyzer.analyze(entries);

      expect(result.totalInvocations).toBe(3); // Two Task with subagent_type + one direct subagent
      expect(result.agentCounts).toEqual({
        'agent-a': 1,
        'agent-b': 1,
        'agent-c': 1
      });
    });
  });

  describe('groupBySession', () => {
    it('should group invocations by session', () => {
      const entries = [
        {
          type: 'subagent',
          name: 'agent-a',
          sessionId: 'session-1'
        },
        {
          type: 'subagent',
          name: 'agent-b',
          sessionId: 'session-1'
        },
        {
          type: 'subagent',
          name: 'agent-a',
          sessionId: 'session-2'
        },
        {
          type: 'subagent',
          name: 'agent-c',
          sessionId: 'session-2'
        }
      ];

      const analyzer = new SubagentAnalyzer();
      const sessions = analyzer.groupBySession(entries);

      expect(Object.keys(sessions)).toHaveLength(2);
      expect(sessions['session-1']).toHaveLength(2);
      expect(sessions['session-2']).toHaveLength(2);
    });
  });
});