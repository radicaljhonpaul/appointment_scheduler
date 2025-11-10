import { createRouter, createWebHistory } from 'vue-router'
import DoctorList from '@/views/DoctorList.vue'
import DoctorSchedule from '@/views/DoctorSchedule.vue'
import MyAppointments from '@/views/MyAppointments.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DoctorList,
      meta: {
        title: 'Available Doctors',
      },
    },
    {
      path: '/doctor/:name',
      name: 'doctor-schedule',
      component: DoctorSchedule,
      meta: {
        title: 'Doctor Schedule',
      },
    },
    {
      path: '/appointments',
      name: 'my-appointments',
      component: MyAppointments,
      meta: {
        title: 'My Appointments',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
