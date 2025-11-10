<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ViewIcon } from 'lucide-vue-next'
import type { Doctor } from '@/types'

const props = defineProps<{
  doctor: Doctor
}>()

// Build a friendly unique-days string for display
const availableDays = computed(() => {
  const uniqueDays = Array.from(new Set(props.doctor.schedules.map((s) => s.dayOfWeek)))
  return uniqueDays.join(', ')
})
// Total time blocks (raw schedules) — kept for possible future use
// const timeBlockCount = computed(() => props.doctor.schedules.length)
// Unique day count (each distinct weekday once)
const uniqueDayCount = computed(() => new Set(props.doctor.schedules.map(s => s.dayOfWeek)).size)

// Use a deterministic avatar (no backend required)
const avatarUrl = computed(() => {
  const seed = encodeURIComponent(props.doctor.name)
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&scale=90&backgroundColor=6e56cf`
})
</script>

<template>
  <Card
    class="group relative h-full min-h-56 overflow-hidden border bg-card/60 backdrop-blur supports-backdrop-filter:bg-card/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] cursor-pointer"
  >
  <div class="flex items-stretch p-5 pr-28 md:pr-36 pb-10"> <!-- extra bottom padding so absolute footer never overlaps text; right padding reserves space for the fixed avatar -->
      <!-- Left: Text content -->
      <div class="flex-1 flex flex-col">
        <CardHeader class="p-0">
          <CardTitle class="text-xl font-semibold tracking-tight leading-6 flex items-center gap-2">
            {{ doctor.name }}
          </CardTitle>
          <CardDescription class="mt-1">
            <Badge variant="secondary">{{ doctor.timezone }}</Badge>
          </CardDescription>
        </CardHeader>

        <CardContent class="p-0 mt-4 flex-1 flex flex-col">
          <div class="space-y-2">
            <p class="text-xs uppercase text-muted-foreground tracking-wider">Available days</p>
            <p class="text-sm leading-6 text-foreground/90 line-clamp-2">
              {{ availableDays }}
            </p>
          </div>
        </CardContent>
      </div>

    </div>

    <!-- Top-right fixed avatar -->
    <div class="pointer-events-none absolute right-5 top-5">
      <div class="size-20 md:size-24 rounded-2xl ring-1 ring-border/60 shadow-sm overflow-hidden bg-muted/40">
        <img :src="avatarUrl" :alt="doctor.name" class="h-full w-full object-cover" loading="lazy" />
      </div>
    </div>

    <!-- Bottom fixed meta & arrow -->
    <div class="pointer-events-none absolute left-5 bottom-4 flex w-[calc(100%-2.5rem)] items-center justify-between">
      <p class="text-xs text-muted-foreground select-none">
        {{ uniqueDayCount }} day{{ uniqueDayCount !== 1 ? 's' : '' }} available
      </p>
      <span
        class="inline-flex items-center gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 text-muted-foreground text-xs font-medium"
        aria-hidden="true"
      >
        <ViewIcon :size="16" stroke-width="2" class="text-primary/80 shrink-0" aria-hidden="true" />
        <span class="select-none">Check schedules</span>
      </span>
    </div>
  </Card>
</template>
