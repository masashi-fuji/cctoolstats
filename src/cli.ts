#!/usr/bin/env node
/**
 * cctoolstats CLI - Commander.js version
 * Command-line interface for analyzing Claude Code tool usage
 */

import { Command } from 'commander'
import { readFileSync, writeFileSync, createReadStream, realpathSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as path from 'path'
import * as os from 'os'
import { findClaudeLogFiles } from './utils/file-finder.js'
import { StreamParser } from './parser/stream-parser.js'
import { ToolAnalyzer } from './analyzer/tool.js'
import { SubagentAnalyzer } from './analyzer/subagent.js'
import { TableFormatter } from './formatters/table.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))
const version = packageJson.version as string

const program = new Command()

program
  .name('cctoolstats')
  .description('Analyze Claude Code tool usage statistics')
  .version(version)
  .argument('[paths...]', 'directories or log files to analyze')
  .option('-f, --format <format>', 'output format (table, json, csv)', 'table')
  .option('-o, --output <file>', 'output to file instead of stdout')
  .option('-v, --verbose', 'enable verbose output', false)
  .option('--color', 'force colored output')
  .option('--no-color', 'disable colored output')
  .option('--thousand-separator', 'format numbers with thousand separators', false)
  .option('--current', 'analyze current project only (default)', false)
  .option('--all', 'analyze all projects', false)
  .option('--project <path>', 'analyze specific project by path')
  .addHelpText('after', `
Project Selection:
  --current              Analyze current project only [default]
  --all                  Analyze all projects
  --project <path>       Analyze specific project by path

Examples:
  $ cctoolstats                                    # Analyze current directory (default)
  $ cctoolstats ~/project1 ~/project2              # Analyze multiple project directories
  $ cctoolstats --current                          # Explicitly analyze current project
  $ cctoolstats --all                              # Analyze all projects
  $ cctoolstats --project /path/to/project         # Analyze specific project
  $ cctoolstats --format json ~/myproject          # JSON format for specific project
  $ cctoolstats file.jsonl                         # Analyze specific file (backward compatibility)
  $ cctoolstats --all --format json                # All projects as JSON
  $ cctoolstats --output results.csv --format csv  # Save as CSV file`)

export async function run(argv: string[]): Promise<void> {
  // Ensure argv array has the proper format for Commander
  const fullArgv = argv[0] && argv[0].includes('node') 
    ? argv 
    : ['node', 'cli.ts', ...argv]
  
  // Parse arguments - Commander will handle help and version automatically
  program.parse(fullArgv, { from: 'node' })
  const options = program.opts()
  const paths = program.args

  // Validate format
  const validFormats = ['table', 'json', 'csv']
  if (!validFormats.includes(options.format)) {
    console.error(`Error: Invalid format '${options.format}'. Valid formats are: ${validFormats.join(', ')}`)
    process.exit(1)
  }

  // Determine which log files to use
  let logFiles: string[] = []
  
  if (paths.length > 0) {
    // Process provided paths (directories or files)
    const { statSync } = await import('fs')
    
    for (const pathItem of paths) {
      try {
        // Expand ~ to home directory and resolve symlinks
        const expandedPath = pathItem.replace(/^~/, os.homedir())
        const resolvedPath = realpathSync(expandedPath)
        
        const stat = statSync(resolvedPath)
        if (stat.isDirectory()) {
          // It's a directory - find transcript files in it
          const dirFiles = await findClaudeLogFiles(resolvedPath)
          logFiles.push(...dirFiles)
        } else if (resolvedPath.endsWith('.jsonl')) {
          // It's a JSONL file - use directly (backward compatibility)
          logFiles.push(resolvedPath)
        } else {
          console.warn(`Warning: Skipping non-JSONL file: ${pathItem}`)
        }
      } catch (error) {
        console.warn(`Warning: Cannot access path: ${pathItem}`)
      }
    }
    
    if (logFiles.length === 0) {
      console.error('Error: No valid transcript files found in specified paths')
      process.exit(1)
    }
  } else {
    // Use project selection options
    if (options.all) {
      // Get all available log files
      logFiles = await findClaudeLogFiles()
    } else if (options.project) {
      // Get log files for specific project
      logFiles = await findClaudeLogFiles(options.project)
    } else {
      // Default: current project (explicitly set --current or no option)
      const currentProject = process.cwd()
      logFiles = await findClaudeLogFiles(currentProject)
    }

    if (logFiles.length === 0) {
      if (options.all) {
        console.warn('No Claude log files found in ~/.claude/projects/ or ~/.config/claude/projects/')
      } else if (options.project) {
        console.warn(`No Claude log files found for project: ${options.project}`)
      } else {
        console.warn(`No Claude log files found for current project: ${process.cwd()}`)
      }
      console.warn('Please ensure Claude Code has been used and generated logs.')
    }
  }

  try {
    // Collect all entries from all files
    const allEntries: any[] = []
    
    for (const filePath of logFiles) {
      if (options.verbose) {
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
    
    switch (options.format) {
      case 'json':
        output = formatJson(toolStats, subagentStats)
        break
      case 'csv':
        output = formatCsv(toolStats, subagentStats)
        break
      case 'table':
      default:
        // Determine if colors should be used
        const useColors = options.color !== undefined 
          ? options.color 
          : process.stdout.isTTY  // Auto-detect based on TTY
        
        const formatter = new TableFormatter({
          useColors: useColors,
          useThousandSeparator: options.thousandSeparator
        })
        output = formatter.formatCombinedStats(toolStats, subagentStats)
        break
    }
    
    // Output results
    if (options.output) {
      writeFileSync(options.output, output)
      console.log(`Output saved to ${options.output}`)
    } else {
      console.log(output)
    }
    
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`)
    process.exit(1)
  }
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

// For backward compatibility, export parseArgs function that converts to Commander options
export interface CliArgs {
  paths: string[]
  format: string
  output?: string
  verbose: boolean
  help: boolean
  version: boolean
  color?: boolean
  thousandSeparator: boolean
  current: boolean
  all: boolean
  project?: string
}

export function parseArgs(args: string[]): CliArgs {
  // Create a new program instance for parsing
  const testProgram = new Command()
  testProgram
    .allowUnknownOption()
    .option('-f, --format <format>', 'format', 'table')
    .option('-o, --output <file>', 'output file')
    .option('-v, --verbose', 'verbose', false)
    .option('-h, --help', 'help', false)
    .option('--version', 'version', false)
    .option('--color', 'force color')
    .option('--no-color', 'no color')
    .option('--thousand-separator', 'thousand separator', false)
    .option('--current', 'current project', false)
    .option('--all', 'all projects', false)
    .option('--project <path>', 'specific project')
    .argument('[paths...]', 'directories or files to analyze')

  testProgram.parse(['node', 'cli.ts', ...args], { from: 'node' })
  const opts = testProgram.opts()
  const paths = testProgram.args

  // Handle project selection logic - last option wins
  let current = true  // default
  let all = false
  let project = undefined

  // Process in order to let last option win
  for (const arg of args) {
    if (arg === '--current') {
      current = true
      all = false
      project = undefined
    } else if (arg === '--all') {
      all = true
      current = false
      project = undefined
    } else if (arg === '--project') {
      // Find the next arg as the project path
      const idx = args.indexOf(arg)
      if (idx !== -1 && idx + 1 < args.length) {
        project = args[idx + 1]
        current = false
        all = false
      }
    }
  }

  // If no project option was specified, default to current
  if (!args.includes('--current') && !args.includes('--all') && !args.includes('--project')) {
    current = true
    all = false
    project = undefined
  }

  return {
    paths: paths,
    format: opts.format || 'table',
    output: opts.output,
    verbose: opts.verbose || false,
    help: opts.help || false,
    version: opts.version || false,
    color: opts.color,
    thousandSeparator: opts.thousandSeparator || false,
    current,
    all,
    project
  }
}

// Main CLI entry point
// Always run when imported as a CLI tool (from bin/cctoolstats.js or directly)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('/cctoolstats.js')) {
  run(process.argv).catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}