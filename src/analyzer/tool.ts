/**
 * Tool usage analyzer
 */

export interface ToolAnalysisResult {
  totalInvocations: number;
  uniqueTools: number;
  toolCounts: Record<string, number>;
  toolPercentages?: Record<string, number>;
  timeline?: Array<{
    tool: string;
    timestamp: string;
    index: number;
  }>;
}

export interface TopTool {
  name: string;
  count: number;
  percentage: number;
}

export interface ToolStatistics {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}

export class ToolAnalyzer {
  /**
   * Analyze tool invocations from log entries
   */
  analyze(entries: any[]): ToolAnalysisResult {
    const toolCounts: Record<string, number> = {};
    const timeline: Array<{ tool: string; timestamp: string; index: number }> = [];
    let totalInvocations = 0;
    
    entries.forEach((entry, index) => {
      if (entry.type === 'tool_invocation' && entry.tool) {
        const tool = entry.tool;
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        totalInvocations++;
        
        if (entry.timestamp) {
          timeline.push({
            tool,
            timestamp: entry.timestamp,
            index: timeline.length
          });
        }
      }
    });
    
    const uniqueTools = Object.keys(toolCounts).length;
    
    // Calculate percentages
    const toolPercentages: Record<string, number> = {};
    if (totalInvocations > 0) {
      for (const [tool, count] of Object.entries(toolCounts)) {
        const percentage = (count / totalInvocations) * 100;
        toolPercentages[tool] = Math.round(percentage * 100) / 100;
      }
    }
    
    return {
      totalInvocations,
      uniqueTools,
      toolCounts,
      toolPercentages,
      timeline
    };
  }
  
  /**
   * Get top N tools by invocation count
   */
  getTopTools(result: ToolAnalysisResult, limit: number): TopTool[] {
    const tools = Object.entries(result.toolCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: result.toolPercentages?.[name] || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return tools;
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
   * Categorize tools by their function
   */
  categorizeTools(result: ToolAnalysisResult): Record<string, string[]> {
    const categories: Record<string, string[]> = {
      'execution': [],
      'file_operations': [],
      'search': []
    };
    
    const toolCategories: Record<string, string> = {
      'Bash': 'execution',
      'Read': 'file_operations',
      'Write': 'file_operations',
      'Edit': 'file_operations',
      'MultiEdit': 'file_operations',
      'Grep': 'search',
      'Glob': 'search'
    };
    
    for (const tool of Object.keys(result.toolCounts)) {
      const category = toolCategories[tool];
      if (category && categories[category]) {
        categories[category].push(tool);
      }
    }
    
    return categories;
  }
  
  /**
   * Get detailed statistics for each tool
   */
  getToolStatistics(entries: any[]): Record<string, ToolStatistics> {
    const stats: Record<string, { durations: number[] }> = {};
    
    entries.forEach(entry => {
      if (entry.type === 'tool_invocation' && entry.tool && typeof entry.duration === 'number') {
        if (!stats[entry.tool]) {
          stats[entry.tool] = { durations: [] };
        }
        stats[entry.tool].durations.push(entry.duration);
      }
    });
    
    const result: Record<string, ToolStatistics> = {};
    
    for (const [tool, data] of Object.entries(stats)) {
      const durations = data.durations;
      const count = durations.length;
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);
      const averageDuration = count > 0 ? totalDuration / count : 0;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      result[tool] = {
        count,
        totalDuration,
        averageDuration,
        minDuration,
        maxDuration
      };
    }
    
    return result;
  }
}

// Keep the old interface for backward compatibility
export interface ToolStats {
  name: string
  count: number
  successRate: number
  averageDuration?: number
  errors: number
}

export function analyzeTools(entries: any[]): ToolStats[] {
  const analyzer = new ToolAnalyzer();
  const result = analyzer.analyze(entries);
  
  return Object.entries(result.toolCounts).map(([name, count]) => ({
    name,
    count,
    successRate: 100, // Default for now
    averageDuration: 0,
    errors: 0
  }));
}