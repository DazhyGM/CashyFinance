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
@import '../styles/login.css';
</style>
