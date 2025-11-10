import type { DayOfWeek } from '@/types'

/**
 * Gets the day of the week name from a date
 * @param date Date object
 * @returns Day name (e.g., "Monday")
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const dayIndex = date.getDay()
  return days[dayIndex] as DayOfWeek
}

/**
 * Formats a date as YYYY-MM-DD
 * @param date Date object
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a date for display (e.g., "Mon, Nov 15, 2025")
 * @param date Date object or date string
 * @returns Formatted display string
 */
export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Gets the next 7 days starting from today
 * @returns Array of dates for the next week
 */
export function getNextWeekDates(): Date[] {
  const dates: Date[] = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }

  return dates
}

/**
 * Gets dates for the upcoming week, grouped by day name
 * @returns Map of day names to dates
 */
export function getWeekDatesMap(): Map<DayOfWeek, Date> {
  const map = new Map<DayOfWeek, Date>()
  const dates = getNextWeekDates()

  dates.forEach((date) => {
    const dayName = getDayOfWeek(date)
    // Store the first occurrence of each day in the next 7 days
    if (!map.has(dayName)) {
      map.set(dayName, date)
    }
  })

  return map
}

/**
 * Parses a date string (YYYY-MM-DD) to Date object
 * @param dateString Date string
 * @returns Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Checks if a date is in the past
 * @param date Date object or date string
 * @returns True if date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dateObj.setHours(0, 0, 0, 0)
  return dateObj < today
}
