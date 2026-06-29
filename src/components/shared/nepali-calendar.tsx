'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BS_MONTHS, BS_DAYS_SHORT,
  todayBS, daysInBSMonth, firstWeekdayOfBSMonth,
} from '@/lib/utils/date'

export default function NepaliCalendar() {
  const today = todayBS()
  const [year, setYear] = useState(today.year)
  const [month, setMonth] = useState(today.month)

  const totalDays = daysInBSMonth(year, month)
  const firstDay = firstWeekdayOfBSMonth(year, month)

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // pad to full grid
  while (cells.length % 7 !== 0) cells.push(null)

  const isCurrentMonth = year === today.year && month === today.month

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-bold text-white text-base">
            {BS_MONTHS[month - 1]} {year}
          </p>
          {isCurrentMonth && (
            <p className="text-xs text-orange-400 mt-0.5">यो महिना</p>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {BS_DAYS_SHORT.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-1 ${
              i === 6 ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          const isToday = isCurrentMonth && day === today.date
          const isSaturday = i % 7 === 6
          return (
            <div
              key={i}
              className={`text-center text-sm py-1.5 rounded-lg transition-colors ${
                !day ? '' :
                isToday
                  ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white font-bold'
                  : isSaturday
                  ? 'text-red-400 hover:bg-white/5'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              {day ?? ''}
            </div>
          )
        })}
      </div>

      {/* Today footer */}
      {isCurrentMonth && (
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            आज: <span className="text-orange-400 font-semibold">
              {today.date} {BS_MONTHS[today.month - 1]} {today.year}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
