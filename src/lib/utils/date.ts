// Bikram Sambat (BS / Nepali) date utilities
import NepaliDate from 'nepali-date-converter'
import { dateConfigMap } from 'nepali-date-converter'

export const BS_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत',
]

export const BS_DAYS_SHORT = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि']

const MONTH_KEYS = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
] as const

/** Returns today's BS date components */
export function todayBS() {
  const nd = new NepaliDate()
  const bs = nd.getBS()
  return { year: bs.year, month: bs.month + 1, date: bs.date, day: bs.day }
}

/** Formats an AD date (or today) as "DD MonthName YYYY" in Nepali */
export function formatBSFull(adDate?: Date): string {
  const nd = adDate ? new NepaliDate(adDate) : new NepaliDate()
  const bs = nd.getBS()
  return `${bs.date} ${BS_MONTHS[bs.month]} ${bs.year}`
}

/** Formats an AD date (or today) as "YYYY-MM-DD" BS */
export function formatBSShort(adDate?: Date): string {
  const nd = adDate ? new NepaliDate(adDate) : new NepaliDate()
  const bs = nd.getBS()
  return `${bs.year}-${String(bs.month + 1).padStart(2, '0')}-${String(bs.date).padStart(2, '0')}`
}

/** Returns the number of days in a given BS year/month */
export function daysInBSMonth(year: number, month: number): number {
  const yearData = (dateConfigMap as Record<number, Record<string, number>>)[year]
  if (!yearData) return 30
  return yearData[MONTH_KEYS[month - 1]] ?? 30
}

/** Returns the AD weekday (0 = Sun) of day 1 of a given BS month */
export function firstWeekdayOfBSMonth(year: number, month: number): number {
  const nd = new NepaliDate(year, month - 1, 1)
  return nd.getDay()
}
