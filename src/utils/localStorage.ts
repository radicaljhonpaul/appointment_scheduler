import type { Appointment } from '@/types'

const STORAGE_KEY = 'appointments'

/**
 * Saves appointments to localStorage
 * @param appointments Array of appointments to save
 */
export function saveAppointments(appointments: Appointment[]): void {
  try {
    const json = JSON.stringify(appointments)
    localStorage.setItem(STORAGE_KEY, json)
  } catch (error) {
    console.error('Failed to save appointments to localStorage:', error)
  }
}

/**
 * Loads appointments from localStorage
 * @returns Array of appointments, or empty array if none exist
 */
export function loadAppointments(): Appointment[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) {
      return []
    }
    const appointments = JSON.parse(json) as Appointment[]
    return Array.isArray(appointments) ? appointments : []
  } catch (error) {
    console.error('Failed to load appointments from localStorage:', error)
    return []
  }
}

/**
 * Clears all appointments from localStorage
 */
export function clearAppointments(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear appointments from localStorage:', error)
  }
}
