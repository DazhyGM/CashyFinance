<template>
  <AppLayout>
    <div class="movimientos-page">
      <div class="page-header">
        <div>
          <h1 :class="`page-title title-${tipo}`">
            {{ iconos[tipo] }} {{ titulos[tipo] }}
          </h1>
          <p class="page-sub">Gestiona todos tus {{ titulos[tipo].toLowerCase() }}</p>
        </div>
        <button :class="`btn-new btn-${tipo}`" @click="abrirModalNuevo">
          + Nuevo
        </button>
      </div>

      <!-- Filtro activos/todos -->
      <div class="filter-bar">
        <button :class="['filter-tab', { active: filtro === 'activos' }]" @click="filtro = 'activos'">Activos</button>
        <button :class="['filter-tab', { active: filtro === 'todos' }]" @click="filtro = 'todos'">Todos</button>
        <button :class="['filter-tab', { active: filtro === 'finalizados' }]" @click="filtro = 'finalizados'">Finalizados</button>
      </div>

      <div v-if="loading" class="loading-state">Cargando...</div>

      <div v-else-if="itemsFiltrados.length === 0" class="empty-state">
        No hay {{ titulos[tipo].toLowerCase() }} en esta categoría.
      </div>

      <div v-else class="items-list">
        <div v-for="item in itemsFiltrados" :key="item.id" class="item-card">
          <div class="item-left">
            <div :class="`item-dot dot-${tipo}`"></div>
            <div class="item-info">
              <span class="item-titulo">{{ item.titulo }}</span>
              <div class="item-meta">
                <span class="item-freq">{{ labelFrecuencia(item.frecuencia) }}</span>
                <span v-if="item.dia_del_mes" class="item-dia">día {{ item.dia_del_mes }}</span>
                <span v-if="!item.activo" class="item-fin">Finalizado</span>
              </div>
            </div>
          </div>
          <div class="item-right">
            <span :class="`item-valor valor-${tipo}`">{{ formatCOP(item.valor) }}</span>
            <span class="item-fecha">{{ formatFecha(item.fecha || item.fecha_inicio) }}</span>
          </div>
          <div class="item-actions">
            <button class="ia-btn" @click="verDetalle(item)" title="Ver detalle">👁</button>
            <button class="ia-btn" @click="editar(item)" title="Editar">✎</button>
            <button v-if="item.activo && item.frecuencia !== 'unico'" class="ia-btn ia-end" @click="finalizar(item)" title="Finalizar">◼</button>
            <button class="ia-btn ia-del" @click="eliminar(item)" title="Eliminar">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nuevo/editar -->
    <MovimientoModal
      :show="modalVisible"
      :tipo="tipo"
      :item="itemEditando"
      @close="cerrarModal"
      @saved="cargarItems"
    />

    <!-- Modal detalle -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detalleVisible" class="overlay" @click.self="detalleVisible = false">
          <div class="detalle-modal">
            <div class="detalle-header">
              <h3 :class="`title-${tipo}`">{{ iconos[tipo] }} Detalle</h3>
              <button class="close-btn" @click="detalleVisible = false">✕</button>
            </div>
            <div v-if="itemDetalle" class="detalle-body">
              <div class="detalle-row"><span class="dr-label">Título</span><span class="dr-val">{{ itemDetalle.titulo }}</span></div>
              <div class="detalle-row"><span class="dr-label">Frecuencia</span><span class="dr-val">{{ labelFrecuencia(itemDetalle.frecuencia) }}</span></div>
              <div v-if="itemDetalle.dia_del_mes" class="detalle-row"><span class="dr-label">Día del mes</span><span class="dr-val">{{ itemDetalle.dia_del_mes }}</span></div>
              <div class="detalle-row"><span class="dr-label">Valor</span><span :class="`dr-val valor-${tipo}`">{{ formatCOP(itemDetalle.valor) }}</span></div>
              <div class="detalle-row"><span class="dr-label">Fecha inicio</span><span class="dr-val">{{ formatFecha(itemDetalle.fecha || itemDetalle.fecha_inicio) }}</span></div>
              <div class="detalle-row"><span class="dr-label">Estado</span>
                <span :class="['status-badge', itemDetalle.activo ? 'status-active' : 'status-done']">
                  {{ itemDetalle.activo ? 'Activo' : 'Finalizado' }}
                </span>
              </div>
              <div class="detalle-row"><span class="dr-label">Creado</span><span class="dr-val">{{ formatFechaLarga(itemDetalle.created_at) }}</span></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import MovimientoModal from '../components/MovimientoModal.vue'
import api from '../api'

const route = useRoute()
const tipo = computed(() => route.params.tipo?.replace(/s$/, '') || 'ingreso')

const items = ref([])
const loading = ref(true)
const filtro = ref('activos')
const modalVisible = ref(false)
const itemEditando = ref(null)
const detalleVisible = ref(false)
const itemDetalle = ref(null)

const iconos = { ingreso: '↑', gasto: '↓', deuda: '⊘' }
const titulos = { ingreso: 'Ingresos', gasto: 'Gastos', deuda: 'Deudas' }
const endpoints = { ingreso: '/ingresos', gasto: '/gastos', deuda: '/deudas' }

const itemsFiltrados = computed(() => {
  if (filtro.value === 'activos') return items.value.filter(i => i.activo)
  if (filtro.value === 'finalizados') return items.value.filter(i => !i.activo)
  return items.value
})

