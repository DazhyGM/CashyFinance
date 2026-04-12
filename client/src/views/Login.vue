<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <span class="brand-icon">◈</span>
        <span class="brand-name">Finanzas</span>
      </div>

      <div class="tabs">
        <button :class="['tab', { active: mode === 'login' }]" @click="mode = 'login'">
          Ingresar
        </button>
        <button :class="['tab', { active: mode === 'register' }]" @click="mode = 'register'">
          Crear cuenta
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>Nick / Apodo</label>
          <input v-model="nick" type="text" placeholder="ej: juancho" autocomplete="username" />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input v-model="password" type="password" placeholder="••••••" autocomplete="current-password" />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading">Cargando...</span>
          <span v-else>{{ mode === 'login' ? 'Entrar' : 'Crear cuenta' }}</span>
        </button>
      </form>

      <p class="hint">Tu dinero, tu control.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const mode = ref('login')
const nick = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  if (!nick.value.trim() || !password.value.trim()) {
    error.value = 'Completa todos los campos.'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(nick.value.trim(), password.value)
    } else {
      await auth.register(nick.value.trim(), password.value)
    }
    router.push('/dashboard')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 24px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}
.brand-icon {
  font-size: 28px;
  color: var(--green-mid);
}
.brand-name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}
.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 28px;
}
.tab {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s;
}
.tab.active {
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: 500;
}
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}
.error-msg {
  font-size: 13px;
  color: var(--red-mid);
  margin-bottom: 14px;
  padding: 10px 12px;
  background: rgba(224,71,70,0.08);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(224,71,70,0.2);
}
.btn-submit {
  width: 100%;
  padding: 12px;
  background: var(--green);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  margin-top: 4px;
  transition: opacity 0.2s;
}
.btn-submit:hover { opacity: 0.88; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 24px;
}
</style>
