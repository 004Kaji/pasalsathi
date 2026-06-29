// Currency formatting utilities for Nepali Rupees

/** Formats a number as "NPR X,XXX" using Nepali locale */
export function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('ne-NP')}`
}

/** Compact formatter: shows K/L suffixes for large amounts */
export function formatNPRCompact(amount: number): string {
  if (amount >= 100000) return `NPR ${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000)   return `NPR ${(amount / 1000).toFixed(1)}K`
  return `NPR ${amount.toLocaleString('ne-NP')}`
}
