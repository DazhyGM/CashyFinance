import { defineStore } from 'pinia'
import api from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    nick: null,
    isLoggedIn: false,
    checked: false
  }),
  actions: {
    async checkSession() {
      try {
        const { data } = await api.get('/auth/me')
        this.isLoggedIn = data.loggedIn
        this.nick = data.nick || null
      } catch {
        this.isLoggedIn = false
      } finally {
        this.checked = true
      }
    },
    async login(nick, password) {
      const { data } = await api.post('/auth/login', { nick, password })
      this.isLoggedIn = true
      this.nick = data.nick
    },
    async register(nick, password) {
      const { data } = await api.post('/auth/register', { nick, password })
      this.isLoggedIn = true
      this.nick = data.nick
    },
    async logout() {
      await api.post('/auth/logout')
      this.isLoggedIn = false
      this.nick = null
      this.checked = false
    }
  }
})

//commit de prueba