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
                <div class="tabla-card">
                    <div class="tabla-header">
                        <span>Mes</span>
                        <span class="col-green">Ingresos</span>
                        <span class="col-red">Gastos</span>
                        <span class="col-blue">Deudas</span>
                        <span>Balance</span>
                    </div>
                    <div v-for="fila in historial" :key="fila.mes"
                        :class="['tabla-row', { 'row-active': fila.mes === mesSeleccionado }]"
                        @click="seleccionarMes(fila.mes)">
                        <span class="mes-label">{{ formatMes(fila.mes) }}</span>
                        <span class="col-green val-green">{{ formatCOP(fila.ingresos) }}</span>
                        <span class="col-red val-red">{{ formatCOP(fila.gastos) }}</span>
                        <span class="col-blue val-blue">{{ formatCOP(fila.deudas) }}</span>
                        <span :class="['val-balance', fila.balance >= 0 ? 'pos' : 'neg']">
                            {{ formatCOP(fila.balance) }}
                        </span>
                    </div>
                </div>

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
                            <div v-if="detallesMes.movimientos.length === 0" class="empty-state">Sin movimientos
                                registrados.</div>
                            <div v-else class="mov-list-hist">
                                <div v-for="mov in detallesMes.movimientos" :key="`${mov.tipo}-${mov.id}`"
                                    class="mov-row">
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
@import '../styles/historial.css';
</style>