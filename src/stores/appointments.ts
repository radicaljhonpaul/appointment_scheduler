import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Doctor, Appointment } from '@/types'
import { fetchDoctors as apiFetchDoctors } from '@/services/api'
import { saveAppointments, loadAppointments } from '@/utils/localStorage'

export const useAppointmentStore = defineStore('appointments', () => {
  // State
  const doctors = ref<Doctor[]>([])
  const appointments = ref<Appointment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Initialize appointments from localStorage
  function initializeStore() {
    appointments.value = loadAppointments()
  }

  // Actions
  async function fetchDoctors() {
    loading.value = true
    error.value = null
    try {
      doctors.value = await apiFetchDoctors()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch doctors'
      console.error('Error fetching doctors:', err)
    } finally {
      loading.value = false
    }
  }

  function bookAppointment(appointment: Appointment) {
    // Check if slot is already booked
    const isAlreadyBooked = appointments.value.some(
      (appt) =>
        appt.doctorName === appointment.doctorName &&
        appt.date === appointment.date &&
        appt.startTime === appointment.startTime,
    )

    if (isAlreadyBooked) {
      throw new Error('This time slot is already booked')
    }

    // Add appointment
    appointments.value.push(appointment)

    // Persist to localStorage
    saveAppointments(appointments.value)
  }

  function cancelAppointment(appointmentId: string) {
    const index = appointments.value.findIndex((appt) => appt.id === appointmentId)

    if (index === -1) {
      throw new Error('Appointment not found')
    }

    appointments.value.splice(index, 1)

    // Persist to localStorage
    saveAppointments(appointments.value)
  }

  // Getters
  const getDoctorByName = computed(() => {
    return (name: string) => doctors.value.find((doctor) => doctor.name === name)
  })

  const getAppointmentsByDoctor = computed(() => {
    return (doctorName: string) =>
      appointments.value.filter((appt) => appt.doctorName === doctorName)
  })

  const upcomingAppointments = computed(() => {
    const now = new Date()
    return appointments.value
      .filter((appt) => {
        const apptDate = new Date(appt.date)
        return apptDate >= now
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  const pastAppointments = computed(() => {
    const now = new Date()
    return appointments.value
      .filter((appt) => {
        const apptDate = new Date(appt.date)
        return apptDate < now
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  const appointmentCount = computed(() => appointments.value.length)

  return {
    // State
    doctors,
    appointments,
    loading,
    error,
    // Actions
    initializeStore,
    fetchDoctors,
    bookAppointment,
    cancelAppointment,
    // Getters
    getDoctorByName,
    getAppointmentsByDoctor,
    upcomingAppointments,
    pastAppointments,
    appointmentCount,
  }
})
