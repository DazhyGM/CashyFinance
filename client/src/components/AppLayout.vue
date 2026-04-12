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
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 230px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  position: fixed;
  top: 0; left: 0; bottom: 0;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 36px;
}
.brand-icon { font-size: 22px; color: var(--green-mid); }
.brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.4px;
}
.nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.15s;
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.nav-item.router-link-active {
  background: var(--bg-hover);
  color: var(--text-primary);
  font-weight: 500;
}
.nav-icon { font-size: 16px; width: 20px; text-align: center; }
.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.user-avatar {
  width: 28px; height: 28px;
  background: var(--green);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: #fff;
  flex-shrink: 0;
}
.user-nick {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.logout-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.logout-btn:hover { color: var(--red-mid); }
.main-content {
  margin-left: 220px;
  flex: 1;
  padding: 32px;
  min-height: 100vh;
  overflow-y: auto;
}
</style>
