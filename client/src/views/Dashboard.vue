<template>
  <AppLayout>
    <div class="dashboard">
      <!-- Header -->
      <div class="page-header">
        <div>
          <p class="greeting">Bienvenido de vuelta</p>
          <h1 class="page-title">@{{ auth.nick }}</h1>
        </div>
        <div class="month-selector">
          <button class="month-nav" @click="cambiarMes(-1)">‹</button>
          <span class="month-label">{{ mesLabel }}</span>
          <button class="month-nav" @click="cambiarMes(1)" :disabled="mesActual >= mesHoy">›</button>
        </div>
      </div>

      <!-- Tarjetas de resumen -->
      <div v-if="loading" class="loading-state">Cargando...</div>
      <template v-else>
        <div class="cards-grid">
          <div class="stat-card stat-green">
            <div class="stat-top">
              <span class="stat-label">Ingresos</span>
              <span class="stat-badge badge-green">↑</span>
            </div>
            <div class="stat-amount">{{ formatCOP(datos.totales.ingresos) }}</div>
            <div class="stat-sub">{{ movimientosPorTipo('ingreso').length }} registro(s)</div>
          </div>
          <div class="stat-card stat-red">
            <div class="stat-top">
              <span class="stat-label">Gastos</span>
              <span class="stat-badge badge-red">↓</span>
            </div>
            <div class="stat-amount">{{ formatCOP(datos.totales.gastos) }}</div>
            <div class="stat-sub">{{ movimientosPorTipo('gasto').length }} registro(s)</div>
          </div>
          <div class="stat-card stat-blue">
            <div class="stat-top">
              <span class="stat-label">Deudas</span>
              <span class="stat-badge badge-blue">⊘</span>
            </div>
            <div class="stat-amount">{{ formatCOP(datos.totales.deudas) }}</div>
            <div class="stat-sub">{{ movimientosPorTipo('deuda').length }} obligación(es)</div>
          </div>
        </div>

        <!-- Balance neto -->
        <div class="balance-card">
          <div class="balance-left">
            <p class="balance-label">Balance neto del mes</p>
            <p :class="['balance-amount', datos.totales.balance >= 0 ? 'positive' : 'negative']">
              {{ formatCOP(datos.totales.balance) }}
            </p>
          </div>
          <div class="balance-bar-wrap">
            <div class="bar-track">
              <div class="bar-green" :style="{ flex: datos.totales.ingresos || 1 }"></div>
              <div class="bar-red" :style="{ flex: datos.totales.gastos || 0 }"></div>
              <div class="bar-blue" :style="{ flex: datos.totales.deudas || 0 }"></div>
            </div>
            <div class="bar-legend">
              <span class="leg-dot leg-green">● Ingresos</span>
              <span class="leg-dot leg-red">● Gastos</span>
              <span class="leg-dot leg-blue">● Deudas</span>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="actions-row">
          <button class="action-btn btn-green" @click="abrirModal('ingreso')">
            <span class="action-icon">↑</span>
            <span class="action-label">Registrar ingreso</span>
          </button>
          <button class="action-btn btn-red" @click="abrirModal('gasto')">
            <span class="action-icon">↓</span>
            <span class="action-label">Registrar gasto</span>
          </button>
          <button class="action-btn btn-blue" @click="abrirModal('deuda')">
            <span class="action-icon">⊘</span>
            <span class="action-label">Registrar deuda</span>
          </button>
        </div>

        <!-- Últimos movimientos -->
        <div class="movimientos-card">
          <div class="card-header">
            <h2>Últimos movimientos</h2>
            <RouterLink to="/historial" class="ver-mas">Ver historial →</RouterLink>
          </div>
          <div v-if="datos.movimientos.length === 0" class="empty-state">
            Sin movimientos este mes. ¡Registra tu primer ingreso!
          </div>
          <div v-else class="mov-list">
            <div
              v-for="mov in datos.movimientos"
              :key="`${mov.tipo}-${mov.id}`"
              class="mov-item"
            >
              <div class="mov-dot" :class="`dot-${mov.tipo}`"></div>
              <div class="mov-info">
                <span class="mov-titulo">{{ mov.titulo }}</span>
                <span class="mov-freq">{{ labelFrecuencia(mov.frecuencia) }}</span>
              </div>
              <div class="mov-right">
                <span :class="['mov-valor', `text-${mov.tipo === 'ingreso' ? 'green' : mov.tipo === 'gasto' ? 'red' : 'blue'}`]">
                  {{ mov.tipo === 'ingreso' ? '+' : '-' }}{{ formatCOP(mov.valor) }}
                </span>
                <span class="mov-fecha">{{ formatFecha(mov.fecha) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal -->
    <MovimientoModal
      :show="modalVisible"
      :tipo="modalTipo"
      :item="null"
      @close="modalVisible = false"
      @saved="cargarDashboard"
    />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import MovimientoModal from '../components/MovimientoModal.vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const auth = useAuthStore()
const loading = ref(true)
const modalVisible = ref(false)
const modalTipo = ref('ingreso')

const hoy = new Date()
const mesHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
const mesActual = ref(mesHoy)

const datos = ref({
  mes: mesHoy,
  totales: { ingresos: 0, gastos: 0, deudas: 0, balance: 0 },
  movimientos: []
})

const mesLabel = computed(() => {
  const [y, m] = mesActual.value.split('-')
  const fecha = new Date(parseInt(y), parseInt(m) - 1, 1)
  return fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    .replace(/^./, c => c.toUpperCase())
})

function cambiarMes(delta) {
  const [y, m] = mesActual.value.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  mesActual.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  cargarDashboard()
}

async function cargarDashboard() {
  loading.value = true
  try {
    const { data } = await api.get(`/dashboard?mes=${mesActual.value}`)
    datos.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function abrirModal(tipo) {
  modalTipo.value = tipo
  modalVisible.value = true
}

function movimientosPorTipo(tipo) {
  return datos.value.movimientos.filter(m => m.tipo === tipo)
}

function formatCOP(val) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)
}

function formatFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function labelFrecuencia(f) {
  const map = { unico: 'único', diario: 'diario', semanal: 'semanal', quincenal: 'quincenal', mensual: 'mensual', automatico: 'automático' }
  return map[f] || f
}

onMounted(cargarDashboard)
</script>

<style scoped>
.dashboard { max-width: 860px; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 28px;
}
.greeting { font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }
.page-title {
  font-family: var(--font-display);
  font-size: 28px; font-weight: 700; letter-spacing: -0.5px;
}
.month-selector {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: 8px 14px;
}
.month-nav {
  background: none; border: none;
  color: var(--text-secondary); font-size: 18px; line-height: 1;
  transition: color 0.15s; padding: 0 2px;
}
.month-nav:hover:not(:disabled) { color: var(--text-primary); }
.month-nav:disabled { opacity: 0.3; cursor: default; }
.month-label { font-size: 14px; font-weight: 500; min-width: 140px; text-align: center; }

.loading-state { color: var(--text-muted); padding: 40px 0; text-align: center; }

.cards-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 14px; margin-bottom: 14px;
}
.stat-card {
  border-radius: var(--radius-lg); padding: 20px;
  border: 1px solid;
}
.stat-green { background: rgba(99,153,34,0.08); border-color: rgba(99,153,34,0.25); }
.stat-red { background: rgba(192,57,43,0.08); border-color: rgba(192,57,43,0.25); }
.stat-blue { background: rgba(36,113,163,0.08); border-color: rgba(36,113,163,0.25); }
.stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
.stat-badge {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}
.badge-green { background: rgba(99,153,34,0.2); color: var(--green-mid); }
.badge-red { background: rgba(192,57,43,0.2); color: var(--red-mid); }
.badge-blue { background: rgba(36,113,163,0.2); color: var(--blue-mid); }
.stat-amount { font-family: var(--font-display); font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
.stat-green .stat-amount { color: var(--green-mid); }
.stat-red .stat-amount { color: var(--red-mid); }
.stat-blue .stat-amount { color: var(--blue-mid); }
.stat-sub { font-size: 12px; color: var(--text-muted); }

.balance-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 20px;
  display: flex; align-items: center; gap: 28px;
  margin-bottom: 24px;
}
.balance-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.balance-amount {
  font-family: var(--font-display);
  font-size: 26px; font-weight: 700; letter-spacing: -0.5px;
}
.positive { color: var(--green-mid); }
.negative { color: var(--red-mid); }
.balance-bar-wrap { flex: 1; }
.bar-track {
  display: flex; height: 6px; border-radius: 10px;
  overflow: hidden; gap: 2px; margin-bottom: 8px;
}
.bar-green { background: var(--green); border-radius: 10px 0 0 10px; min-width: 4px; }
.bar-red { background: var(--red-mid); min-width: 0; }
.bar-blue { background: var(--blue-mid); border-radius: 0 10px 10px 0; min-width: 0; }
.bar-legend { display: flex; gap: 14px; }
.leg-dot { font-size: 11px; }
.leg-green { color: var(--green-mid); }
.leg-red { color: var(--red-mid); }
.leg-blue { color: var(--blue-mid); }

.actions-row {
  display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 14px; margin-bottom: 24px;
}
.action-btn {
  border: none; border-radius: var(--radius-lg);
  padding: 18px 16px;
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; font-weight: 500;
  transition: opacity 0.15s, transform 0.1s;
}
.action-btn:hover { opacity: 0.9; }
.action-btn:active { transform: scale(0.98); }
.action-icon { font-size: 20px; }
.btn-green { background: var(--green); color: #fff; }
.btn-red { background: var(--red); color: #fff; }
.btn-blue { background: var(--blue); color: #fff; }

.movimientos-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
}
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.card-header h2 { font-size: 15px; font-weight: 600; }
.ver-mas { font-size: 13px; color: var(--text-secondary); transition: color 0.15s; }
.ver-mas:hover { color: var(--text-primary); }
.empty-state {
  padding: 40px 20px; text-align: center;
  font-size: 14px; color: var(--text-muted);
}
.mov-list {}
.mov-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 20px; border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.mov-item:last-child { border-bottom: none; }
.mov-item:hover { background: var(--bg-hover); }
.mov-dot {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
}
.dot-ingreso { background: var(--green-mid); }
.dot-gasto { background: var(--red-mid); }
.dot-deuda { background: var(--blue-mid); }
.mov-info { flex: 1; display: flex; align-items: center; gap: 8px; overflow: hidden; }
.mov-titulo { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mov-freq {
  font-size: 11px; color: var(--text-muted);
  background: var(--bg-secondary); padding: 2px 7px;
  border-radius: 20px; white-space: nowrap; flex-shrink: 0;
}
.mov-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.mov-valor { font-size: 14px; font-weight: 500; }
.mov-fecha { font-size: 11px; color: var(--text-muted); }
.text-green { color: var(--green-mid); }
.text-red { color: var(--red-mid); }
.text-blue { color: var(--blue-mid); }
</style>
