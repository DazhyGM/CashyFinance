<template>
  <AppLayout>
    <div class="historial-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">◷ Historial</h1>
          <p class="page-sub">Resumen mes a mes de tus finanzas</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">Cargando historial...</div>

      <div v-else-if="historial.length === 0" class="empty-state">
        Aún no hay suficientes datos para mostrar el historial.
      </div>

      <template v-else>
        <!-- Tabla resumen -->
        <div class="tabla-card">
          <div class="tabla-header">
            <span>Mes</span>
            <span class="col-green">Ingresos</span>
            <span class="col-red">Gastos</span>
            <span class="col-blue">Deudas</span>
            <span>Balance</span>
          </div>
          <div
            v-for="fila in historial"
            :key="fila.mes"
            :class="['tabla-row', { 'row-active': fila.mes === mesSeleccionado }]"
            @click="seleccionarMes(fila.mes)"
          >
            <span class="mes-label">{{ formatMes(fila.mes) }}</span>
            <span class="col-green val-green">{{ formatCOP(fila.ingresos) }}</span>
            <span class="col-red val-red">{{ formatCOP(fila.gastos) }}</span>
            <span class="col-blue val-blue">{{ formatCOP(fila.deudas) }}</span>
            <span :class="['val-balance', fila.balance >= 0 ? 'pos' : 'neg']">
              {{ formatCOP(fila.balance) }}
            </span>
          </div>
        </div>

        <!-- Detalle del mes seleccionado -->
        <Transition name="slide-up">
          <div v-if="mesSeleccionado && detallesMes" class="detalle-mes">
            <h2 class="detalle-titulo">{{ formatMes(mesSeleccionado) }}</h2>

            <div class="detalle-cards">
              <div class="dc dc-green">
                <span class="dc-label">Ingresos</span>
                <span class="dc-val">{{ formatCOP(detallesMes.totales.ingresos) }}</span>
              </div>
              <div class="dc dc-red">
                <span class="dc-label">Gastos</span>
                <span class="dc-val">{{ formatCOP(detallesMes.totales.gastos) }}</span>
              </div>
              <div class="dc dc-blue">
                <span class="dc-label">Deudas</span>
                <span class="dc-val">{{ formatCOP(detallesMes.totales.deudas) }}</span>
              </div>
              <div class="dc" :class="detallesMes.totales.balance >= 0 ? 'dc-green' : 'dc-red'">
                <span class="dc-label">Balance</span>
                <span class="dc-val">{{ formatCOP(detallesMes.totales.balance) }}</span>
              </div>
            </div>

            <div class="mov-section">
              <h3>Movimientos del mes</h3>
              <div v-if="detallesMes.movimientos.length === 0" class="empty-state">Sin movimientos registrados.</div>
              <div v-else class="mov-list-hist">
                <div v-for="mov in detallesMes.movimientos" :key="`${mov.tipo}-${mov.id}`" class="mov-row">
                  <span :class="`mdot mdot-${mov.tipo}`"></span>
                  <span class="mov-titulo">{{ mov.titulo }}</span>
                  <span class="mov-freq-badge">{{ labelFrecuencia(mov.frecuencia) }}</span>
                  <span :class="['mov-val', `val-${mov.tipo}`]">
                    {{ mov.tipo === 'ingreso' ? '+' : '-' }}{{ formatCOP(mov.valor) }}
                  </span>
                  <span class="mov-fecha">{{ formatFecha(mov.fecha) }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../api'

const historial = ref([])
const loading = ref(true)
const mesSeleccionado = ref(null)
const detallesMes = ref(null)

async function cargarHistorial() {
  loading.value = true
  try {
    const { data } = await api.get('/dashboard/historial')
    historial.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function seleccionarMes(mes) {
  if (mesSeleccionado.value === mes) {
    mesSeleccionado.value = null
    detallesMes.value = null
    return
  }
  mesSeleccionado.value = mes
  try {
    const { data } = await api.get(`/dashboard?mes=${mes}`)
    detallesMes.value = data
  } catch (e) {
    console.error(e)
  }
}

function formatMes(mes) {
  const [y, m] = mes.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 1, 1)
  return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    .replace(/^./, c => c.toUpperCase())
}
function formatCOP(val) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)
}
function formatFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}
function labelFrecuencia(f) {
  const map = { unico: 'único', diario: 'diario', semanal: 'semanal', quincenal: 'quincenal', mensual: 'mensual', automatico: 'auto' }
  return map[f] || f
}

