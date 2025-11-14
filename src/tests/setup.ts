import { vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

// Setup global mocks
beforeEach(() => {
  // Reset localStorage before each test
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
  localStorageMock.clear()

  // Mock console.error to avoid cluttering test output
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})
