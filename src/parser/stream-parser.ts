/**
 * Stream parser for JSONL (JSON Lines) format
 */

import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import * as readline from 'readline';

export interface StreamParserOptions {
  /**
   * Maximum buffer size for a single line (in bytes)
   * Default: 1MB
   */
  maxBufferSize?: number;
  
  /**
   * Whether to emit error events for parse errors
   * Default: false (silently skip invalid lines)
   */
  emitErrors?: boolean;
  
  /**
   * Optional filter function to include/exclude entries
   */
  filter?: (entry: any) => boolean;
  
  /**
   * Optional transform function to modify entries
   */
  transform?: (entry: any) => any;
}

export class StreamParser extends EventEmitter {
  private options: Required<StreamParserOptions>;
  
  constructor(options: StreamParserOptions = {}) {
    super();
    this.options = {
      maxBufferSize: options.maxBufferSize ?? 1024 * 1024, // 1MB default
      emitErrors: options.emitErrors ?? false,
      filter: options.filter ?? (() => true),
      transform: options.transform ?? ((entry) => entry)
    };
  }
  
  /**
   * Parse a readable stream of JSONL data
   */
  async *parseStream(stream: Readable): AsyncGenerator<any> {
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });
    
    let buffer = '';
    
    for await (const line of rl) {
      // Check buffer size
      if (this.options.maxBufferSize && line.length > this.options.maxBufferSize) {
        const error = new Error(`Line exceeds maximum buffer size of ${this.options.maxBufferSize} bytes`);
        if (this.options.emitErrors) {
          this.emit('error', error);
        }
        continue;
      }
      
      // Skip empty lines
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }
      
      try {
        const entry = JSON.parse(trimmedLine);
        
        // Apply filter
        if (!this.options.filter(entry)) {
          continue;
        }
        
        // Apply transform
        const transformed = this.options.transform(entry);
        
        yield transformed;
      } catch (error) {
        if (this.options.emitErrors) {
          const parseError = new Error(`Failed to parse JSON: ${(error as Error).message}`);
          this.emit('error', parseError);
        }
        // Skip invalid JSON lines
        continue;
      }
    }
  }
  
  /**
   * Parse a JSONL file from a file path
   */
  async *parseFile(filePath: string): AsyncGenerator<any> {
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    yield* this.parseStream(stream);
  }
}

// Keep the existing function for backward compatibility
export function parseToolLog(content: string): any {
  const entries: any[] = []
  
  // Parse content line by line
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    try {
      const entry = JSON.parse(trimmed);
      entries.push(entry);
    } catch {
      // Skip invalid lines
    }
  }
  
  return {
    entries,
    summary: {
      totalTools: entries.filter(e => e.type === 'request').length,
      totalSubagents: 0,
      totalMessages: entries.length,
    }
  }
}