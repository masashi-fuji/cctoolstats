/**
 * Table formatter
 */

import Table from 'cli-table3'
import chalk from 'chalk'

export interface TableFormatterOptions {
  maxWidth?: number;
  showPercentages?: boolean;
  showHeader?: boolean;
  columnSeparator?: string;
  improvedFormat?: boolean;
  useColors?: boolean;
  useThousandSeparator?: boolean;
  showSummaryRow?: boolean;
}

export class TableFormatter {
  private options: TableFormatterOptions;
  
  constructor(options: TableFormatterOptions = {}) {
    this.options = {
      maxWidth: options.maxWidth,
      showPercentages: options.showPercentages !== false,
      showHeader: options.showHeader !== false,
      columnSeparator: options.columnSeparator || '  ',
      improvedFormat: options.improvedFormat || false,
      useColors: options.useColors || false,
      useThousandSeparator: options.useThousandSeparator || false,
      showSummaryRow: options.showSummaryRow || false
    };
  }
  
  /**
   * Format number with thousand separators
   */
  private formatNumber(num: number): string {
    if (this.options.useThousandSeparator) {
      return num.toLocaleString('en-US');
    }
    return num.toString();
  }
  
  /**
   * Apply color based on percentage
   */
  private applyColor(text: string, percentage: number): string {
    if (!this.options.useColors) {
      return text;
    }
    
    if (percentage > 50) {
      return chalk.green(text);
    } else if (percentage >= 20) {
      return chalk.yellow(text);
    } else {
      return chalk.gray(text);
    }
  }
  
