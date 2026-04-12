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

              <!-- Día del mes: solo para gastos/deudas con frecuencia mensual -->
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

// Cargar datos si es edición
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
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
h3 { font-size: 17px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.title-icon { font-size: 20px; }
.title-ingreso { color: var(--green-mid); }
.title-gasto { color: var(--red-mid); }
.title-deuda { color: var(--blue-mid); }
.close-btn {
  background: none; border: none;
  color: var(--text-muted); font-size: 16px;
  padding: 4px 8px; border-radius: 4px;
  transition: color 0.15s;
}
.close-btn:hover { color: var(--text-primary); }
.field { margin-bottom: 16px; }
.field label {
  display: block; font-size: 12px;
  color: var(--text-secondary); margin-bottom: 6px;
}
.input-prefix-wrap { position: relative; }
.prefix {
  position: absolute; left: 10px; top: 50%;
  transform: translateY(-50%);
  font-size: 14px; color: var(--text-secondary);
  pointer-events: none;
}
.error-msg {
  font-size: 13px; color: var(--red-mid);
  background: rgba(224,71,70,0.08);
  border: 1px solid rgba(224,71,70,0.2);
  border-radius: var(--radius-sm);
  padding: 10px 12px; margin-bottom: 12px;
}
.modal-actions { display: flex; gap: 10px; margin-top: 8px; }
.btn-cancel {
  flex: 1; padding: 11px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-sm); font-size: 14px;
  transition: all 0.15s;
}
.btn-cancel:hover { color: var(--text-primary); border-color: var(--border-light); }
.btn-save {
  flex: 2; padding: 11px;
  border: none; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 500; color: #fff;
  transition: opacity 0.15s;
}
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save-ingreso { background: var(--green); }
.btn-save-gasto { background: var(--red); }
.btn-save-deuda { background: var(--blue); }
.btn-save:hover:not(:disabled) { opacity: 0.88; }
</style>
