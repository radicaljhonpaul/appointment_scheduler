<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Doctor, Appointment, TimeSlot } from '@/types'
import { generateTimeSlots, markBookedSlots } from '@/utils/timeSlots'
import { getNextWeekDates, getDayOfWeek, formatDate, formatDisplayDate } from '@/utils/dateHelpers'

const props = defineProps<{
  doctor: Doctor
  appointments: Appointment[]
}>()

const emit = defineEmits<{
  book: [slot: TimeSlot & { date: string; dayOfWeek: string }]
}>()

// Get next 7 days
const weekDates = computed(() => getNextWeekDates())

// Get slots for each day
const slotsPerDay = computed(() => {
  const result: Array<{
    date: Date
    dateString: string
    dayName: string
    displayDate: string
    schedule: typeof props.doctor.schedules[0] | null
    slots: TimeSlot[]
  }> = []

  weekDates.value.forEach((date) => {
    const dayName = getDayOfWeek(date)
    const dateString = formatDate(date)

    // Find schedule for this day
    const schedule = props.doctor.schedules.find((s) => s.dayOfWeek === dayName)

    if (schedule) {
      // Generate time slots for this day
      const slots = generateTimeSlots(schedule.availableAt, schedule.availableUntil)

      // Mark booked slots
      const markedSlots = markBookedSlots(slots, dateString, props.doctor.name, props.appointments)

      result.push({
        date,
        dateString,
        dayName,
        displayDate: formatDisplayDate(date),
        schedule,
        slots: markedSlots,
      })
    } else {
      // No schedule for this day
      result.push({
        date,
        dateString,
        dayName,
        displayDate: formatDisplayDate(date),
        schedule: null,
        slots: [],
      })
    }
  })

  return result
})

function handleSlotClick(dayInfo: (typeof slotsPerDay.value)[0], slot: TimeSlot) {
  if (!slot.isAvailable || slot.isBooked) return

  emit('book', {
    ...slot,
    date: dayInfo.dateString,
    dayOfWeek: dayInfo.dayName,
  })
}
</script>

<template>
  <div class="w-full">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="day in slotsPerDay" :key="day.dateString" class="rounded-lg border p-4">
        <div class="mb-3">
          <h3 class="font-semibold">{{ day.dayName }}</h3>
          <p class="text-xs text-muted-foreground">{{ day.displayDate }}</p>
        </div>

        <div v-if="day.schedule" class="space-y-2">
          <Badge variant="outline" class="mb-2 text-xs">
            {{ day.schedule.availableAt }} - {{ day.schedule.availableUntil }}
          </Badge>

          <div class="grid grid-cols-2 gap-2">
            <Button
              v-for="slot in day.slots"
              :key="slot.startTime"
              :variant="slot.isBooked ? 'secondary' : 'default'"
              :disabled="slot.isBooked"
              size="sm"
              class="h-auto py-2 text-xs"
              @click="handleSlotClick(day, slot)"
            >
              {{ slot.startTime }}
            </Button>
          </div>
        </div>

        <div v-else class="text-center">
          <Badge variant="secondary">Not Available</Badge>
        </div>
      </div>
    </div>
  </div>
</template>
