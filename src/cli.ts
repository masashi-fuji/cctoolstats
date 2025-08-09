#!/usr/bin/env node
/**
 * cctoolstats CLI
 * Command-line interface for analyzing Claude Code tool usage
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as path from 'path'
import * as os from 'os'
import { findClaudeLogFiles } from './utils/file-finder.js'
import { StreamParser } from './parser/stream-parser.js'
import { ToolAnalyzer } from './analyzer/tool.js'
import { SubagentAnalyzer } from './analyzer/subagent.js'
import { TableFormatter } from './formatters/table.js'
import { createReadStream } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))
const version = packageJson.version as string

export interface CliArgs {
  paths: string[]
  format: string
  output?: string
  verbose: boolean
  help: boolean
  version: boolean
  color?: boolean
  improved: boolean
  thousandSeparator: boolean
}

export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    paths: [],
    format: 'table',
    output: undefined,
    verbose: false,
    help: false,
    version: false,
    color: undefined,  // undefined means auto-detect based on TTY
    improved: false,
    thousandSeparator: false
  }

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    
    if (arg === '--format' || arg === '-f') {
      result.format = args[++i] || 'table'
    } else if (arg === '--output' || arg === '-o') {
      result.output = args[++i]
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true
    } else if (arg === '--help' || arg === '-h') {
      result.help = true
    } else if (arg === '--version') {
      result.version = true
    } else if (arg === '--color') {
      result.color = true
    } else if (arg === '--no-color') {
      result.color = false
    } else if (arg === '--improved') {
      result.improved = true
    } else if (arg === '--thousand-separator') {
      result.thousandSeparator = true
    } else if (!arg.startsWith('-')) {
      result.paths.push(arg)
    }
    
    i++
  }

  return result
}

export async function run(args: string[]): Promise<void> {
  const parsedArgs = parseArgs(args)

  if (parsedArgs.help) {
    showHelp()
    process.exit(0)
  }

  if (parsedArgs.version) {
    showVersion()
    process.exit(0)
  }

  // Validate format
  const validFormats = ['table', 'json', 'csv']
  if (!validFormats.includes(parsedArgs.format)) {
    console.error(`Error: Invalid format '${parsedArgs.format}'. Valid formats are: ${validFormats.join(', ')}`)
    process.exit(1)
  }

  // If no paths provided, use default locations
  if (parsedArgs.paths.length === 0) {
    const defaultPaths = await findDefaultLogFiles()
    parsedArgs.paths = defaultPaths
  }

  try {
    // Collect all entries from all files
    const allEntries: any[] = []
    
    for (const filePath of parsedArgs.paths) {
      if (parsedArgs.verbose) {
        console.log(`Processing: ${filePath}`)
      }
      
      const parser = new StreamParser()
      const stream = createReadStream(filePath, { encoding: 'utf8' })
      
      // Parse raw entries and extract tool_use entries
      for await (const rawEntry of parser.parseStream(stream)) {
        // Extract tool_use entries from assistant messages
        if (rawEntry.type === 'assistant' && rawEntry.message?.content) {
          for (const content of rawEntry.message.content) {
            if (content.type === 'tool_use') {
              allEntries.push({
                type: 'tool_use',
                name: content.name,
                input: content.input,
                timestamp: rawEntry.timestamp,
                id: content.id
              })
            }
          }
        }
      }
    }
    
    // Analyze the data
    const toolAnalyzer = new ToolAnalyzer()
    const subagentAnalyzer = new SubagentAnalyzer()
    
    const toolStats = toolAnalyzer.analyze(allEntries)
    const subagentStats = subagentAnalyzer.analyze(allEntries)
    
    // Format output based on requested format
    let output: string
    
    switch (parsedArgs.format) {
      case 'json':
        output = formatJson(toolStats, subagentStats)
        break
      case 'csv':
        output = formatCsv(toolStats, subagentStats)
        break
      case 'table':
      default:
        // Determine if colors should be used
        const useColors = parsedArgs.color !== undefined 
          ? parsedArgs.color 
          : process.stdout.isTTY  // Auto-detect based on TTY
        
        const formatter = new TableFormatter({
          improvedFormat: parsedArgs.improved,
          useColors: useColors,
          useThousandSeparator: parsedArgs.thousandSeparator,
          showSummaryRow: parsedArgs.improved  // Show summary row with improved format
        })
        output = formatter.formatCombinedStats(toolStats, subagentStats)
        break
    }
    
    // Output results
    if (parsedArgs.output) {
      writeFileSync(parsedArgs.output, output)
      console.log(`Output saved to ${parsedArgs.output}`)
    } else {
      console.log(output)
    }
    
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`)
    process.exit(1)
  }
}

function showHelp(): void {
  const helpText = `Usage: cctoolstats [options] [files...]

Analyze Claude Code tool usage statistics

Options:
  -f, --format <format>  Output format (table, json, csv) [default: table]
  -o, --output <file>    Output to file instead of stdout
  -v, --verbose          Enable verbose output
  -h, --help             Display help information
  --version              Display version information
  --improved             Use improved table format with combined stats
  --color                Force colored output
  --no-color             Disable colored output
  --thousand-separator   Format numbers with thousand separators

Examples:
  cctoolstats                                    # Analyze default log locations
  cctoolstats file1.jsonl file2.jsonl           # Analyze specific files
  cctoolstats --format json                     # Output as JSON
  cctoolstats --output results.csv --format csv # Save as CSV file
  cctoolstats --improved --color                # Use improved format with colors
  cctoolstats --improved --thousand-separator   # Improved format with number formatting`
  
  console.log(helpText)
}

function showVersion(): void {
  console.log(`cctoolstats v${version}`)
}

async function findDefaultLogFiles(): Promise<string[]> {
  // Get current working directory to find project-specific log
  const currentProject = process.cwd()
  
  // Find all Claude log files, prioritizing current project
  const logFiles = await findClaudeLogFiles(currentProject)
  
  if (logFiles.length === 0) {
    console.warn('No Claude log files found in ~/.claude/projects/ or ~/.config/claude/projects/')
    console.warn('Please ensure Claude Code has been used and generated logs.')
  }
  
  return logFiles
}

function formatJson(toolStats: any, subagentStats: any): string {
  return JSON.stringify({
    tools: toolStats,
    subagents: subagentStats
  }, null, 2)
}

function formatCsv(toolStats: any, subagentStats: any): string {
  const lines: string[] = []
  
  // Header
  lines.push('Type,Name,Count,Percentage')
  
  // Tool data
  const sortedTools = Object.entries(toolStats.toolCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
  
  for (const [tool, count] of sortedTools) {
    const percentage = toolStats.toolPercentages[tool].toFixed(2)
    lines.push(`Tool,${tool},${count},${percentage}`)
  }
  
  // Subagent data
  const sortedAgents = Object.entries(subagentStats.agentCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
  
  for (const [agent, count] of sortedAgents) {
    const percentage = subagentStats.agentPercentages[agent].toFixed(2)
    lines.push(`Subagent,${agent},${count},${percentage}`)
  }
  
  return lines.join('\n')
}

// Main CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  run(process.argv.slice(2)).catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}