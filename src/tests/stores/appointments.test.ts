import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppointmentStore } from '@/stores/appointments'
import { mockDoctors, mockAppointment, mockAppointments } from '../helpers/mockData'
import type { Appointment } from '@/types'

describe('Appointment Store - Edge Cases and Error Handling', () => {
  beforeEach(() => {
    // Create a fresh pinia instance before each test
    setActivePinia(createPinia())
    
    // Clear localStorage
    localStorage.clear()
    
    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('initializeStore', () => {
    it('should load appointments from localStorage on init', () => {
      localStorage.setItem('appointments', JSON.stringify(mockAppointments))
      
      const store = useAppointmentStore()
      store.initializeStore()
      
      expect(store.appointments).toEqual(mockAppointments)
    })

    it('should handle empty localStorage', () => {
      const store = useAppointmentStore()
      store.initializeStore()
      
      expect(store.appointments).toEqual([])
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('appointments', 'corrupted data')
      
      const store = useAppointmentStore()
      store.initializeStore()
      
      expect(store.appointments).toEqual([])
    })
  })

  describe('fetchDoctors', () => {
    describe('Successful Fetch', () => {
      it('should fetch and store doctors', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue([
            {
              name: 'Dr. Smith',
              timezone: 'America/New_York',
              day_of_week: 'Monday',
              available_at: '9:00 AM',
              available_until: '5:00 PM',
            },
          ]),
        })

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.doctors).toHaveLength(1)
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should set loading state during fetch', async () => {
        globalThis.fetch = vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  ok: true,
                  json: vi.fn().mockResolvedValue([]),
                })
              }, 100)
            }),
        )

        const store = useAppointmentStore()
        const fetchPromise = store.fetchDoctors()
        
        expect(store.loading).toBe(true)
        
        await fetchPromise
        expect(store.loading).toBe(false)
      })
    })

    describe('Network Failures', () => {
      it('should handle network error', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.error).toBe('Error fetching doctors: Network error')
        expect(store.doctors).toEqual([])
        expect(store.loading).toBe(false)
      })

      it('should handle HTTP 500 error', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.error).toContain('Failed to fetch doctors')
        expect(store.loading).toBe(false)
      })

      it('should handle HTTP 404 error', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.error).toContain('Failed to fetch doctors')
      })

      it('should handle timeout/abort', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.error).toBeTruthy()
        expect(store.loading).toBe(false)
      })
    })

    describe('Invalid Response Data', () => {
      it('should handle empty response array', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        })

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.doctors).toEqual([])
        expect(store.error).toBeNull()
      })

      it('should handle malformed JSON', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
        })

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.error).toContain('Unexpected token')
      })

      it('should handle non-Error rejection', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue('Unknown error')

        const store = useAppointmentStore()
        await store.fetchDoctors()
        
        expect(store.error).toBe('Unknown error occurred while fetching doctors')
      })
    })
  })

  describe('bookAppointment', () => {
    describe('Successful Booking', () => {
      it('should book a new appointment', () => {
        const store = useAppointmentStore()
        
        store.bookAppointment(mockAppointment)
        
        expect(store.appointments).toHaveLength(1)
        expect(store.appointments[0]).toEqual(mockAppointment)
      })

      it('should persist appointment to localStorage', () => {
        const store = useAppointmentStore()
        
        store.bookAppointment(mockAppointment)
        
        const stored = localStorage.getItem('appointments')
        expect(stored).toBeTruthy()
        expect(JSON.parse(stored!)).toHaveLength(1)
      })

      it('should allow multiple different appointments', () => {
        const store = useAppointmentStore()
        const appointment2 = {
          ...mockAppointment,
          id: '2',
          startTime: '10:00 AM',
          endTime: '10:30 AM',
        }
        
        store.bookAppointment(mockAppointment)
        store.bookAppointment(appointment2)
        
        expect(store.appointments).toHaveLength(2)
      })
    })

    describe('Double Booking Prevention', () => {
      it('should throw error when booking same slot twice', () => {
        const store = useAppointmentStore()
        
        store.bookAppointment(mockAppointment)
        
        expect(() => store.bookAppointment(mockAppointment)).toThrow(
          'This time slot is already booked',
        )
      })

      it('should throw error when booking same time with different ID', () => {
        const store = useAppointmentStore()
        const duplicateTime = {
          ...mockAppointment,
          id: 'different-id',
        }
        
        store.bookAppointment(mockAppointment)
        
        expect(() => store.bookAppointment(duplicateTime)).toThrow(
          'This time slot is already booked',
        )
      })

      it('should allow same time slot for different doctors', () => {
        const store = useAppointmentStore()
        const differentDoctor = {
          ...mockAppointment,
          id: '2',
          doctorName: 'Dr. Johnson',
        }
        
        store.bookAppointment(mockAppointment)
        
        expect(() => store.bookAppointment(differentDoctor)).not.toThrow()
        expect(store.appointments).toHaveLength(2)
      })

      it('should allow same time slot for different dates', () => {
        const store = useAppointmentStore()
        const differentDate = {
          ...mockAppointment,
          id: '2',
          date: '2025-11-18',
        }
        
        store.bookAppointment(mockAppointment)
        
        expect(() => store.bookAppointment(differentDate)).not.toThrow()
        expect(store.appointments).toHaveLength(2)
      })
    })

    describe('Edge Cases - Data Validation', () => {
      it('should handle appointment with special characters in name', () => {
        const store = useAppointmentStore()
        const specialAppt = {
          ...mockAppointment,
          doctorName: "Dr. O'Brien-Smith",
        }
        
        expect(() => store.bookAppointment(specialAppt)).not.toThrow()
      })

      it('should handle appointment with unicode characters', () => {
        const store = useAppointmentStore()
        const unicodeAppt = {
          ...mockAppointment,
          doctorName: 'Dr. José García',
        }
        
        expect(() => store.bookAppointment(unicodeAppt)).not.toThrow()
      })

      it('should handle appointment with very long ID', () => {
        const store = useAppointmentStore()
        const longIdAppt = {
          ...mockAppointment,
          id: 'a'.repeat(1000),
        }
        
        expect(() => store.bookAppointment(longIdAppt)).not.toThrow()
      })
    })

    describe('Edge Cases - Time Comparisons', () => {
      it('should treat times with different formatting as different', () => {
        const store = useAppointmentStore()
        const appointment1 = { ...mockAppointment }
        const appointment2 = {
          ...mockAppointment,
          id: '2',
          startTime: '9:00AM', // No space
        }
        
        store.bookAppointment(appointment1)
        
        // Different format should be treated as different time
        expect(() => store.bookAppointment(appointment2)).not.toThrow()
      })

      it('should be case-sensitive for doctor names', () => {
        const store = useAppointmentStore()
        const appointment1 = { ...mockAppointment }
        const appointment2 = {
          ...mockAppointment,
          id: '2',
          doctorName: 'dr. smith', // lowercase
        }
        
        store.bookAppointment(appointment1)
        
        // Different case should be treated as different doctor
        expect(() => store.bookAppointment(appointment2)).not.toThrow()
      })
    })
  })

  describe('cancelAppointment', () => {
    describe('Successful Cancellation', () => {
      it('should cancel an existing appointment', () => {
        const store = useAppointmentStore()
        store.bookAppointment(mockAppointment)
        
        store.cancelAppointment(mockAppointment.id)
        
        expect(store.appointments).toHaveLength(0)
      })

      it('should persist cancellation to localStorage', () => {
        const store = useAppointmentStore()
        store.bookAppointment(mockAppointment)
        
        store.cancelAppointment(mockAppointment.id)
        
        const stored = localStorage.getItem('appointments')
        expect(JSON.parse(stored!)).toHaveLength(0)
      })

      it('should cancel only the specified appointment', () => {
        const store = useAppointmentStore()
        const appointment2 = { ...mockAppointment, id: '2', startTime: '10:00 AM' }
        
        store.bookAppointment(mockAppointment)
        store.bookAppointment(appointment2)
        
        store.cancelAppointment(mockAppointment.id)
        
        expect(store.appointments).toHaveLength(1)
        expect(store.appointments[0]!.id).toBe('2')
      })
    })

    describe('Error Cases - Invalid Cancellation', () => {
      it('should throw error when canceling non-existent appointment', () => {
        const store = useAppointmentStore()
        
        expect(() => store.cancelAppointment('non-existent-id')).toThrow('Appointment not found')
      })

      it('should throw error when canceling already canceled appointment', () => {
        const store = useAppointmentStore()
        store.bookAppointment(mockAppointment)
        store.cancelAppointment(mockAppointment.id)
        
        expect(() => store.cancelAppointment(mockAppointment.id)).toThrow('Appointment not found')
      })

      it('should throw error for empty appointment ID', () => {
        const store = useAppointmentStore()
        store.bookAppointment(mockAppointment)
        
        expect(() => store.cancelAppointment('')).toThrow('Appointment not found')
      })

      it('should throw error for null-like ID values', () => {
        const store = useAppointmentStore()
        store.bookAppointment(mockAppointment)
        
        expect(() => store.cancelAppointment('null')).toThrow('Appointment not found')
        expect(() => store.cancelAppointment('undefined')).toThrow('Appointment not found')
      })
    })

    describe('Edge Cases - ID Matching', () => {
      it('should be case-sensitive when matching IDs', () => {
        const store = useAppointmentStore()
        const upperCaseAppt = {
          ...mockAppointment,
          id: 'UPPERCASE-ID',
        }
        
        store.bookAppointment(upperCaseAppt)
        
        // Test that lowercase version doesn't match
        expect(() => store.cancelAppointment('uppercase-id')).toThrow(
          'Appointment not found',
        )
        
        // But correct case works
        expect(() => store.cancelAppointment('UPPERCASE-ID')).not.toThrow()
      })

      it('should handle IDs with special characters', () => {
        const store = useAppointmentStore()
        const specialIdAppt = {
          ...mockAppointment,
          id: 'appt-123-abc!@#',
        }
        
        store.bookAppointment(specialIdAppt)
        
        expect(() => store.cancelAppointment(specialIdAppt.id)).not.toThrow()
      })
    })
  })

  describe('Computed Properties - Getters', () => {
    describe('getDoctorByName', () => {
      it('should find doctor by name', () => {
        const store = useAppointmentStore()
        store.doctors = mockDoctors
        
        const doctor = store.getDoctorByName('Dr. Smith')
        expect(doctor).toBeDefined()
        expect(doctor?.name).toBe('Dr. Smith')
      })

      it('should return undefined for non-existent doctor', () => {
        const store = useAppointmentStore()
        store.doctors = mockDoctors
        
        const doctor = store.getDoctorByName('Dr. Nobody')
        expect(doctor).toBeUndefined()
      })

      it('should be case-sensitive', () => {
        const store = useAppointmentStore()
        store.doctors = mockDoctors
        
        const doctor = store.getDoctorByName('dr. smith')
        expect(doctor).toBeUndefined()
      })
    })

    describe('getAppointmentsByDoctor', () => {
      it('should filter appointments by doctor name', () => {
        const store = useAppointmentStore()
        store.appointments = mockAppointments
        
        const appointments = store.getAppointmentsByDoctor('Dr. Smith')
        expect(appointments).toHaveLength(2)
      })

      it('should return empty array for doctor with no appointments', () => {
        const store = useAppointmentStore()
        store.appointments = mockAppointments
        
        const appointments = store.getAppointmentsByDoctor('Dr. Johnson')
        expect(appointments).toEqual([])
      })

      it('should be case-sensitive', () => {
        const store = useAppointmentStore()
        store.appointments = mockAppointments
        
        const appointments = store.getAppointmentsByDoctor('dr. smith')
        expect(appointments).toEqual([])
      })
    })

    describe('upcomingAppointments', () => {
      it('should return future appointments sorted by date', () => {
        const store = useAppointmentStore()
        const futureAppt1: Appointment = {
          ...mockAppointment,
          id: '1',
          date: '2026-01-15',
        }
        const futureAppt2: Appointment = {
          ...mockAppointment,
          id: '2',
          date: '2026-01-10',
        }
        
        store.appointments = [futureAppt1, futureAppt2]
        
        const upcoming = store.upcomingAppointments
        expect(upcoming).toHaveLength(2)
        expect(upcoming[0]!.date).toBe('2026-01-10')
        expect(upcoming[1]!.date).toBe('2026-01-15')
      })

      it('should exclude past appointments', () => {
        const store = useAppointmentStore()
        const pastAppt: Appointment = {
          ...mockAppointment,
          date: '2020-01-01',
        }
        
        store.appointments = [pastAppt]
        
        const upcoming = store.upcomingAppointments
        expect(upcoming).toHaveLength(0)
      })

      it('should handle empty appointments', () => {
        const store = useAppointmentStore()
        
        const upcoming = store.upcomingAppointments
        expect(upcoming).toEqual([])
      })
    })

    describe('pastAppointments', () => {
      it('should return past appointments sorted by date (newest first)', () => {
        const store = useAppointmentStore()
        const pastAppt1: Appointment = {
          ...mockAppointment,
          id: '1',
          date: '2020-01-10',
        }
        const pastAppt2: Appointment = {
          ...mockAppointment,
          id: '2',
          date: '2020-01-15',
        }
        
        store.appointments = [pastAppt1, pastAppt2]
        
        const past = store.pastAppointments
        expect(past).toHaveLength(2)
        expect(past[0]!.date).toBe('2020-01-15')
        expect(past[1]!.date).toBe('2020-01-10')
      })

      it('should exclude future appointments', () => {
        const store = useAppointmentStore()
        const futureAppt: Appointment = {
          ...mockAppointment,
          date: '2026-01-01',
        }
        
        store.appointments = [futureAppt]
        
        const past = store.pastAppointments
        expect(past).toHaveLength(0)
      })
    })

    describe('appointmentCount', () => {
      it('should return total count of appointments', () => {
        const store = useAppointmentStore()
        store.appointments = mockAppointments
        
        expect(store.appointmentCount).toBe(2)
      })

      it('should return 0 for empty appointments', () => {
        const store = useAppointmentStore()
        
        expect(store.appointmentCount).toBe(0)
      })
    })
  })

  describe('Integration Tests - Complex Scenarios', () => {
    it('should handle complete booking and cancellation workflow', () => {
      const store = useAppointmentStore()
      
      // Book appointments
      store.bookAppointment(mockAppointment)
      expect(store.appointmentCount).toBe(1)
      
      // Cancel appointment
      store.cancelAppointment(mockAppointment.id)
      expect(store.appointmentCount).toBe(0)
    })

    it('should maintain localStorage consistency throughout operations', () => {
      const store = useAppointmentStore()
      
      store.bookAppointment(mockAppointment)
      let stored = JSON.parse(localStorage.getItem('appointments')!)
      expect(stored).toHaveLength(1)
      
      const appointment2 = { ...mockAppointment, id: '2', startTime: '10:00 AM' }
      store.bookAppointment(appointment2)
      stored = JSON.parse(localStorage.getItem('appointments')!)
      expect(stored).toHaveLength(2)
      
      store.cancelAppointment(mockAppointment.id)
      stored = JSON.parse(localStorage.getItem('appointments')!)
      expect(stored).toHaveLength(1)
    })

    it('should handle rapid booking and cancellation', () => {
      const store = useAppointmentStore()
      
      for (let i = 0; i < 10; i++) {
        const appt = { ...mockAppointment, id: `${i}`, startTime: `${9 + i}:00 AM` }
        store.bookAppointment(appt)
      }
      
      expect(store.appointmentCount).toBe(10)
      
      for (let i = 0; i < 5; i++) {
        store.cancelAppointment(`${i}`)
      }
      
      expect(store.appointmentCount).toBe(5)
    })
  })
})
