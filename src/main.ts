import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/index.css'
import { useAppointmentStore } from '@/stores/appointments'

const app = createApp(App)

// Create Pinia and register
const pinia = createPinia()
app.use(pinia)

// Hydrate appointments from localStorage on app start
const appointmentStore = useAppointmentStore(pinia)
appointmentStore.initializeStore()

app.use(router)

app.mount('#app')
