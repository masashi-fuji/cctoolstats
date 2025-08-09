#!/usr/bin/env node

/**
 * cctoolstats CLI entry point
 * This file serves as the entry point for the npm package
 */

// Use dynamic import for ES modules and call run function
import('../dist/cli.js').then(module => {
  // Call the run function with command line arguments
  module.run(process.argv).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}).catch(err => {
  console.error('Failed to load CLI:', err);
  process.exit(1);
});