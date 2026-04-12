import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Historial from '../views/Historial.vue'
import Movimientos from '../views/Movimientos.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/historial', component: Historial, meta: { requiresAuth: true } },
  { path: '/movimientos/:tipo', component: Movimientos, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!auth.checked) await auth.checkSession()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next('/login')
  }
  if (to.meta.guest && auth.isLoggedIn) {
    return next('/dashboard')
  }
  next()
})

export default router