  /**
   * Format tool statistics as a table
   */
  formatToolStats(data: any): string {
    if (data.totalInvocations === 0) {
      return 'No tool invocations found';
    }
    
    const lines: string[] = [];
    
    if (this.options.showHeader) {
      lines.push('Tool Usage Statistics');
      lines.push('=' .repeat(Math.min(50, this.options.maxWidth || 50)));
    }
    
    // Sort tools by count (descending)
    const sortedTools = Object.entries(data.toolCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    
    // Build table
    let tableOptions: any;
    
    if (this.options.improvedFormat) {
      // Improved format: combine percentage and count
      tableOptions = {
        head: ['Tool', 'Usage', 'Percentage & Count'],
        style: {
          head: ['cyan']
        },
        colAligns: ['left', 'right', 'right']
      };
    } else {
      tableOptions = {
        head: this.options.showPercentages 
          ? ['Tool', 'Count', 'Percentage']
          : ['Tool', 'Count'],
        style: {
          head: ['cyan']
        }
      };
    }
    
    // Only add colWidths if maxWidth is specified
    if (this.options.maxWidth) {
      tableOptions.colWidths = this.calculateColumnWidths(this.options.maxWidth);
    }
    
    const table = new Table(tableOptions);
    
    for (const [tool, count] of sortedTools) {
      if (this.options.improvedFormat) {
        const percentage = data.toolPercentages[tool];
        const formattedCount = this.formatNumber(count as number);
        const percentageText = `${percentage.toFixed(2)}%`;
        const combinedText = `${percentageText} (${formattedCount})`;
        
        const row = [
          tool,
          formattedCount,
          this.applyColor(combinedText, percentage)
        ];
        table.push(row);
      } else {
        const row: any[] = [tool, count];
        if (this.options.showPercentages) {
          row.push(`${data.toolPercentages[tool].toFixed(2)}%`);
        }
        table.push(row);
      }
    }
    
    // Add summary row if requested
    if (this.options.improvedFormat && this.options.showSummaryRow) {
      table.push([
        chalk.bold('Total'),
        chalk.bold(this.formatNumber(data.totalInvocations)),
        chalk.bold('100.00%')
      ]);
    }
    
    lines.push(table.toString());
    
    // Format total line
    const totalLine = this.options.useThousandSeparator 
      ? `Total: ${this.formatNumber(data.totalInvocations)}`
      : `Total: ${data.totalInvocations}`;
    lines.push(totalLine);
    
    return lines.join('\n');
  }
  
  /**
   * Format subagent statistics as a table
   */
  formatSubagentStats(data: any): string {
    if (data.totalInvocations === 0) {
      return 'No subagent invocations found';
    }
    
    const lines: string[] = [];
    
    if (this.options.showHeader) {
      lines.push('Subagent Usage Statistics');
      lines.push('=' .repeat(Math.min(50, this.options.maxWidth || 50)));
    }
    
    // Sort agents by count (descending)
    const sortedAgents = Object.entries(data.agentCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    
    // Build table
    let tableOptions: any;
    
    if (this.options.improvedFormat) {
      // Improved format: combine percentage and count
      tableOptions = {
        head: ['Subagent', 'Usage', 'Percentage & Count'],
        style: {
          head: ['cyan']
        },
        colAligns: ['left', 'right', 'right']
      };
    } else {
      tableOptions = {
        head: this.options.showPercentages 
          ? ['Subagent', 'Count', 'Percentage']
          : ['Subagent', 'Count'],
        style: {
          head: ['cyan']
        }
      };
    }
    
    // Only add colWidths if maxWidth is specified
    if (this.options.maxWidth) {
      tableOptions.colWidths = this.calculateColumnWidths(this.options.maxWidth);
    }
    
    const table = new Table(tableOptions);
    
    for (const [agent, count] of sortedAgents) {
      if (this.options.improvedFormat) {
        const percentage = data.agentPercentages[agent];
        const formattedCount = this.formatNumber(count as number);
        const percentageText = `${percentage.toFixed(2)}%`;
        const combinedText = `${percentageText} (${formattedCount})`;
        
        const row = [
          agent,
          formattedCount,
          this.applyColor(combinedText, percentage)
        ];
        table.push(row);
      } else {
        const row: any[] = [agent, count];
        if (this.options.showPercentages) {
          row.push(`${data.agentPercentages[agent].toFixed(2)}%`);
        }
        table.push(row);
      }
    }
    
    // Add summary row if requested
    if (this.options.improvedFormat && this.options.showSummaryRow) {
      table.push([
        chalk.bold('Total'),
        chalk.bold(this.formatNumber(data.totalInvocations)),
        chalk.bold('100.00%')
      ]);
    }
    
    lines.push(table.toString());
    
    // Format total line
    const totalLine = this.options.useThousandSeparator 
      ? `Total: ${this.formatNumber(data.totalInvocations)}`
      : `Total: ${data.totalInvocations}`;
    lines.push(totalLine);
    
    return lines.join('\n');
  }
  
  /**
   * Format combined statistics (both tools and subagents)
   */
  formatCombinedStats(toolData: any, subagentData: any): string {
    const lines: string[] = [];
    
    lines.push(this.formatToolStats(toolData));
    lines.push('');  // Empty line between sections
    lines.push(this.formatSubagentStats(subagentData));
    
    return lines.join('\n');
  }
  
  /**
   * Calculate column widths based on max width
   */
  private calculateColumnWidths(maxWidth: number): number[] {
    const numColumns = this.options.showPercentages ? 3 : 2;
    const borderWidth = numColumns + 1; // Account for borders
    const availableWidth = maxWidth - borderWidth;
    
    if (numColumns === 3) {
      // Tool/Agent name gets more space
      return [
        Math.floor(availableWidth * 0.5),
        Math.floor(availableWidth * 0.25),
        Math.floor(availableWidth * 0.25)
      ];
    } else {
      return [
        Math.floor(availableWidth * 0.7),
        Math.floor(availableWidth * 0.3)
      ];
    }
  }
}

// Keep backward compatibility
export interface ToolStats {
  name: string
  count: number
  successRate: number
  averageDuration?: number
  errors: number
}

export interface SubagentStats {
  name: string
  count: number
  successRate: number
  averageDuration?: number
  errors: number
}

export function formatTable(data: ToolStats[] | SubagentStats[]): string {
  const table = new Table({
    head: ['Name', 'Count', 'Success Rate', 'Avg Duration', 'Errors'],
    style: {
      head: ['cyan']
    }
  })

  for (const item of data) {
    table.push([
      item.name,
      item.count,
      `${item.successRate}%`,
      item.averageDuration || 'N/A',
      item.errors
    ])
  }
  
  return table.toString()
}