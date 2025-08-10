#!/usr/bin/env node
/**
 * cctoolstats CLI - Commander.js version
 * Command-line interface for analyzing Claude Code tool usage
 */

import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as path from 'path'
import * as os from 'os'
import { findClaudeLogFiles } from './utils/file-finder.js'
import { processLogFiles, formatOutput, handleOutput } from './cli-common.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))
const version = packageJson.version as string

const program = new Command()

program
  .name('cctoolstats')
  .description('Analyze Claude Code tool usage statistics')
  .version(version)
  .argument('[files...]', 'specific log files to analyze')
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
  $ cctoolstats                                    # Analyze current project (default)
  $ cctoolstats --current                          # Explicitly analyze current project
  $ cctoolstats --all                              # Analyze all projects
  $ cctoolstats --project /path/to/project         # Analyze specific project
  $ cctoolstats file1.jsonl file2.jsonl           # Analyze specific files
  $ cctoolstats --all --format json               # All projects as JSON
  $ cctoolstats --output results.csv --format csv # Save as CSV file`)

export async function run(argv: string[]): Promise<void> {
  program.parse(argv, { from: 'node' })
  const options = program.opts()
  const files = program.args

  // Validate format
  const validFormats = ['table', 'json', 'csv']
  if (!validFormats.includes(options.format)) {
    console.error(`Error: Invalid format '${options.format}'. Valid formats are: ${validFormats.join(', ')}`)
    process.exit(1)
  }

  // Determine which log files to use
  let logFiles: string[] = []
  
  if (files.length > 0) {
    // Use explicitly provided files
    logFiles = files
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
    // Process log files and analyze data
    const { toolStats, subagentStats } = await processLogFiles(logFiles, {
      verbose: options.verbose
    })
    
    // Format output based on requested format
    const output = formatOutput(toolStats, subagentStats, {
      format: options.format,
      color: options.color,
      thousandSeparator: options.thousandSeparator,
      verbose: options.verbose
    })
    
    // Output results
    handleOutput(output, options.output)
    
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`)
    process.exit(1)
  }
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
    .argument('[files...]', 'files to analyze')

  testProgram.parse(['node', 'cli.ts', ...args], { from: 'node' })
  const opts = testProgram.opts()
  const files = testProgram.args

  // Handle project selection logic
  let current = true
  let all = false
  let project = undefined

  if (opts.all) {
    all = true
    current = false
    project = undefined
  } else if (opts.project) {
    project = opts.project
    current = false
    all = false
  } else if (opts.current) {
    current = true
    all = false
    project = undefined
  }

  return {
    paths: files,
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
if (import.meta.url === `file://${process.argv[1]}`) {
  run(process.argv).catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}