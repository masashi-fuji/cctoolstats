/**
 * Subagent usage analyzer
 */

export interface SubagentAnalysisResult {
  totalInvocations: number;
  uniqueAgents: number;
  agentCounts: Record<string, number>;
  agentPercentages?: Record<string, number>;
  timeline?: Array<{
    agent: string;
    timestamp: string;
    index: number;
  }>;
}

export interface TopAgent {
  name: string;
  count: number;
  percentage: number;
}

export class SubagentAnalyzer {
  /**
   * Check if an entry should be counted as a subagent invocation
   */
  private isSubagentEntry(entry: any): boolean {
    // New format: direct subagent
    if (entry.type === 'subagent' && entry.name) {
      return true;
    }
    // Task tool with subagent_type
    if (entry.type === 'tool_use' && entry.name === 'Task' && entry.input?.subagent_type) {
      return true;
    }
    // Agent tool with subagent_type (similar to Task)
    if (entry.type === 'tool_use' && entry.name === 'Agent' && entry.input?.subagent_type) {
      return true;
    }
    // Old format: subagent_invocation (backward compatibility)
    if (entry.type === 'subagent_invocation' && entry.agent) {
      return true;
    }
    return false;
  }

  /**
   * Get subagent name from entry
   */
  private getSubagentName(entry: any): string | null {
    // New format: direct subagent
    if (entry.type === 'subagent' && entry.name) {
      return entry.name;
    }
    // Task tool with subagent_type
    if (entry.type === 'tool_use' && entry.name === 'Task' && entry.input?.subagent_type) {
      return entry.input.subagent_type;
    }
    // Agent tool with subagent_type (similar to Task)
    if (entry.type === 'tool_use' && entry.name === 'Agent' && entry.input?.subagent_type) {
      return entry.input.subagent_type;
    }
    // Old format: subagent_invocation
    if (entry.type === 'subagent_invocation' && entry.agent) {
      return entry.agent;
    }
    return null;
  }
  /**
   * Analyze subagent invocations from log entries
   */
  analyze(entries: any[]): SubagentAnalysisResult {
    const agentCounts: Record<string, number> = {};
    const timeline: Array<{ agent: string; timestamp: string; index: number }> = [];
    let totalInvocations = 0;
    
    entries.forEach((entry, index) => {
      if (!this.isSubagentEntry(entry)) {
        return;
      }
      
      const agent = this.getSubagentName(entry);
      if (!agent) {
        return;
      }
      
      agentCounts[agent] = (agentCounts[agent] || 0) + 1;
      totalInvocations++;
      
      if (entry.timestamp) {
        timeline.push({
          agent,
          timestamp: entry.timestamp,
          index: timeline.length
        });
      }
    });
    
    const uniqueAgents = Object.keys(agentCounts).length;
    
    // Calculate percentages
    const agentPercentages: Record<string, number> = {};
    if (totalInvocations > 0) {
      for (const [agent, count] of Object.entries(agentCounts)) {
        const percentage = (count / totalInvocations) * 100;
        agentPercentages[agent] = Math.round(percentage * 100) / 100;
      }
    }
    
    return {
      totalInvocations,
      uniqueAgents,
      agentCounts,
      agentPercentages,
      timeline
    };
  }
  
  /**
   * Get top N agents by invocation count
   */
  getTopAgents(result: SubagentAnalysisResult, limit: number): TopAgent[] {
    const agents = Object.entries(result.agentCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: result.agentPercentages?.[name] || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return agents;
  }
  
  /**
   * Filter entries by time range
   */
  filterByTimeRange(entries: any[], startTime: string, endTime: string): any[] {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    return entries.filter(entry => {
      if (!entry.timestamp) return false;
      const timestamp = new Date(entry.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }
  
  /**
   * Group invocations by session
   */
  groupBySession(entries: any[]): Record<string, any[]> {
    const sessions: Record<string, any[]> = {};
    
    entries.forEach(entry => {
      if (!this.isSubagentEntry(entry) || !entry.sessionId) {
        return;
      }
      
      if (!sessions[entry.sessionId]) {
        sessions[entry.sessionId] = [];
      }
      sessions[entry.sessionId].push(entry);
    });
    
    return sessions;
  }
}

// Keep the old interface for backward compatibility
export interface SubagentStats {
  name: string
  count: number
  successRate: number
  averageDuration?: number
  errors: number
}

export function analyzeSubagents(entries: any[]): SubagentStats[] {
  const analyzer = new SubagentAnalyzer();
  const result = analyzer.analyze(entries);
  
  return Object.entries(result.agentCounts).map(([name, count]) => ({
    name,
    count,
    successRate: 100, // Default for now
    averageDuration: 0,
    errors: 0
  }));
}