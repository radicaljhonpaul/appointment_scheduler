import type { Doctor, DoctorScheduleRaw, Appointment } from '@/types'

export const mockDoctorScheduleRaw: DoctorScheduleRaw[] = [
  {
    name: 'Dr. Smith',
    timezone: 'America/New_York',
    day_of_week: 'Monday',
    available_at: '9:00 AM',
    available_until: '5:00 PM',
  },
  {
    name: 'Dr. Smith',
    timezone: 'America/New_York',
    day_of_week: 'Tuesday',
    available_at: '9:00 AM',
    available_until: '5:00 PM',
  },
  {
    name: 'Dr. Johnson',
    timezone: 'America/Los_Angeles',
    day_of_week: 'Monday',
    available_at: '10:00 AM',
    available_until: '6:00 PM',
  },
]

export const mockDoctors: Doctor[] = [
  {
    name: 'Dr. Smith',
    timezone: 'America/New_York',
    schedules: [
      {
        dayOfWeek: 'Monday',
        availableAt: '9:00 AM',
        availableUntil: '5:00 PM',
      },
      {
        dayOfWeek: 'Tuesday',
        availableAt: '9:00 AM',
        availableUntil: '5:00 PM',
      },
    ],
  },
  {
    name: 'Dr. Johnson',
    timezone: 'America/Los_Angeles',
    schedules: [
      {
        dayOfWeek: 'Monday',
        availableAt: '10:00 AM',
        availableUntil: '6:00 PM',
      },
    ],
  },
]

export const mockAppointment: Appointment = {
  id: '1',
  doctorName: 'Dr. Smith',
  doctorTimezone: 'America/New_York',
  date: '2025-11-17',
  dayOfWeek: 'Monday',
  startTime: '9:00 AM',
  endTime: '9:30 AM',
  bookedAt: '2025-11-14T10:00:00.000Z',
}

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dr. Smith',
    doctorTimezone: 'America/New_York',
    date: '2025-11-17',
    dayOfWeek: 'Monday',
    startTime: '9:00 AM',
    endTime: '9:30 AM',
    bookedAt: '2025-11-14T10:00:00.000Z',
  },
  {
    id: '2',
    doctorName: 'Dr. Smith',
    doctorTimezone: 'America/New_York',
    date: '2025-11-17',
    dayOfWeek: 'Monday',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    bookedAt: '2025-11-14T10:30:00.000Z',
  },
]
