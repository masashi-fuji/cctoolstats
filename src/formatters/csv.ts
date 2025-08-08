/**
 * CSV formatter
 */

export function formatCsv(data: unknown[]): string {
  // TODO: Implement CSV formatting logic
  const headers = Object.keys(data[0] || {})
  const rows = data.map(item => 
    headers.map(header => String((item as any)[header] ?? '')).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}