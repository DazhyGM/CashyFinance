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
                <button :class="['filter-tab', { active: filtro === 'activos' }]"
                    @click="filtro = 'activos'">Activos</button>
                <button :class="['filter-tab', { active: filtro === 'todos' }]" @click="filtro = 'todos'">Todos</button>
                <button :class="['filter-tab', { active: filtro === 'finalizados' }]"
                    @click="filtro = 'finalizados'">Finalizados</button>
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
                        <button v-if="item.activo && item.frecuencia !== 'unico'" class="ia-btn ia-end"
                            @click="finalizar(item)" title="Finalizar">◼</button>
                        <button class="ia-btn ia-del" @click="eliminar(item)" title="Eliminar">✕</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal nuevo/editar -->
        <MovimientoModal :show="modalVisible" :tipo="tipo" :item="itemEditando" @close="cerrarModal"
            @saved="cargarItems" />

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
                            <div class="detalle-row"><span class="dr-label">Título</span><span class="dr-val">{{
                                    itemDetalle.titulo }}</span></div>
                            <div class="detalle-row"><span class="dr-label">Frecuencia</span><span class="dr-val">{{
                                    labelFrecuencia(itemDetalle.frecuencia) }}</span></div>
                            <div v-if="itemDetalle.dia_del_mes" class="detalle-row"><span class="dr-label">Día del
                                    mes</span><span class="dr-val">{{ itemDetalle.dia_del_mes }}</span></div>
                            <div class="detalle-row"><span class="dr-label">Valor</span><span
                                    :class="`dr-val valor-${tipo}`">{{ formatCOP(itemDetalle.valor) }}</span></div>
                            <div class="detalle-row"><span class="dr-label">Fecha inicio</span><span class="dr-val">{{
                                formatFecha(itemDetalle.fecha || itemDetalle.fecha_inicio) }}</span></div>
                            <div class="detalle-row"><span class="dr-label">Estado</span>
                                <span :class="['status-badge', itemDetalle.activo ? 'status-active' : 'status-done']">
                                    {{ itemDetalle.activo ? 'Activo' : 'Finalizado' }}
                                </span>
                            </div>
                            <div class="detalle-row"><span class="dr-label">Creado</span><span class="dr-val">{{
                                    formatFechaLarga(itemDetalle.created_at) }}</span></div>
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
@import '../styles/movimientos.css';
</style>
