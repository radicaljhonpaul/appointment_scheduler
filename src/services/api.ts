import type { DoctorScheduleRaw, DoctorScheduleResponse, Doctor } from '@/types'

const API_URL = 'https://raw.githubusercontent.com/suyogshiftcare/jsontest/main/available.json'

/**
 * Fetches doctor schedules from the API
 * @throws Error if the fetch fails
 */
export async function fetchDoctorSchedules(): Promise<DoctorScheduleResponse> {
  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch doctors: ${response.status} ${response.statusText}`)
    }

    const data: DoctorScheduleResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching doctors: ${error.message}`)
    }
    throw new Error('Unknown error occurred while fetching doctors')
  }
}

/**
 * Groups raw schedule data by doctor name
 * @param schedules Raw schedule data from API
 * @returns Array of doctors with their grouped schedules
 */
export function groupSchedulesByDoctor(schedules: DoctorScheduleRaw[]): Doctor[] {
  const doctorMap = new Map<string, Doctor>()

  schedules.forEach((schedule) => {
    if (!doctorMap.has(schedule.name)) {
      doctorMap.set(schedule.name, {
        name: schedule.name,
        timezone: schedule.timezone,
        schedules: [],
      })
    }

    const doctor = doctorMap.get(schedule.name)!
    doctor.schedules.push({
      dayOfWeek: schedule.day_of_week,
      availableAt: schedule.available_at.trim(),
      availableUntil: schedule.available_until.trim(),
    })
  })

  return Array.from(doctorMap.values())
}

/**
 * Fetches and processes doctor data
 * @returns Array of doctors with grouped schedules
 */
export async function fetchDoctors(): Promise<Doctor[]> {
  const rawSchedules = await fetchDoctorSchedules()
  return groupSchedulesByDoctor(rawSchedules)
}
