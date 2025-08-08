/**
 * Table formatter
 */

import Table from 'cli-table3'
import type { ToolStats } from '../analyzer/tool.js'
import type { SubagentStats } from '../analyzer/subagent.js'

export function formatTable(data: ToolStats[] | SubagentStats[]): string {
  const table = new Table({
    head: ['Name', 'Count', 'Success Rate', 'Avg Duration', 'Errors'],
    style: {
      head: ['cyan']
    }
  })

  // TODO: Implement table formatting logic
  
  return table.toString()
}