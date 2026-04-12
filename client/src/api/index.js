import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor global de errores
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || 'Error de conexión.'
    return Promise.reject(new Error(msg))
  }
)

export default api
