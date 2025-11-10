import type { TimeSlot, Appointment } from '@/types'

/**
 * Parses a time string like "9:00AM" or " 9:00 AM" into hours and minutes
 * @param timeString Time string to parse
 * @returns Object with hours (0-23) and minutes (0-59)
 */
export function parseTime(timeString: string): { hours: number; minutes: number } {
  const cleaned = timeString.trim().replace(/\s+/g, '')
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i)

  if (!match || !match[1] || !match[2] || !match[3]) {
    throw new Error(`Invalid time format: ${timeString}`)
  }

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return { hours, minutes }
}

/**
 * Formats hours and minutes into a time string like "9:00 AM"
 * @param hours Hours (0-23)
 * @param minutes Minutes (0-59)
 * @returns Formatted time string
 */
export function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const displayMinutes = minutes.toString().padStart(2, '0')
  return `${displayHours}:${displayMinutes} ${period}`
}

/**
 * Generates 30-minute time slots between start and end times
 * @param startTime Start time string (e.g., "9:00 AM")
 * @param endTime End time string (e.g., "5:00 PM")
 * @returns Array of time slots
 */
export function generateTimeSlots(startTime: string, endTime: string): TimeSlot[] {
  const start = parseTime(startTime)
  const end = parseTime(endTime)

  const slots: TimeSlot[] = []
  let currentHours = start.hours
  let currentMinutes = start.minutes

  // Convert to minutes for easier calculation
  const startTotalMinutes = start.hours * 60 + start.minutes
  const endTotalMinutes = end.hours * 60 + end.minutes

  let currentTotalMinutes = startTotalMinutes

  while (currentTotalMinutes < endTotalMinutes) {
    const slotStart = formatTime(currentHours, currentMinutes)

    // Add 30 minutes for slot end
    currentTotalMinutes += 30
    currentHours = Math.floor(currentTotalMinutes / 60)
    currentMinutes = currentTotalMinutes % 60

    const slotEnd = formatTime(currentHours, currentMinutes)

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable: true,
      isBooked: false,
    })
  }

  return slots
}

/**
 * Checks if a time slot is booked based on existing appointments
 * @param slot Time slot to check
 * @param date Date string (e.g., "2025-11-15")
 * @param doctorName Doctor's name
 * @param appointments Array of existing appointments
 * @returns True if the slot is booked
 */
export function isSlotBooked(
  slot: TimeSlot,
  date: string,
  doctorName: string,
  appointments: Appointment[],
): boolean {
  return appointments.some(
    (appt) =>
      appt.doctorName === doctorName &&
      appt.date === date &&
      appt.startTime === slot.startTime &&
      appt.endTime === slot.endTime,
  )
}

/**
 * Marks slots as booked based on existing appointments
 * @param slots Array of time slots
 * @param date Date string
 * @param doctorName Doctor's name
 * @param appointments Array of existing appointments
 * @returns Updated slots with booking status
 */
export function markBookedSlots(
  slots: TimeSlot[],
  date: string,
  doctorName: string,
  appointments: Appointment[],
): TimeSlot[] {
  return slots.map((slot) => ({
    ...slot,
    isBooked: isSlotBooked(slot, date, doctorName, appointments),
    isAvailable: !isSlotBooked(slot, date, doctorName, appointments),
  }))
}
