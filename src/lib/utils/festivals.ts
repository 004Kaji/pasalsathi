import NepaliDate from 'nepali-date-converter'

export type Festival = {
  id:     string
  name:   string
  month:  number   // BS month 1–12
  day:    number   // BS day
  year?:  number   // omit = repeats every year
  emoji:  string
}

// Update year-specific entries annually
export const FESTIVALS: Festival[] = [
  // ── Fixed every year ──────────────────────────────────────
  { id: 'new-year',        name: 'Nepali New Year',    month: 1,  day: 1,  emoji: '🎊' },
  { id: 'republic-day',    name: 'Republic Day',       month: 2,  day: 15, emoji: '🇳🇵' },
  { id: 'constitution',    name: 'Constitution Day',   month: 6,  day: 3,  emoji: '📜' },
  { id: 'maghe',           name: 'Maghe Sankranti',    month: 10, day: 1,  emoji: '🌞' },

  // ── 2082 BS ───────────────────────────────────────────────
  { id: 'dashain-2082',    name: 'Vijaya Dashami',     month: 6,  day: 24, year: 2082, emoji: '🎉' },
  { id: 'tihar-2082',      name: 'Laxmi Puja (Tihar)', month: 7,  day: 4,  year: 2082, emoji: '🪔' },
  { id: 'chhath-2082',     name: 'Chhath Puja',        month: 7,  day: 8,  year: 2082, emoji: '🌅' },
  { id: 'shiva-2082',      name: 'Maha Shivaratri',    month: 11, day: 18, year: 2082, emoji: '🔱' },
  { id: 'holi-2082',       name: 'Holi',               month: 11, day: 29, year: 2082, emoji: '🎨' },

  // ── 2083 BS ───────────────────────────────────────────────
  { id: 'buddha-2083',     name: 'Buddha Jayanti',     month: 1,  day: 15, year: 2083, emoji: '☸️'  },
  { id: 'guru-2083',       name: 'Guru Purnima',       month: 3,  day: 16, year: 2083, emoji: '🙏' },
  { id: 'teej-2083',       name: 'Teej',               month: 5,  day: 3,  year: 2083, emoji: '💃' },
  { id: 'indra-2083',      name: 'Indra Jatra',        month: 5,  day: 12, year: 2083, emoji: '🎭' },
  { id: 'dashain-2083',    name: 'Vijaya Dashami',     month: 6,  day: 14, year: 2083, emoji: '🎉' },
  { id: 'tihar-2083',      name: 'Laxmi Puja (Tihar)', month: 7,  day: 23, year: 2083, emoji: '🪔' },
  { id: 'chhath-2083',     name: 'Chhath Puja',        month: 7,  day: 26, year: 2083, emoji: '🌅' },
  { id: 'shiva-2083',      name: 'Maha Shivaratri',    month: 11, day: 7,  year: 2083, emoji: '🔱' },
  { id: 'holi-2083',       name: 'Holi',               month: 11, day: 18, year: 2083, emoji: '🎨' },

  // ── 2084 BS (approximate — update once official calendar is out) ──
  { id: 'new-year-2084',   name: 'Nepali New Year',    month: 1,  day: 1,  year: 2084, emoji: '🎊' },
]

export type UpcomingFestival = Festival & { daysAway: number; bsYear: number }

/** Returns the next `limit` festivals from today's BS date */
export function getUpcomingFestivals(
  todayYear: number,
  todayMonth: number,
  todayDay: number,
  limit = 4,
): UpcomingFestival[] {
  const todayAD = new NepaliDate(todayYear, todayMonth - 1, todayDay).toJsDate()
  todayAD.setHours(0, 0, 0, 0)

  const candidates: UpcomingFestival[] = []

  // Check current year and next year
  for (const yearOffset of [0, 1]) {
    const checkYear = todayYear + yearOffset
    for (const f of FESTIVALS) {
      if (f.year && f.year !== checkYear) continue
      try {
        const festAD = new NepaliDate(checkYear, f.month - 1, f.day).toJsDate()
        festAD.setHours(0, 0, 0, 0)
        const msAway  = festAD.getTime() - todayAD.getTime()
        const daysAway = Math.round(msAway / 86_400_000)
        if (daysAway >= 0) candidates.push({ ...f, daysAway, bsYear: checkYear })
      } catch {
        // skip invalid dates (e.g. month 13)
      }
    }
  }

  // Sort by proximity, de-dupe by id+year
  candidates.sort((a, b) => a.daysAway - b.daysAway)
  const seen = new Set<string>()
  const result: UpcomingFestival[] = []
  for (const c of candidates) {
    const key = `${c.id}-${c.bsYear}`
    if (!seen.has(key)) { seen.add(key); result.push(c) }
    if (result.length >= limit) break
  }
  return result
}

/** Returns festival(s) on a specific BS date (for calendar dots) */
export function festivalsOnDay(year: number, month: number, day: number): Festival[] {
  return FESTIVALS.filter(f =>
    f.month === month &&
    f.day   === day   &&
    (!f.year || f.year === year)
  )
}
