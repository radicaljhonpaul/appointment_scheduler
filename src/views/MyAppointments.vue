<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppointmentStore } from '@/stores/appointments'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import type { Appointment } from '@/types'
import { formatDisplayDate } from '@/utils/dateHelpers'
import { Calendar, Clock, MapPin, CheckCircle2, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const store = useAppointmentStore()

const showCancelDialog = ref(false)
const appointmentToCancel = ref<Appointment | null>(null)
const cancelError = ref<string | null>(null)

function openCancelDialog(appointment: Appointment) {
  appointmentToCancel.value = appointment
  cancelError.value = null
  showCancelDialog.value = true
}

function confirmCancel() {
  if (!appointmentToCancel.value) return

  try {
    store.cancelAppointment(appointmentToCancel.value.id)
    showCancelDialog.value = false
    appointmentToCancel.value = null
  } catch (error) {
    cancelError.value = error instanceof Error ? error.message : 'Failed to cancel appointment'
  }
}

function goToDoctors() {
  router.push('/')
}

function toRefCode(input: string): string {
  let hash = 0 >>> 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  const code = (hash % 1000000).toString().padStart(6, '0')
  return `DRW${code}`
}

function dateParts(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.getDate(),
    month: d.toLocaleString('en-US', { month: 'long' }),
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-4xl font-bold tracking-tight">My Appointments</h1>
      <p class="mt-2 text-muted-foreground">View and manage your scheduled appointments</p>
    </div>

    <!-- Empty State -->
    <div v-if="store.appointments.length === 0" class="text-center">
      <Alert class="mb-6">
        <AlertTitle>No Appointments</AlertTitle>
        <AlertDescription>You haven't scheduled any appointments yet.</AlertDescription>
      </Alert>
      <Button @click="goToDoctors">Browse Doctors</Button>
    </div>

    <!-- Appointments List -->
    <div v-else class="space-y-8">
      <!-- Upcoming Appointments -->
      <div v-if="store.upcomingAppointments.length > 0">
        <h2 class="mb-4 text-2xl font-semibold">Upcoming</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3">
          <Card
            v-for="appointment in store.upcomingAppointments"
            :key="appointment.id"
            class="transition-shadow hover:shadow-lg"
          >
            <CardHeader class="pb-2">
              <CardTitle class="text-xl">{{ appointment.doctorName }}</CardTitle>
              <div class="flex flex-wrap gap-2">
                <Badge variant="secondary">{{ appointment.doctorTimezone }}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4 items-start">
                <!-- Left details -->
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-2">
                    <Calendar :size="16" class="text-muted-foreground" />
                    <span>{{ formatDisplayDate(appointment.date) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Clock :size="16" class="text-muted-foreground" />
                    <span>{{ appointment.startTime }} – {{ appointment.endTime }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <MapPin :size="16" class="text-muted-foreground" />
                    <span>{{ appointment.doctorTimezone }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <CheckCircle2 :size="16" class="text-muted-foreground" />
                    <span>Ref:&nbsp;<span class="font-medium">{{ toRefCode(appointment.id) }}</span></span>
                  </div>
                </div>

                <!-- Right date tile -->
                <div class="rounded-2xl border bg-background p-3 text-center shadow-sm">
                  <div class="text-6xl font-bold leading-none tracking-tight text-primary">
                    {{ dateParts(appointment.date).day }}
                  </div>
                  <div class="mt-1 text-xs font-medium">{{ dateParts(appointment.date).month }}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter class="flex gap-2 pt-2">
              <Button
                variant="destructive"
                size="sm"
                class="flex-1"
                @click="openCancelDialog(appointment)"
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Past Appointments -->
      <div v-if="store.pastAppointments.length > 0">
        <Separator class="my-6" />
        <h2 class="mb-4 text-2xl font-semibold text-muted-foreground">Past</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="appointment in store.pastAppointments"
            :key="appointment.id"
            class="opacity-75"
          >
            <CardHeader class="pb-2">
              <CardTitle class="text-xl">{{ appointment.doctorName }}</CardTitle>
              <Badge variant="outline">{{ appointment.doctorTimezone }}</Badge>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4 items-start">
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-2">
                    <Calendar :size="16" class="text-muted-foreground" />
                    <span>{{ formatDisplayDate(appointment.date) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Clock :size="16" class="text-muted-foreground" />
                    <span>{{ appointment.startTime }} – {{ appointment.endTime }}</span>
                  </div>
                </div>
                <div class="rounded-2xl border bg-background p-3 text-center shadow-sm">
                  <div class="text-3xl font-bold leading-none tracking-tight text-primary">
                    {{ dateParts(appointment.date).day }}
                  </div>
                  <div class="mt-1 text-xs font-medium">{{ dateParts(appointment.date).month }}</div>
                  <div class="mt-3 text-[10px] text-muted-foreground">Time</div>
                  <div class="text-xs font-semibold">{{ appointment.startTime }}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Dialog -->
    <Dialog v-model:open="showCancelDialog">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <div class="flex items-start gap-3">
            <div class="rounded-xl bg-destructive/10 p-3 text-destructive">
              <AlertTriangle :size="28" />
            </div>
            <div class="space-y-1">
              <DialogTitle class="text-xl">Cancel Appointment</DialogTitle>
              <DialogDescription class="text-sm leading-relaxed">
                This will permanently remove the appointment from your schedule. You may need to
                book again and risk losing this time slot.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div v-if="appointmentToCancel" class="space-y-5">
          <!-- Appointment Summary -->
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-6 items-start">
            <div class="space-y-3 text-sm">
              <!-- Doctor name on top -->
              <div class="font-medium uppercase tracking-wide text-muted-foreground">Doctor / Physician</div>
              <div class="text-2xl font-semibold leading-none">
                {{ appointmentToCancel.doctorName }}
              </div>
              <div class="flex items-center gap-2">
                <Calendar :size="16" class="text-muted-foreground" />
                <span>{{ formatDisplayDate(appointmentToCancel.date) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Clock :size="16" class="text-muted-foreground" />
                <span>{{ appointmentToCancel.startTime }} – {{ appointmentToCancel.endTime }}</span>
              </div>
              <div class="flex items-center gap-2">
                <MapPin :size="16" class="text-muted-foreground" />
                <span>{{ appointmentToCancel.doctorTimezone }}</span>
              </div>
              <div class="flex items-center gap-2">
                <CheckCircle2 :size="16" class="text-muted-foreground" />
                <span>Ref:&nbsp;<span class="font-medium">{{ toRefCode(appointmentToCancel.id) }}</span></span>
              </div>
            </div>
            <div class="rounded-2xl border bg-background p-4 text-center shadow-sm">
              <div class="text-5xl font-bold leading-none tracking-tight text-primary">
                {{ dateParts(appointmentToCancel.date).day }}
              </div>
              <div class="mt-1 text-xs font-medium">
                {{ dateParts(appointmentToCancel.date).month }}
              </div>
            </div>
          </div>

          <!-- Warning Panel -->
          <Alert variant="destructive" class="border-destructive/30 bg-destructive/5">
            <AlertTitle class="text-destructive">Confirm Cancellation</AlertTitle>
            <AlertDescription>
              Cancelling cannot be undone. If this is a consultation you still need, consider
              rescheduling instead.
            </AlertDescription>
          </Alert>

          <!-- Error -->
          <Alert v-if="cancelError" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ cancelError }}</AlertDescription>
          </Alert>
        </div>

        <DialogFooter class="flex-col gap-2 sm:flex-row sm:gap-3 mt-4">
          <Button variant="outline" class="sm:flex-1" @click="showCancelDialog = false">
            Keep Appointment
          </Button>
          <Button variant="destructive" class="sm:flex-1" @click="confirmCancel">
            Cancel Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
