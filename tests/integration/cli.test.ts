import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

describe.concurrent('CLI Integration Tests', () => {
  const fixturePath = path.join(__dirname, '../fixtures/sample-log.jsonl');
  const cliPath = path.join(__dirname, '../../src/cli.ts');
  const tempOutputPath = path.join(__dirname, '../temp-output.txt');
  
  // Cache for compiled CLI command
  let cliCommand: string;
  
  beforeAll(() => {
    // Pre-build the CLI command once
    cliCommand = `npx tsx ${cliPath}`;
  });
  
  afterAll(() => {
    // Clean up temp files
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
  });

  describe.concurrent('Processing JSONL files', () => {
    it('should analyze a single JSONL file and output table format', async () => {
      // Run the CLI with the sample log file
      const { stdout, stderr } = await execAsync(`${cliCommand} ${fixturePath}`);
      
      // Check that the output contains expected information
      expect(stdout).toContain('Tool Usage Statistics');
      expect(stdout).toContain('Bash');  // Should be the most used tool (3 times)
      expect(stdout).toContain('3');
      expect(stdout).toContain('Subagent Usage Statistics');
      expect(stdout).toContain('code-reviewer');  // Used 2 times
      expect(stdout).toContain('2');
      expect(stderr).toBe('');
    }, 10000);

    it('should output JSON format when specified', async () => {
      const { stdout, stderr } = await execAsync(`${cliCommand} ${fixturePath} --format json`);
      
      // Parse the JSON output
      const result = JSON.parse(stdout);
      
      expect(result).toHaveProperty('tools');
      expect(result).toHaveProperty('subagents');
      expect(result.tools.totalInvocations).toBe(7);
      expect(result.tools.toolCounts.Bash).toBe(3);
      expect(result.subagents.totalInvocations).toBe(3);
      expect(result.subagents.agentCounts['code-reviewer']).toBe(2);
      expect(stderr).toBe('');
    }, 10000);

    it('should output CSV format when specified', async () => {
      const { stdout, stderr } = await execAsync(`${cliCommand} ${fixturePath} --format csv`);
      
      // Check CSV format
      expect(stdout).toContain('Type,Name,Count,Percentage');
      expect(stdout).toContain('Tool,Bash,3,');
      expect(stdout).toContain('Subagent,code-reviewer,2,');
      expect(stderr).toBe('');
    }, 10000);

    it('should save output to file when --output is specified', async () => {
      const uniqueTempPath = `${tempOutputPath}.${Date.now()}`;
      const { stdout, stderr } = await execAsync(`${cliCommand} ${fixturePath} --output ${uniqueTempPath}`);
      
      // Check that file was created
      expect(fs.existsSync(uniqueTempPath)).toBe(true);
      
      // Read the file content
      const fileContent = fs.readFileSync(uniqueTempPath, 'utf-8');
      expect(fileContent).toContain('Tool Usage Statistics');
      expect(fileContent).toContain('Bash');
      
      // Clean up
      fs.unlinkSync(uniqueTempPath);
      
      // stdout should indicate success
      expect(stdout).toContain('Output saved to');
      expect(stderr).toBe('');
    }, 10000);

    it('should show help when --help is passed', async () => {
      const { stdout, stderr } = await execAsync(`${cliCommand} --help`);
      
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Options:');
      expect(stdout).toContain('--format');
      expect(stdout).toContain('--output');
      expect(stderr).toBe('');
    }, 10000);

    it('should show version when --version is passed', async () => {
      const { stdout, stderr } = await execAsync(`${cliCommand} --version`);
      
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(stderr).toBe('');
    }, 10000);

    it('should handle invalid format gracefully', async () => {
      const command = `${cliCommand} ${fixturePath} --format invalid`;
      
      try {
        await execAsync(command);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.stderr).toContain('Invalid format');
        expect(error.code).toBe(1);
      }
    }, 10000);

    it('should handle non-existent file gracefully', async () => {
      const command = `${cliCommand} /non/existent/file.jsonl`;
      
      try {
        await execAsync(command);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.stderr).toContain('Error');
        expect(error.code).toBe(1);
      }
    }, 10000);
  });

  describe('End-to-end workflow', () => {
    it('should complete full analysis workflow', async () => {
      // Step 1: Analyze with table format
      const { stdout: tableOutput } = await execAsync(`${cliCommand} ${fixturePath}`);
      
      expect(tableOutput).toContain('Tool Usage Statistics');
      expect(tableOutput).toContain('Total: 7');  // 7 tool invocations
      expect(tableOutput).toContain('Subagent Usage Statistics');
      expect(tableOutput).toContain('Total: 3');  // 3 subagent invocations
      
      // Step 2: Analyze with JSON format for programmatic access
      const { stdout: jsonOutput } = await execAsync(`${cliCommand} ${fixturePath} --format json`);
      const jsonData = JSON.parse(jsonOutput);
      
      expect(jsonData.tools.uniqueTools).toBe(5);  // Bash, Read, Write, Edit, Grep
      expect(jsonData.subagents.uniqueAgents).toBe(2);  // code-reviewer, test-writer
      
      // Step 3: Save CSV for spreadsheet analysis
      const uniqueCsvPath = `${tempOutputPath}.csv.${Date.now()}`;
      const { stdout: csvStatus } = await execAsync(`${cliCommand} ${fixturePath} --format csv --output ${uniqueCsvPath}`);
      
      expect(csvStatus).toContain('Output saved to');
      const csvContent = fs.readFileSync(uniqueCsvPath, 'utf-8');
      const csvLines = csvContent.split('\n');
      expect(csvLines.length).toBeGreaterThan(5);  // Header + data rows
      
      // Clean up
      fs.unlinkSync(uniqueCsvPath);
    }, 15000);
  });
});