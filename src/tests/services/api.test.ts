import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchDoctorSchedules, groupSchedulesByDoctor, fetchDoctors } from '@/services/api'
import { mockDoctorScheduleRaw } from '../helpers/mockData'

describe('API Service - Edge Cases and Error Handling', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.resetAllMocks()
  })

  describe('fetchDoctorSchedules', () => {
    describe('Network Error Cases', () => {
      it('should throw error when fetch fails with network error', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

        await expect(fetchDoctorSchedules()).rejects.toThrow(
          'Error fetching doctors: Network error',
        )
      })

      it('should throw error when fetch fails with TypeError (no internet)', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

        await expect(fetchDoctorSchedules()).rejects.toThrow(
          'Error fetching doctors: Failed to fetch',
        )
      })

      it('should handle unknown error types gracefully', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue('Unknown error')

        await expect(fetchDoctorSchedules()).rejects.toThrow(
          'Unknown error occurred while fetching doctors',
        )
      })
    })

    describe('HTTP Error Status Codes', () => {
      it('should throw error on 404 Not Found', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })

        await expect(fetchDoctorSchedules()).rejects.toThrow('Failed to fetch doctors: 404 Not Found')
      })

      it('should throw error on 500 Internal Server Error', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })

        await expect(fetchDoctorSchedules()).rejects.toThrow(
          'Failed to fetch doctors: 500 Internal Server Error',
        )
      })

      it('should throw error on 403 Forbidden', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
        })

        await expect(fetchDoctorSchedules()).rejects.toThrow('Failed to fetch doctors: 403 Forbidden')
      })

      it('should throw error on 429 Too Many Requests', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })

        await expect(fetchDoctorSchedules()).rejects.toThrow(
          'Failed to fetch doctors: 429 Too Many Requests',
        )
      })
    })

    describe('Malformed Response Cases', () => {
      it('should throw error when response is not valid JSON', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
        })

        await expect(fetchDoctorSchedules()).rejects.toThrow(
          'Error fetching doctors: Unexpected token',
        )
      })

      it('should throw error when response body is empty', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
        })

        await expect(fetchDoctorSchedules()).rejects.toThrow(
          'Error fetching doctors: Unexpected end of JSON input',
        )
      })
    })

    describe('Success Case', () => {
      it('should successfully fetch and return doctor schedules', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue(mockDoctorScheduleRaw),
        })

        const result = await fetchDoctorSchedules()
        expect(result).toEqual(mockDoctorScheduleRaw)
      })
    })
  })

  describe('groupSchedulesByDoctor', () => {
    describe('Edge Cases', () => {
      it('should handle empty array', () => {
        const result = groupSchedulesByDoctor([])
        expect(result).toEqual([])
      })

      it('should handle single doctor with single schedule', () => {
        const singleSchedule = [mockDoctorScheduleRaw[0]!]
        const result = groupSchedulesByDoctor(singleSchedule)
        
        expect(result).toHaveLength(1)
        expect(result[0]!.name).toBe('Dr. Smith')
        expect(result[0]!.schedules).toHaveLength(1)
      })

      it('should handle doctor with whitespace in times', () => {
        const scheduleWithSpaces = [
          {
            name: 'Dr. Test',
            timezone: 'America/New_York',
            day_of_week: 'Monday',
            available_at: '  9:00 AM  ',
            available_until: '  5:00 PM  ',
          },
        ]
        
        const result = groupSchedulesByDoctor(scheduleWithSpaces)
        expect(result[0]!.schedules[0]!.availableAt).toBe('9:00 AM')
        expect(result[0]!.schedules[0]!.availableUntil).toBe('5:00 PM')
      })

      it('should handle multiple doctors with same name (duplicate)', () => {
        const duplicateNames = [
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
        ]
        
        const result = groupSchedulesByDoctor(duplicateNames)
        expect(result).toHaveLength(1)
        expect(result[0]!.schedules).toHaveLength(2)
      })

      it('should preserve order of schedules for same doctor', () => {
        const orderedSchedules = [
          {
            name: 'Dr. Test',
            timezone: 'America/New_York',
            day_of_week: 'Friday',
            available_at: '9:00 AM',
            available_until: '5:00 PM',
          },
          {
            name: 'Dr. Test',
            timezone: 'America/New_York',
            day_of_week: 'Monday',
            available_at: '10:00 AM',
            available_until: '6:00 PM',
          },
        ]
        
        const result = groupSchedulesByDoctor(orderedSchedules)
        expect(result[0]!.schedules[0]!.dayOfWeek).toBe('Friday')
        expect(result[0]!.schedules[1]!.dayOfWeek).toBe('Monday')
      })
    })

    describe('Data Integrity', () => {
      it('should correctly group multiple doctors', () => {
        const result = groupSchedulesByDoctor(mockDoctorScheduleRaw)
        
        expect(result).toHaveLength(2)
        expect(result.find((d) => d.name === 'Dr. Smith')?.schedules).toHaveLength(2)
        expect(result.find((d) => d.name === 'Dr. Johnson')?.schedules).toHaveLength(1)
      })

      it('should preserve all schedule properties', () => {
        const result = groupSchedulesByDoctor([mockDoctorScheduleRaw[0]!])
        
        expect(result[0]!.schedules[0]).toEqual({
          dayOfWeek: 'Monday',
          availableAt: '9:00 AM',
          availableUntil: '5:00 PM',
        })
      })
    })
  })

  describe('fetchDoctors - Integration', () => {
    it('should successfully fetch and group doctors', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDoctorScheduleRaw),
      })

      const result = await fetchDoctors()
      expect(result).toHaveLength(2)
      expect(result[0]!.name).toBe('Dr. Smith')
      expect(result[1]!.name).toBe('Dr. Johnson')
    })

    it('should propagate errors from fetchDoctorSchedules', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))

      await expect(fetchDoctors()).rejects.toThrow('Error fetching doctors: Network failure')
    })

    it('should handle empty response array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })

      const result = await fetchDoctors()
      expect(result).toEqual([])
    })
  })
})
