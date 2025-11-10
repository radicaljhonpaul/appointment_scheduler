<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppointmentStore } from '@/stores/appointments'
import TimeSlotGrid from '@/components/TimeSlotGrid.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TimeSlot } from '@/types'
import { formatDisplayDate } from '@/utils/dateHelpers'
import { Calendar, Clock, MapPin, User, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useAppointmentStore()

const showDialog = ref(false)
const selectedSlot = ref<(TimeSlot & { date: string; dayOfWeek: string }) | null>(null)
const bookingError = ref<string | null>(null)
const bookingSuccess = ref(false)
const bookingRef = ref<string | null>(null)

const doctorName = computed(() => decodeURIComponent(route.params.name as string))
const doctor = computed(() => store.getDoctorByName(doctorName.value))

// Deterministic avatar matching DoctorCard styling
const avatarUrl = computed(() => {
  if (!doctor.value) return ''
  const seed = encodeURIComponent(doctor.value.name)
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&scale=90&backgroundColor=6e56cf`
})

// Unique day count (avoid duplicating same weekday with multiple blocks)
const uniqueDayCount = computed(() => {
  if (!doctor.value) return 0
  return new Set(doctor.value.schedules.map((s) => s.dayOfWeek)).size
})

// Parts for the big date tile in success state
const successDateParts = computed(() => {
  if (!selectedSlot.value) return null
  const d = new Date(selectedSlot.value.date)
  return {
    day: d.getDate(),
    month: d.toLocaleString('en-US', { month: 'long' }),
  }
})

function handleSlotSelection(slot: TimeSlot & { date: string; dayOfWeek: string }) {
  selectedSlot.value = slot
  bookingError.value = null
  bookingSuccess.value = false
  showDialog.value = true
}

function confirmBooking() {
  if (!selectedSlot.value || !doctor.value) return

  try {
    const appointment = {
      id: `${doctor.value.name}-${selectedSlot.value.date}-${selectedSlot.value.startTime}-${Date.now()}`,
      doctorName: doctor.value.name,
      doctorTimezone: doctor.value.timezone,
      date: selectedSlot.value.date,
      dayOfWeek: selectedSlot.value.dayOfWeek,
      startTime: selectedSlot.value.startTime,
      endTime: selectedSlot.value.endTime,
      bookedAt: new Date().toISOString(),
    }

    store.bookAppointment(appointment)
    bookingSuccess.value = true
    bookingError.value = null
    bookingRef.value = toRefCode(appointment.id)

    // Keep modal open so user can review/act; it will close when they navigate or click close
  } catch (error) {
    bookingError.value = error instanceof Error ? error.message : 'Failed to book appointment'
  }
}

function toRefCode(input: string): string {
  let hash = 0 >>> 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  const code = (hash % 1000000).toString().padStart(6, '0')
  return `DRW${code}`
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="container mx-auto p-6">
    <Button variant="ghost" @click="goBack" class="mb-6">
      ← Back to Doctors
    </Button>

    <div v-if="!doctor">
      <Alert variant="destructive">
        <AlertTitle>Doctor Not Found</AlertTitle>
        <AlertDescription>The doctor you're looking for could not be found.</AlertDescription>
      </Alert>
    </div>

    <div v-else>
      <!-- Doctor Info Header with avatar -->
      <div class="mb-8 flex items-start gap-6">
        <div class="size-24 rounded-2xl ring-1 ring-border/60 overflow-hidden bg-muted/40 shrink-0">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="doctor.name"
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="flex-1">
          <h1 class="text-4xl font-bold tracking-tight">{{ doctor.name }}</h1>
          <div class="mt-2 flex items-center gap-2 flex-wrap" v-if="doctor">
            <Badge variant="secondary">{{ doctor.timezone }}</Badge>
            <span class="text-muted-foreground">
              {{ uniqueDayCount }} day{{ uniqueDayCount !== 1 ? 's' : '' }} available
            </span>
          </div>
        </div>
      </div>

      <!-- Schedule Grid -->
      <div>
        <h2 class="mb-4 text-2xl font-semibold">Weekly Schedule</h2>
        <p class="mb-6 text-sm text-muted-foreground">
          Click on an available time slot to book an appointment
        </p>
        <TimeSlotGrid
          :doctor="doctor"
          :appointments="store.appointments"
          @book="handleSlotSelection"
        />
      </div>
    </div>

    <!-- Booking Confirmation Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold">
            <template v-if="!bookingSuccess">Confirm Appointment</template>
            <template v-else>Appointment Confirmed</template>
          </DialogTitle>
          <DialogDescription v-if="!bookingSuccess" class="text-sm text-muted-foreground">
            Review the details below and press confirm to finalize your booking.
          </DialogDescription>
        </DialogHeader>

        <!-- Confirmation State -->
        <div v-if="selectedSlot && doctor && !bookingSuccess" class="space-y-6 pt-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Doctor -->
            <div class="group rounded-xl border bg-card/60 backdrop-blur px-4 py-3 flex items-start gap-3 relative overflow-hidden">
              <div class="mt-0.5 text-primary/80">
                <User :size="18" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Doctor</p>
                <p class="truncate font-medium text-sm">{{ doctor.name }}</p>
              </div>
            </div>

            <!-- Date -->
            <div class="group rounded-xl border bg-card/60 backdrop-blur px-4 py-3 flex items-start gap-3 relative overflow-hidden">
              <div class="mt-0.5 text-primary/80">
                <Calendar :size="18" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Date</p>
                <p class="font-medium text-sm">{{ formatDisplayDate(selectedSlot.date) }}</p>
              </div>
            </div>

            <!-- Time -->
            <div class="group rounded-xl border bg-card/60 backdrop-blur px-4 py-3 flex items-start gap-3 relative overflow-hidden">
              <div class="mt-0.5 text-primary/80">
                <Clock :size="18" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Time</p>
                <p class="font-medium text-sm">{{ selectedSlot.startTime }} – {{ selectedSlot.endTime }}</p>
              </div>
            </div>

            <!-- Timezone -->
            <div class="group rounded-xl border bg-card/60 backdrop-blur px-4 py-3 flex items-start gap-3 relative overflow-hidden">
              <div class="mt-0.5 text-primary/80">
                <MapPin :size="18" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Timezone</p>
                <p class="font-medium text-sm">{{ doctor.timezone }}</p>
              </div>
            </div>
          </div>

          <Alert v-if="bookingError" variant="destructive" class="border-red-500/50 bg-red-50/60">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ bookingError }}</AlertDescription>
          </Alert>
        </div>

        <!-- Success State -->
        <div v-else-if="bookingSuccess && selectedSlot && doctor" class="pt-2">
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-5 items-start">
            <!-- Left: Details -->
            <div>
              <div class="flex items-center gap-2 text-primary">
                <div class="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 :size="20" />
                </div>
                <h3 class="text-base font-semibold">Booking confirmed</h3>
              </div>
              <p class="mt-3 text-sm text-muted-foreground">You're booked with</p>
              <p class="mt-1 text-lg font-semibold">{{ doctor.name }}</p>
              <div class="mt-4 space-y-2 text-sm">
                <div class="flex items-center gap-2">
                  <Calendar :size="16" class="text-muted-foreground" />
                  <span>{{ formatDisplayDate(selectedSlot.date) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Clock :size="16" class="text-muted-foreground" />
                  <span>{{ selectedSlot.startTime }} – {{ selectedSlot.endTime }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <MapPin :size="16" class="text-muted-foreground" />
                  <span>{{ doctor.timezone }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <User :size="16" class="text-muted-foreground" />
                  <span>Reference No:&nbsp;<span class="font-medium">{{ bookingRef }}</span></span>
                </div>
              </div>
              <div class="mt-5 flex gap-2">
                <Button variant="outline" @click="showDialog = false">Close</Button>
                <Button @click="router.push('/appointments'); showDialog = false">My Appointments</Button>
              </div>
            </div>

            <!-- Right: Big date tile -->
            <div class="rounded-2xl border bg-background p-4 text-center shadow-sm">
              <div class="text-5xl font-bold leading-none tracking-tight text-primary">
                {{ successDateParts?.day }}
              </div>
              <div class="mt-1 text-sm font-medium">{{ successDateParts?.month }}</div>
              <div class="mt-4 text-xs text-muted-foreground">Time</div>
              <div class="text-sm font-semibold">{{ selectedSlot.startTime }}</div>
            </div>
          </div>
        </div>

        <DialogFooter v-if="!bookingSuccess" class="mt-2">
          <Button variant="outline" @click="showDialog = false">Cancel</Button>
          <Button @click="confirmBooking" class="relative">
            <span>Confirm Booking</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
