<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="overlay" @click.self="$emit('close')">
        <Transition name="slide-up">
          <div v-if="show" class="modal">
            <div class="modal-header">
              <h3 :class="`title-${tipo}`">
                <span class="title-icon">{{ iconos[tipo] }}</span>
                {{ titulos[tipo] }}
              </h3>
              <button class="close-btn" @click="$emit('close')">✕</button>
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="field">
                <label>{{ tipo === 'ingreso' ? 'Título del ingreso' : tipo === 'gasto' ? 'Descripción del gasto' : 'Nombre de la obligación' }}</label>
                <input v-model="form.titulo" type="text" :placeholder="placeholders[tipo]" />
              </div>

              <div class="field">
                <label>Frecuencia</label>
                <select v-model="form.frecuencia">
                  <option v-for="opt in frecuencias[tipo]" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <Transition name="fade">
                <div v-if="tipo !== 'ingreso' && form.frecuencia === 'mensual'" class="field">
                  <label>Día del mes para el cobro (1 – 31)</label>
                  <input v-model="form.dia_del_mes" type="number" min="1" max="31" placeholder="ej: 20" />
                </div>
              </Transition>

              <div class="field">
                <label>Valor en pesos colombianos (COP)</label>
                <div class="input-prefix-wrap">
                  <span class="prefix">$</span>
                  <input
                    v-model="form.valorDisplay"
                    type="text"
                    placeholder="0"
                    @input="formatValor"
                    style="padding-left: 28px;"
                  />
                </div>
              </div>

              <div class="field">
                <label>{{ tipo === 'ingreso' ? 'Fecha del ingreso' : 'Fecha de inicio' }}</label>
                <input v-model="form.fecha" type="date" />
              </div>

              <p v-if="error" class="error-msg">{{ error }}</p>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" @click="$emit('close')">Cancelar</button>
                <button type="submit" :class="`btn-save btn-save-${tipo}`" :disabled="loading">
                  {{ loading ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../api'

const props = defineProps({
  show: Boolean,
  tipo: { type: String, default: 'ingreso' }, // ingreso | gasto | deuda
  item: { type: Object, default: null } // si viene, es edición
})
const emit = defineEmits(['close', 'saved'])

const editando = ref(false)
const loading = ref(false)
const error = ref('')

const form = ref({
  titulo: '',
  frecuencia: 'unico',
  valorDisplay: '',
  valor: 0,
  fecha: new Date().toISOString().split('T')[0],
  dia_del_mes: null
})

const iconos = { ingreso: '↑', gasto: '↓', deuda: '⊘' }
const titulos = { ingreso: 'Nuevo ingreso', gasto: 'Nuevo gasto', deuda: 'Nueva deuda / obligación' }
const placeholders = { ingreso: 'Ej: Salario, Freelance...', gasto: 'Ej: Parqueadero, Mercado...', deuda: 'Ej: Plan de datos, Recibo de luz...' }

const frecuencias = {
  ingreso: [
    { value: 'unico', label: 'Único (una sola vez)' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' }
  ],
  gasto: [
    { value: 'unico', label: 'Único en el mes' },
    { value: 'diario', label: 'Diario' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensual', label: 'Mensual' }
  ],
  deuda: [
    { value: 'unico', label: 'Único' },
    { value: 'diario', label: 'Diario' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensual', label: 'Mensual' }
  ]
}

function formatValor(e) {
  const raw = e.target.value.replace(/\D/g, '')
  form.value.valor = parseFloat(raw) || 0
  form.value.valorDisplay = raw ? parseInt(raw).toLocaleString('es-CO') : ''
}

watch(() => props.item, (item) => {
  if (item) {
    editando.value = true
    form.value = {
      titulo: item.titulo,
      frecuencia: item.frecuencia,
      valor: item.valor,
      valorDisplay: parseFloat(item.valor).toLocaleString('es-CO'),
      fecha: item.fecha || item.fecha_inicio,
      dia_del_mes: item.dia_del_mes || null
    }
  } else {
    editando.value = false
    resetForm()
  }
}, { immediate: true })

watch(() => props.show, (val) => {
  if (val && !props.item) resetForm()
})

function resetForm() {
  form.value = {
    titulo: '',
    frecuencia: props.tipo === 'deuda' ? 'mensual' : 'unico',
    valorDisplay: '',
    valor: 0,
    fecha: new Date().toISOString().split('T')[0],
    dia_del_mes: null
  }
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  if (!form.value.titulo.trim()) { error.value = 'El título es requerido.'; return }
  if (!form.value.valor || form.value.valor <= 0) { error.value = 'Ingresa un valor válido.'; return }
  if (!form.value.fecha) { error.value = 'La fecha es requerida.'; return }

  const endpoint = props.tipo === 'ingreso' ? '/ingresos' : props.tipo === 'gasto' ? '/gastos' : '/deudas'
  const payload = {
    titulo: form.value.titulo.trim(),
    frecuencia: form.value.frecuencia,
    valor: form.value.valor,
    dia_del_mes: form.value.dia_del_mes || null
  }
  if (props.tipo === 'ingreso') {
    payload.fecha = form.value.fecha
  } else {
    payload.fecha_inicio = form.value.fecha
  }

  loading.value = true
  try {
    if (editando.value && props.item) {
      await api.put(`${endpoint}/${props.item.id}`, payload)
    } else {
      await api.post(endpoint, payload)
    }
    emit('saved')
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import '../styles/movimientoModal.css';
</style>
