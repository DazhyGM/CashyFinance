<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">◈</span>
        <span class="brand-name">Finanzas</span>
      </div>

      <nav class="nav">
        <RouterLink to="/dashboard" class="nav-item">
          <span class="nav-icon">▦</span>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/movimientos/ingresos" class="nav-item">
          <span class="nav-icon" style="color: var(--green-mid)">↑</span>
          <span>Ingresos</span>
        </RouterLink>
        <RouterLink to="/movimientos/gastos" class="nav-item">
          <span class="nav-icon" style="color: var(--red-mid)">↓</span>
          <span>Gastos</span>
        </RouterLink>
        <RouterLink to="/movimientos/deudas" class="nav-item">
          <span class="nav-icon" style="color: var(--blue-mid)">⊘</span>
          <span>Deudas</span>
        </RouterLink>
        <RouterLink to="/historial" class="nav-item">
          <span class="nav-icon">◷</span>
          <span>Historial</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-pill">
          <span class="user-avatar">{{ auth.nick?.charAt(0).toUpperCase() }}</span>
          <span class="user-nick">@{{ auth.nick }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Cerrar sesión">⏻</button>
      </div>
    </aside>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
@import '../styles/appLayout.css';
</style>
