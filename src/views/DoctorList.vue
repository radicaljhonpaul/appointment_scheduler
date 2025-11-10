<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppointmentStore } from '@/stores/appointments'
import DoctorCard from '@/components/DoctorCard.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

const router = useRouter()
const store = useAppointmentStore()

onMounted(async () => {
  // Initialize store with localStorage data
  store.initializeStore()
  // Fetch doctors from API
  await store.fetchDoctors()
})

function goToSchedule(doctorName: string) {
  router.push(`/doctor/${encodeURIComponent(doctorName)}`)
}
</script>

<template>
  <div class="container mx-auto max-w-7xl p-6">
    <div class="mb-10">
      <h1
        class="text-3xl md:text-4xl font-semibold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
      >
        Available Doctors
      </h1>
      <p class="mt-2 text-sm md:text-base text-muted-foreground">
        Pick a doctor to view their schedule and book a time. All times are shown in the doctor's
        timezone.
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" class="h-48 w-full rounded-lg" />
    </div>

    <!-- Error State -->
    <Alert v-else-if="store.error" variant="destructive" class="mb-6">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ store.error }}</AlertDescription>
    </Alert>

    <!-- Empty State -->
    <Alert v-else-if="store.doctors.length === 0">
      <AlertTitle>No Doctors Available</AlertTitle>
      <AlertDescription>There are currently no doctors available for booking.</AlertDescription>
    </Alert>

    <!-- Doctors Grid -->
    <div v-else class="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="doctor in store.doctors"
        :key="doctor.name"
        class="h-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
        tabindex="0"
        role="button"
        @click="goToSchedule(doctor.name)"
        @keydown.enter="goToSchedule(doctor.name)"
      >
        <DoctorCard :doctor="doctor" />
      </div>
    </div>
  </div>
</template>
