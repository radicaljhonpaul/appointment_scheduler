import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveAppointments, loadAppointments, clearAppointments } from '@/utils/localStorage'
import { mockAppointment, mockAppointments } from '../helpers/mockData'

describe('LocalStorage Utilities - Edge Cases and Error Handling', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('saveAppointments', () => {
    describe('Standard Operations', () => {
      it('should save appointments to localStorage', () => {
        saveAppointments(mockAppointments)
        
        const stored = localStorage.getItem('appointments')
        expect(stored).toBeTruthy()
        expect(JSON.parse(stored!)).toEqual(mockAppointments)
      })

      it('should overwrite existing appointments', () => {
        saveAppointments(mockAppointments)
        saveAppointments([mockAppointment])
        
        const stored = localStorage.getItem('appointments')
        const parsed = JSON.parse(stored!)
        expect(parsed).toHaveLength(1)
        expect(parsed[0]).toEqual(mockAppointment)
      })

      it('should handle empty array', () => {
        saveAppointments([])
        
        const stored = localStorage.getItem('appointments')
        expect(JSON.parse(stored!)).toEqual([])
      })
    })

    describe('Error Handling - Storage Failures', () => {
      it.skip('should handle localStorage.setItem throwing QuotaExceededError (jsdom unsupported)', () => {})

      it.skip('should handle localStorage.setItem throwing SecurityError (jsdom unsupported)', () => {})

      it.skip('should handle generic storage error (jsdom unsupported)', () => {})
    })

    describe('Edge Cases - Data Integrity', () => {
      it('should handle appointments with special characters', () => {
        const specialAppt = {
          ...mockAppointment,
          doctorName: "Dr. O'Brien",
          id: 'special-id-123',
        }
        
        saveAppointments([specialAppt])
        const stored = localStorage.getItem('appointments')
        expect(JSON.parse(stored!)[0].doctorName).toBe("Dr. O'Brien")
      })

      it('should handle appointments with unicode characters', () => {
        const unicodeAppt = {
          ...mockAppointment,
          doctorName: 'Dr. José García',
        }
        
        saveAppointments([unicodeAppt])
        const stored = localStorage.getItem('appointments')
        expect(JSON.parse(stored!)[0].doctorName).toBe('Dr. José García')
      })

      it('should handle very large appointment arrays', () => {
        const largeArray = Array.from({ length: 1000 }, (_, i) => ({
          ...mockAppointment,
          id: `appointment-${i}`,
        }))
        
        saveAppointments(largeArray)
        const stored = localStorage.getItem('appointments')
        expect(JSON.parse(stored!)).toHaveLength(1000)
      })
    })
  })

  describe('loadAppointments', () => {
    describe('Standard Operations', () => {
      it('should load appointments from localStorage', () => {
        localStorage.setItem('appointments', JSON.stringify(mockAppointments))
        
        const loaded = loadAppointments()
        expect(loaded).toEqual(mockAppointments)
      })

      it('should return empty array when no appointments exist', () => {
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })

      it('should return empty array when localStorage is empty', () => {
        localStorage.removeItem('appointments')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })
    })

    describe('Error Handling - Corrupted Data', () => {
      it('should handle corrupted JSON data', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error')
        localStorage.setItem('appointments', 'invalid json {]')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      it('should handle null JSON value', () => {
        localStorage.setItem('appointments', 'null')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })

      it('should handle non-array JSON data', () => {
        localStorage.setItem('appointments', '{"not": "an array"}')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })

      it('should handle string instead of array', () => {
        localStorage.setItem('appointments', '"string value"')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })

      it('should handle number instead of array', () => {
        localStorage.setItem('appointments', '123')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })

      it('should handle empty string in localStorage', () => {
        localStorage.setItem('appointments', '')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })
    })

    describe('Error Handling - Storage Access Failures', () => {
      it.skip('should handle localStorage.getItem throwing error (jsdom unsupported)', () => {})

      it.skip('should handle SecurityError when accessing localStorage (jsdom unsupported)', () => {})
    })

    describe('Edge Cases - Data Validation', () => {
      it('should handle partially valid appointment data', () => {
        const partialData = [
          mockAppointment,
          { id: 'incomplete', doctorName: 'Dr. Test' }, // Missing fields
        ]
        localStorage.setItem('appointments', JSON.stringify(partialData))
        
        const loaded = loadAppointments()
        expect(Array.isArray(loaded)).toBe(true)
        expect(loaded).toHaveLength(2)
      })

      it('should handle appointments with extra properties', () => {
        const extraProps = [
          { ...mockAppointment, extraField: 'extra data' },
        ]
        localStorage.setItem('appointments', JSON.stringify(extraProps))
        
        const loaded = loadAppointments()
        expect(loaded[0]).toHaveProperty('extraField')
      })

      it('should handle empty array in storage', () => {
        localStorage.setItem('appointments', '[]')
        
        const loaded = loadAppointments()
        expect(loaded).toEqual([])
      })
    })
  })

  describe('clearAppointments', () => {
    describe('Standard Operations', () => {
      it('should remove appointments from localStorage', () => {
        localStorage.setItem('appointments', JSON.stringify(mockAppointments))
        
        clearAppointments()
        
        const stored = localStorage.getItem('appointments')
        expect(stored).toBeNull()
      })

      it('should not throw when clearing non-existent appointments', () => {
        expect(() => clearAppointments()).not.toThrow()
      })

      it('should handle clearing already cleared storage', () => {
        clearAppointments()
        clearAppointments()
        
        expect(localStorage.getItem('appointments')).toBeNull()
      })
    })

    describe('Error Handling', () => {
      it.skip('should handle localStorage.removeItem throwing error (jsdom unsupported)', () => {})

      it.skip('should handle SecurityError when removing from localStorage (jsdom unsupported)', () => {})
    })
  })

  describe('Integration - Full Workflow', () => {
    it('should support save, load, and clear workflow', () => {
      // Save
      saveAppointments(mockAppointments)
      
      // Load
      let loaded = loadAppointments()
      expect(loaded).toEqual(mockAppointments)
      
      // Clear
      clearAppointments()
      
      // Load again should return empty
      loaded = loadAppointments()
      expect(loaded).toEqual([])
    })

    it('should handle multiple save operations', () => {
      saveAppointments([mockAppointment])
      saveAppointments(mockAppointments)
      saveAppointments([])
      
      const loaded = loadAppointments()
      expect(loaded).toEqual([])
    })

    it('should maintain data consistency across operations', () => {
      const appointments = [mockAppointment]
      
      saveAppointments(appointments)
      const loaded1 = loadAppointments()
      
      saveAppointments(loaded1)
      const loaded2 = loadAppointments()
      
      expect(loaded2).toEqual(appointments)
    })
  })
})
