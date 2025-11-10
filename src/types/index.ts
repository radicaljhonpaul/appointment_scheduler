// Raw API response structure
export interface DoctorScheduleRaw {
  name: string
  timezone: string
  day_of_week: string
  available_at: string
  available_until: string
}

// Processed doctor with grouped schedules
export interface Doctor {
  name: string
  timezone: string
  schedules: DoctorSchedule[]
}

// Individual schedule entry for a day
export interface DoctorSchedule {
  dayOfWeek: string
  availableAt: string
  availableUntil: string
}

// Time slot for booking
export interface TimeSlot {
  startTime: string // "9:00 AM"
  endTime: string // "9:30 AM"
  isAvailable: boolean
  isBooked: boolean
  date?: string // "2025-11-15"
}

// Appointment booking
export interface Appointment {
  id: string
  doctorName: string
  doctorTimezone: string
  date: string // "2025-11-15"
  dayOfWeek: string // "Monday"
  startTime: string // "9:00 AM"
  endTime: string // "9:30 AM"
  bookedAt: string // ISO timestamp
}

// Days of the week
export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'

// API response type
export type DoctorScheduleResponse = DoctorScheduleRaw[]
