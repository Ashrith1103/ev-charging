import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../Stores/auth'

const routes = [
  { path: '/login',    component: () => import('../Views/LoginView.vue'),    meta: { guest: true } },
  { path: '/register', component: () => import('../Views/RegisterView.vue'), meta: { guest: true } },
  { path: '/',         component: () => import('../Views/DashboardView.vue'),meta: { auth:  true } },
  { path: '/map',      component: () => import('../Views/MapView.vue'),      meta: { auth:  true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.auth  && !auth.isLoggedIn) return next('/login')
  if (to.meta.guest && auth.isLoggedIn)  return next('/')
  next()
})

export default router