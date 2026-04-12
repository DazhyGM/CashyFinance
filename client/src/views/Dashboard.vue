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
                        <div v-for="mov in datos.movimientos" :key="`${mov.tipo}-${mov.id}`" class="mov-item">
                            <div class="mov-dot" :class="`dot-${mov.tipo}`"></div>
                            <div class="mov-info">
                                <span class="mov-titulo">{{ mov.titulo }}</span>
                                <span class="mov-freq">{{ labelFrecuencia(mov.frecuencia) }}</span>
                            </div>
                            <div class="mov-right">
                                <span
                                    :class="['mov-valor', `text-${mov.tipo === 'ingreso' ? 'green' : mov.tipo === 'gasto' ? 'red' : 'blue'}`]">
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
        <MovimientoModal :show="modalVisible" :tipo="modalTipo" :item="null" @close="modalVisible = false"
            @saved="cargarDashboard" />
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
@import '../styles/dashboard.css';
</style>
