/**
 * Configuration utility
 */

import { z } from 'zod'

const ConfigSchema = z.object({
  verbose: z.boolean().default(false),
  outputFormat: z.enum(['table', 'json', 'csv']).default('table'),
  maxLogSize: z.number().default(10 * 1024 * 1024), // 10MB
  includePatterns: z.array(z.string()).default([]),
  excludePatterns: z.array(z.string()).default([]),
})

export type Config = z.infer<typeof ConfigSchema>

export function parseConfig(options: unknown): Config {
  return ConfigSchema.parse(options)
}

export function getDefaultConfig(): Config {
  return ConfigSchema.parse({})
}