onMounted(cargarHistorial)
</script>

<style scoped>
.historial-page { max-width: 860px; }
.page-header { margin-bottom: 28px; }
.page-title {
  font-family: var(--font-display);
  font-size: 26px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 4px;
}
.page-sub { font-size: 13px; color: var(--text-muted); }
.loading-state, .empty-state {
  padding: 48px 0; text-align: center; font-size: 14px; color: var(--text-muted);
}

.tabla-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px;
}
.tabla-header, .tabla-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr;
  padding: 12px 20px; gap: 8px;
}
.tabla-header {
  background: var(--bg-secondary); border-bottom: 1px solid var(--border);
  font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;
}
.tabla-row {
  border-bottom: 1px solid var(--border); cursor: pointer;
  font-size: 13px; transition: background 0.12s; align-items: center;
}
.tabla-row:last-child { border-bottom: none; }
.tabla-row:hover { background: var(--bg-hover); }
.tabla-row.row-active { background: var(--bg-hover); border-left: 3px solid var(--text-secondary); }
.mes-label { font-weight: 500; }
.col-green, .val-green { color: var(--green-mid); }
.col-red, .val-red { color: var(--red-mid); }
.col-blue, .val-blue { color: var(--blue-mid); }
.val-balance { font-weight: 600; }
.pos { color: var(--green-mid); }
.neg { color: var(--red-mid); }

.detalle-mes {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 24px;
}
.detalle-titulo {
  font-family: var(--font-display); font-size: 18px; font-weight: 700;
  margin-bottom: 20px;
}
.detalle-cards {
  display: grid; grid-template-columns: repeat(4, minmax(0,1fr));
  gap: 10px; margin-bottom: 24px;
}
.dc { border-radius: var(--radius-md); padding: 14px 16px; border: 1px solid; }
.dc-green { background: rgba(99,153,34,0.08); border-color: rgba(99,153,34,0.2); }
.dc-red { background: rgba(192,57,43,0.08); border-color: rgba(192,57,43,0.2); }
.dc-blue { background: rgba(36,113,163,0.08); border-color: rgba(36,113,163,0.2); }
.dc-label { font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
.dc-val { font-family: var(--font-display); font-size: 16px; font-weight: 700; }
.dc-green .dc-val { color: var(--green-mid); }
.dc-red .dc-val { color: var(--red-mid); }
.dc-blue .dc-val { color: var(--blue-mid); }

.mov-section h3 {
  font-size: 14px; font-weight: 600; color: var(--text-secondary);
  margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;
}
.mov-list-hist { display: flex; flex-direction: column; gap: 0; }
.mov-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px;
}
.mov-row:last-child { border-bottom: none; }
.mdot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.mdot-ingreso { background: var(--green-mid); }
.mdot-gasto { background: var(--red-mid); }
.mdot-deuda { background: var(--blue-mid); }
.mov-titulo { flex: 1; }
.mov-freq-badge {
  font-size: 11px; background: var(--bg-secondary);
  color: var(--text-muted); padding: 2px 7px; border-radius: 20px;
}
.mov-val { font-weight: 600; }
.val-ingreso { color: var(--green-mid); }
.val-gasto { color: var(--red-mid); }
.val-deuda { color: var(--blue-mid); }
.mov-fecha { font-size: 11px; color: var(--text-muted); min-width: 50px; text-align: right; }
</style>
