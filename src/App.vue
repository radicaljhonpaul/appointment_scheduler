<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAppointmentStore } from '@/stores/appointments'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileStackIcon, Stethoscope, ViewIcon } from 'lucide-vue-next'

const route = useRoute()
const store = useAppointmentStore()

const appointmentCount = computed(() => store.appointmentCount)
const isHomePage = computed(() => route.path === '/')
const isAppointmentsPage = computed(() => route.path === '/appointments')
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation Header -->
    <header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div class="container mx-auto flex h-16 items-center justify-between px-4">
        <!-- Logo/Title -->
        <RouterLink to="/" class="flex items-center space-x-2">
          <h1 class="text-xl font-bold tracking-tight">Doctor Scheduler</h1>
        </RouterLink>

        <!-- Navigation Links -->
        <nav class="flex items-center gap-2">
          <Button
            variant="ghost"
            as-child
            :class="{ 'bg-accent': isHomePage }"
          >
            <RouterLink to="/">
              <Stethoscope :size="16" stroke-width="3" class="text-primary/80 shrink-0" aria-hidden="true" />
              Doctors
            </RouterLink>
          </Button>
          <Button
            variant="ghost"
            as-child
            :class="{ 'bg-accent': isAppointmentsPage }"
          >
            <RouterLink to="/appointments" class="flex items-center gap-2">
              <FileStackIcon :size="16" stroke-width="3" class="text-primary/80 shrink-0" aria-hidden="true" />
              My Appointments
              <Badge v-if="appointmentCount > 0" variant="default" class="ml-1">
                {{ appointmentCount }}
              </Badge>
            </RouterLink>
          </Button>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="mt-16 border-t py-6">
      <div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>Doctor Appointment Scheduler &copy; 2025</p>
        <p class="mt-1">Built with Vue 3, TypeScript, Pinia, and shadcn-vue</p>
      </div>
    </footer>
  </div>
</template>

<style scoped></style>
