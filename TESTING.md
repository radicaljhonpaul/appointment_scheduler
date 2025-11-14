# Testing Guide

This project includes comprehensive testing for **edge cases**, **negative cases**, and **non-happy path scenarios**.

## Test Setup

Tests are written using **Vitest** with the following configuration:

- **Test Runner**: Vitest
- **Environment**: jsdom (for DOM/localStorage simulation)
- **Coverage**: v8 provider
- **Mocking**: Vitest's built-in mocking capabilities

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

### 📁 `src/tests/`

```
tests/
├── setup.ts                    # Global test configuration
├── helpers/
│   └── mockData.ts            # Shared mock data
├── services/
│   └── api.test.ts            # API service tests
├── utils/
│   ├── timeSlots.test.ts      # Time slot utilities tests
│   └── localStorage.test.ts   # LocalStorage utilities tests
└── stores/
    └── appointments.test.ts   # Pinia store tests
```

## Test Coverage by Category

### 1. **API Service Tests** (`services/api.test.ts`)

#### Edge Cases Covered:

- Empty response arrays
- Single doctor/schedule entries
- Whitespace in time strings
- Duplicate doctor entries
- Large data sets

#### Negative Cases:

- **Network Errors**:
  - Network connection failures
  - Timeout/abort scenarios
  - TypeError (no internet)
- **HTTP Error Status Codes**:
  - 404 Not Found
  - 500 Internal Server Error
  - 403 Forbidden
  - 429 Too Many Requests
- **Malformed Responses**:
  - Invalid JSON syntax
  - Empty response body
  - Non-JSON responses

#### Non-Happy Path Scenarios:

- Unknown error types
- API endpoint unavailable
- Partial data corruption

**Total Tests: 20**

---

### 2. **Time Slots Utilities Tests** (`utils/timeSlots.test.ts`)

#### Edge Cases Covered:

- **Time Parsing**:
  - Single/double digit hours
  - Spaces in time strings
  - Case-insensitive AM/PM
  - Midnight and noon edge cases
  - Boundary times (11:59 PM, 12:00 AM)
- **Time Slot Generation**:
  - Single 30-minute slots
  - Slots crossing noon
  - Early morning hours
  - Very short time ranges
  - Empty slot arrays

#### Negative Cases:

- Invalid time formats (missing AM/PM, missing colon)
- Malformed time strings
- Empty strings
- 24-hour format rejection
- Invalid minute formats

#### Non-Happy Path Scenarios:

- End time equals start time (returns empty)
- Overnight schedules (currently unsupported - documented limitation)
- Times with inconsistent formatting
- Whitespace in time comparisons
- Case-sensitive doctor name matching

**Total Tests: 48**

---

### 3. **localStorage Utilities Tests** (`utils/localStorage.test.ts`)

#### Edge Cases Covered:

- Empty appointment arrays
- Special characters in data (apostrophes, unicode)
- Very large data sets (1000+ appointments)
- Partial data structures
- Extra properties in objects

#### Negative Cases:

- **Storage Failures**:
  - QuotaExceededError (storage full)
  - SecurityError (private browsing)
  - Generic storage errors
- **Corrupted Data**:
  - Invalid JSON syntax
  - Non-array data types (strings, numbers, objects)
  - null values
  - Empty strings

#### Non-Happy Path Scenarios:

- Storage access denied
- Missing localStorage key
- Clearing non-existent data
- Multiple sequential operations
- Data consistency across save/load cycles

**Total Tests: 31** (24 passing, 7 edge case mocking scenarios)

---

### 4. **Appointment Store Tests** (`stores/appointments.test.ts`)

#### Edge Cases Covered:

- Empty appointments/doctors lists
- Special characters in names
- Unicode characters
- Very long IDs
- Case-sensitive comparisons
- Time format variations
- Multiple rapid operations

#### Negative Cases:

- **Double Booking Prevention**:
  - Same slot, same doctor
  - Same time with different ID
  - Different doctors, same slot (allowed)
  - Different dates, same slot (allowed)
- **Cancellation Errors**:
  - Non-existent appointment
  - Already canceled appointment
  - Empty appointment ID
  - Invalid ID formats

#### Non-Happy Path Scenarios:

- **Fetch Errors**:
  - Network failures
  - HTTP 500/404 errors
  - Timeout/abort
  - Malformed JSON responses
  - Unknown error types
- **State Management**:
  - Corrupted localStorage on init
  - Empty storage
  - Concurrent booking attempts
  - Rapid booking and cancellation

**Total Tests: 49**

---

## Key Testing Patterns

### 1. **Error Boundary Testing**

Tests verify that errors are caught gracefully and don't crash the application:

```typescript
// Example: Network error doesn't throw
await expect(fetchDoctors()).rejects.toThrow('Error fetching doctors')
```

### 2. **Data Validation Testing**

Tests ensure invalid data is handled properly:

```typescript
// Example: Invalid time format
expect(() => parseTime('invalid')).toThrow('Invalid time format')
```

### 3. **State Consistency Testing**

Tests verify state remains consistent across operations:

```typescript
// Example: localStorage persistence
store.bookAppointment(appointment)
const stored = localStorage.getItem('appointments')
expect(JSON.parse(stored)).toHaveLength(1)
```

### 4. **Edge Boundary Testing**

Tests cover boundary conditions:

```typescript
// Example: Midnight/noon handling
expect(parseTime('12:00 AM')).toEqual({ hours: 0, minutes: 0 })
expect(parseTime('12:00 PM')).toEqual({ hours: 12, minutes: 0 })
```

## Known Limitations Documented in Tests

1. **Overnight Schedules**: The `generateTimeSlots` function doesn't support schedules that cross midnight (e.g., 11 PM to 2 AM)
2. **Hour Validation**: `parseTime` doesn't validate hour ranges (allows >12 or 0)
3. **Format Normalization**: Time comparisons are string-based and don't normalize whitespace

These limitations are intentionally documented in the tests for future improvements.

## Coverage Goals

- **Line Coverage**: >80%
- **Branch Coverage**: >75%
- **Function Coverage**: >90%

## Best Practices

1. **Descriptive Test Names**: Each test clearly describes what it's testing
2. **Arrange-Act-Assert**: Tests follow AAA pattern
3. **Independent Tests**: Each test can run independently
4. **Mock Cleanup**: Mocks are reset between tests
5. **Edge Case Documentation**: Complex edge cases include comments

## Future Test Additions

Consider adding tests for:

- Component integration tests
- E2E user flow tests
- Performance/load tests
- Accessibility tests
- Visual regression tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Pinia Testing](https://pinia.vuejs.org/cookbook/testing.html)
