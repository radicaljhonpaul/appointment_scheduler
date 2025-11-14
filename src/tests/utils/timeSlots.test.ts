import { describe, it, expect } from 'vitest'
import {
  parseTime,
  formatTime,
  generateTimeSlots,
  isSlotBooked,
  markBookedSlots,
} from '@/utils/timeSlots'
import { mockAppointments } from '../helpers/mockData'
import type { TimeSlot } from '@/types'

describe('Time Slots Utilities - Edge Cases and Error Handling', () => {
  describe('parseTime', () => {
    describe('Valid Time Formats', () => {
      it('should parse time with single digit hour', () => {
        expect(parseTime('9:00AM')).toEqual({ hours: 9, minutes: 0 })
        expect(parseTime('9:30PM')).toEqual({ hours: 21, minutes: 30 })
      })

      it('should parse time with double digit hour', () => {
        expect(parseTime('12:00AM')).toEqual({ hours: 0, minutes: 0 })
        expect(parseTime('12:00PM')).toEqual({ hours: 12, minutes: 0 })
      })

      it('should parse time with spaces', () => {
        expect(parseTime('9:00 AM')).toEqual({ hours: 9, minutes: 0 })
        expect(parseTime(' 9:00 AM ')).toEqual({ hours: 9, minutes: 0 })
        expect(parseTime('  9:00   AM  ')).toEqual({ hours: 9, minutes: 0 })
      })

      it('should handle case-insensitive AM/PM', () => {
        expect(parseTime('9:00am')).toEqual({ hours: 9, minutes: 0 })
        expect(parseTime('9:00AM')).toEqual({ hours: 9, minutes: 0 })
        expect(parseTime('9:00Am')).toEqual({ hours: 9, minutes: 0 })
      })

      it('should handle noon and midnight correctly', () => {
        expect(parseTime('12:00AM')).toEqual({ hours: 0, minutes: 0 })
        expect(parseTime('12:00PM')).toEqual({ hours: 12, minutes: 0 })
        expect(parseTime('12:30AM')).toEqual({ hours: 0, minutes: 30 })
        expect(parseTime('12:30PM')).toEqual({ hours: 12, minutes: 30 })
      })
    })

    describe('Invalid Time Formats - Negative Cases', () => {
      it('should throw error for missing AM/PM', () => {
        expect(() => parseTime('9:00')).toThrow('Invalid time format: 9:00')
      })

      it('should throw error for missing colon', () => {
        expect(() => parseTime('900AM')).toThrow('Invalid time format: 900AM')
      })

      it('should throw error for invalid minutes format', () => {
        expect(() => parseTime('9:0AM')).toThrow('Invalid time format: 9:0AM')
      })

      it('should throw error for empty string', () => {
        expect(() => parseTime('')).toThrow('Invalid time format: ')
      })

      it('should throw error for malformed time', () => {
        expect(() => parseTime('abc:def')).toThrow('Invalid time format: abc:def')
      })

      it('should throw error for 24-hour format', () => {
        expect(() => parseTime('13:00')).toThrow('Invalid time format: 13:00')
      })

      it('should allow invalid hour >12 (tests current behavior)', () => {
        // Current implementation doesn't validate hour ranges
        expect(() => parseTime('13:00PM')).not.toThrow()
        const result = parseTime('13:00PM')
        expect(result.hours).toBe(25) // 13 + 12
      })

      it('should allow hour 0 with AM/PM (tests current behavior)', () => {
        // Current implementation doesn't prevent 0 hours
        expect(() => parseTime('0:00AM')).not.toThrow()
      })
    })

    describe('Boundary Cases', () => {
      it('should handle first minute of day', () => {
        expect(parseTime('12:00AM')).toEqual({ hours: 0, minutes: 0 })
      })

      it('should handle last minute before noon', () => {
        expect(parseTime('11:59AM')).toEqual({ hours: 11, minutes: 59 })
      })

      it('should handle first minute after noon', () => {
        expect(parseTime('12:01PM')).toEqual({ hours: 12, minutes: 1 })
      })

      it('should handle last minute of day', () => {
        expect(parseTime('11:59PM')).toEqual({ hours: 23, minutes: 59 })
      })
    })
  })

  describe('formatTime', () => {
    describe('Valid Formatting', () => {
      it('should format morning hours correctly', () => {
        expect(formatTime(0, 0)).toBe('12:00 AM')
        expect(formatTime(9, 0)).toBe('9:00 AM')
        expect(formatTime(11, 59)).toBe('11:59 AM')
      })

      it('should format afternoon/evening hours correctly', () => {
        expect(formatTime(12, 0)).toBe('12:00 PM')
        expect(formatTime(13, 0)).toBe('1:00 PM')
        expect(formatTime(23, 59)).toBe('11:59 PM')
      })

      it('should pad minutes with leading zero', () => {
        expect(formatTime(9, 5)).toBe('9:05 AM')
        expect(formatTime(14, 9)).toBe('2:09 PM')
      })
    })

    describe('Edge Cases - Non-Standard Inputs', () => {
      it('should handle edge case hours', () => {
        expect(formatTime(0, 0)).toBe('12:00 AM') // Midnight
        expect(formatTime(12, 0)).toBe('12:00 PM') // Noon
      })

      it('should handle single-digit minutes', () => {
        expect(formatTime(9, 0)).toBe('9:00 AM')
        expect(formatTime(9, 5)).toBe('9:05 AM')
      })

      // These would be programming errors, but testing defensive behavior
      it('should format hours above 23 as-is (boundary behavior)', () => {
        expect(formatTime(24, 0)).toBe('12:00 PM') // 24 % 12 = 0, treated as noon
        expect(formatTime(25, 0)).toBe('13:00 PM') // Shows limitation in current implementation
      })
    })
  })

  describe('generateTimeSlots', () => {
    describe('Standard Cases', () => {
      it('should generate 30-minute slots for standard work hours', () => {
        const slots = generateTimeSlots('9:00 AM', '5:00 PM')
        expect(slots).toHaveLength(16) // 8 hours = 16 slots
        expect(slots[0]!.startTime).toBe('9:00 AM')
        expect(slots[0]!.endTime).toBe('9:30 AM')
        expect(slots[15]!.startTime).toBe('4:30 PM')
        expect(slots[15]!.endTime).toBe('5:00 PM')
      })

      it('should mark all slots as available by default', () => {
        const slots = generateTimeSlots('9:00 AM', '11:00 AM')
        slots.forEach((slot) => {
          expect(slot.isAvailable).toBe(true)
          expect(slot.isBooked).toBe(false)
        })
      })
    })

    describe('Edge Cases - Time Boundaries', () => {
      it('should handle single 30-minute slot', () => {
        const slots = generateTimeSlots('9:00 AM', '9:30 AM')
        expect(slots).toHaveLength(1)
        expect(slots[0]!.startTime).toBe('9:00 AM')
        expect(slots[0]!.endTime).toBe('9:30 AM')
      })

      it('should handle slots crossing noon', () => {
        const slots = generateTimeSlots('11:30 AM', '12:30 PM')
        expect(slots).toHaveLength(2)
        expect(slots[0]!.startTime).toBe('11:30 AM')
        expect(slots[0]!.endTime).toBe('12:00 PM')
        expect(slots[1]!.startTime).toBe('12:00 PM')
        expect(slots[1]!.endTime).toBe('12:30 PM')
      })

      it('should handle slots crossing midnight (returns empty - limitation)', () => {
        // Current implementation doesn't handle overnight schedules
        const slots = generateTimeSlots('11:30 PM', '12:30 AM')
        expect(slots).toHaveLength(0) // Documents current limitation
      })

      it('should handle early morning hours', () => {
        const slots = generateTimeSlots('12:00 AM', '2:00 AM')
        expect(slots).toHaveLength(4)
        expect(slots[0]!.startTime).toBe('12:00 AM')
      })

      it('should handle very short time range', () => {
        const slots = generateTimeSlots('9:00 AM', '9:30 AM')
        expect(slots).toHaveLength(1)
      })
    })

    describe('Non-Happy Path - Invalid Ranges', () => {
      it('should return empty array when end time equals start time', () => {
        const slots = generateTimeSlots('9:00 AM', '9:00 AM')
        expect(slots).toHaveLength(0)
      })

      it('should handle end time before start time (returns empty - limitation)', () => {
        // Documents that overnight schedules aren't supported
        const slots = generateTimeSlots('10:00 PM', '2:00 AM')
        expect(slots).toHaveLength(0) // Current implementation limitation
      })
    })

    describe('Time Format Variations', () => {
      it('should handle times with extra whitespace', () => {
        const slots = generateTimeSlots(' 9:00 AM ', ' 11:00 AM ')
        expect(slots).toHaveLength(4)
      })

      it('should handle times without spaces in AM/PM', () => {
        const slots = generateTimeSlots('9:00AM', '11:00AM')
        expect(slots).toHaveLength(4)
      })
    })
  })

  describe('isSlotBooked', () => {
    const testSlot: TimeSlot = {
      startTime: '9:00 AM',
      endTime: '9:30 AM',
      isAvailable: true,
      isBooked: false,
    }

    describe('Booking Detection', () => {
      it('should return true when slot is booked', () => {
        const result = isSlotBooked(testSlot, '2025-11-17', 'Dr. Smith', mockAppointments)
        expect(result).toBe(true)
      })

      it('should return false when slot is not booked', () => {
        const result = isSlotBooked(testSlot, '2025-11-17', 'Dr. Johnson', mockAppointments)
        expect(result).toBe(false)
      })

      it('should return false for different date', () => {
        const result = isSlotBooked(testSlot, '2025-11-18', 'Dr. Smith', mockAppointments)
        expect(result).toBe(false)
      })

      it('should return false for different time slot', () => {
        const differentSlot: TimeSlot = {
          startTime: '10:30 AM',
          endTime: '11:00 AM',
          isAvailable: true,
          isBooked: false,
        }
        const result = isSlotBooked(differentSlot, '2025-11-17', 'Dr. Smith', mockAppointments)
        expect(result).toBe(false)
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty appointments array', () => {
        const result = isSlotBooked(testSlot, '2025-11-17', 'Dr. Smith', [])
        expect(result).toBe(false)
      })

      it('should handle case-sensitive doctor names', () => {
        const result = isSlotBooked(testSlot, '2025-11-17', 'dr. smith', mockAppointments)
        expect(result).toBe(false) // Case sensitive
      })

      it('should handle whitespace in time comparisons', () => {
        const slotWithSpaces: TimeSlot = {
          startTime: '9:00  AM',
          endTime: '9:30  AM',
          isAvailable: true,
          isBooked: false,
        }
        // Should not match due to exact string comparison
        const result = isSlotBooked(slotWithSpaces, '2025-11-17', 'Dr. Smith', mockAppointments)
        expect(result).toBe(false)
      })
    })
  })

  describe('markBookedSlots', () => {
    const slots: TimeSlot[] = [
      {
        startTime: '9:00 AM',
        endTime: '9:30 AM',
        isAvailable: true,
        isBooked: false,
      },
      {
        startTime: '9:30 AM',
        endTime: '10:00 AM',
        isAvailable: true,
        isBooked: false,
      },
      {
        startTime: '10:00 AM',
        endTime: '10:30 AM',
        isAvailable: true,
        isBooked: false,
      },
    ]

    describe('Booking Status Updates', () => {
      it('should mark booked slots correctly', () => {
        const result = markBookedSlots(slots, '2025-11-17', 'Dr. Smith', mockAppointments)
        
        expect(result[0]!.isBooked).toBe(true)
        expect(result[0]!.isAvailable).toBe(false)
        expect(result[1]!.isBooked).toBe(false)
        expect(result[1]!.isAvailable).toBe(true)
        expect(result[2]!.isBooked).toBe(true)
        expect(result[2]!.isAvailable).toBe(false)
      })

      it('should not mutate original slots array', () => {
        const originalSlots = [...slots]
        markBookedSlots(slots, '2025-11-17', 'Dr. Smith', mockAppointments)
        
        expect(slots).toEqual(originalSlots)
      })

      it('should return all available slots when no appointments', () => {
        const result = markBookedSlots(slots, '2025-11-17', 'Dr. Smith', [])
        
        result.forEach((slot) => {
          expect(slot.isBooked).toBe(false)
          expect(slot.isAvailable).toBe(true)
        })
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty slots array', () => {
        const result = markBookedSlots([], '2025-11-17', 'Dr. Smith', mockAppointments)
        expect(result).toEqual([])
      })

      it('should handle different doctor with same date', () => {
        const result = markBookedSlots(slots, '2025-11-17', 'Dr. Johnson', mockAppointments)
        
        result.forEach((slot) => {
          expect(slot.isBooked).toBe(false)
          expect(slot.isAvailable).toBe(true)
        })
      })

      it('should handle different date with same doctor', () => {
        const result = markBookedSlots(slots, '2025-11-18', 'Dr. Smith', mockAppointments)
        
        result.forEach((slot) => {
          expect(slot.isBooked).toBe(false)
          expect(slot.isAvailable).toBe(true)
        })
      })

      it('should preserve other slot properties', () => {
        const slotsWithDate: TimeSlot[] = [
          {
            startTime: '9:00 AM',
            endTime: '9:30 AM',
            isAvailable: true,
            isBooked: false,
            date: '2025-11-17',
          },
        ]
        
        const result = markBookedSlots(slotsWithDate, '2025-11-17', 'Dr. Smith', mockAppointments)
        expect(result[0]!.date).toBe('2025-11-17')
      })
    })
  })
})