async function cargarItems() {
  loading.value = true
  try {
    const endpoint = endpoints[tipo.value]
    const { data } = await api.get(endpoint)
    // Para gastos y deudas la respuesta tiene { gastos/deudas, registros }
    if (Array.isArray(data)) {
      items.value = data
    } else {
      items.value = data[tipo.value + 's'] || data.deudas || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function abrirModalNuevo() {
  itemEditando.value = null
  modalVisible.value = true
}

function editar(item) {
  itemEditando.value = item
  modalVisible.value = true
}

function cerrarModal() {
  modalVisible.value = false
  itemEditando.value = null
}

function verDetalle(item) {
  itemDetalle.value = item
  detalleVisible.value = true
}

async function finalizar(item) {
  if (!confirm(`¿Finalizar "${item.titulo}"? Ya no se generarán cobros automáticos.`)) return
  try {
    await api.patch(`${endpoints[tipo.value]}/${item.id}/finalizar`)
    await cargarItems()
  } catch (e) { alert(e.message) }
}

async function eliminar(item) {
  if (!confirm(`¿Eliminar "${item.titulo}" permanentemente?`)) return
  try {
    await api.delete(`${endpoints[tipo.value]}/${item.id}`)
    await cargarItems()
  } catch (e) { alert(e.message) }
}

function formatCOP(val) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)
}
function formatFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatFechaLarga(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function labelFrecuencia(f) {
  const map = { unico: 'Único', diario: 'Diario', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' }
  return map[f] || f
}

watch(() => route.params.tipo, cargarItems)
onMounted(cargarItems)
</script>

<style scoped>
.movimientos-page { max-width: 860px; }
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px;
}
.page-title {
  font-family: var(--font-display);
  font-size: 26px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 4px;
}
.title-ingreso { color: var(--green-mid); }
.title-gasto { color: var(--red-mid); }
.title-deuda { color: var(--blue-mid); }
.page-sub { font-size: 13px; color: var(--text-muted); }
.btn-new {
  padding: 10px 20px; border: none; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 500; color: #fff; transition: opacity 0.15s;
}
.btn-new:hover { opacity: 0.88; }
.btn-ingreso { background: var(--green); }
.btn-gasto { background: var(--red); }
.btn-deuda { background: var(--blue); }

.filter-bar {
  display: flex; gap: 4px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 4px;
  margin-bottom: 20px; width: fit-content;
}
.filter-tab {
  padding: 7px 16px; border: none; background: transparent;
  color: var(--text-secondary); font-size: 13px; border-radius: 6px;
  transition: all 0.15s;
}
.filter-tab.active { background: var(--bg-hover); color: var(--text-primary); font-weight: 500; }

.loading-state, .empty-state {
  padding: 48px 0; text-align: center;
  font-size: 14px; color: var(--text-muted);
}

.items-list { display: flex; flex-direction: column; gap: 8px; }
.item-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  transition: border-color 0.15s;
}
.item-card:hover { border-color: var(--border-light); }
.item-left { display: flex; align-items: center; gap: 12px; flex: 1; overflow: hidden; }
.item-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dot-ingreso { background: var(--green-mid); }
.dot-gasto { background: var(--red-mid); }
.dot-deuda { background: var(--blue-mid); }
.item-info { overflow: hidden; }
.item-titulo { font-size: 14px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
.item-freq, .item-dia, .item-fin {
  font-size: 11px; padding: 2px 7px; border-radius: 20px;
  background: var(--bg-secondary); color: var(--text-muted);
}
.item-fin { background: rgba(192,57,43,0.1); color: var(--red-mid); }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; margin-right: 12px; }
.item-valor { font-size: 15px; font-weight: 600; font-family: var(--font-display); }
.valor-ingreso { color: var(--green-mid); }
.valor-gasto { color: var(--red-mid); }
.valor-deuda { color: var(--blue-mid); }
.item-fecha { font-size: 11px; color: var(--text-muted); }
.item-actions { display: flex; gap: 4px; }
.ia-btn {
  width: 30px; height: 30px; border-radius: var(--radius-sm);
  background: var(--bg-secondary); border: 1px solid var(--border);
  color: var(--text-secondary); font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.ia-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.ia-end:hover { color: var(--green-mid); }
.ia-del:hover { color: var(--red-mid); border-color: rgba(192,57,43,0.3); }

/* Detalle modal */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.detalle-modal {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-xl); padding: 28px;
  width: 100%; max-width: 380px;
}
.detalle-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.detalle-header h3 { font-size: 16px; font-weight: 600; }
.close-btn {
  background: none; border: none; color: var(--text-muted);
  font-size: 15px; padding: 4px 8px; border-radius: 4px;
}
.close-btn:hover { color: var(--text-primary); }
.detalle-body { display: flex; flex-direction: column; gap: 0; }
.detalle-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 0; border-bottom: 1px solid var(--border);
}
.detalle-row:last-child { border-bottom: none; }
.dr-label { font-size: 13px; color: var(--text-secondary); }
.dr-val { font-size: 13px; font-weight: 500; }
.status-badge {
  font-size: 12px; padding: 3px 10px; border-radius: 20px;
}
.status-active { background: rgba(99,153,34,0.15); color: var(--green-mid); }
.status-done { background: rgba(192,57,43,0.1); color: var(--red-mid); }
</style>
