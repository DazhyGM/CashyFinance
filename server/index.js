require('dotenv').config()
const express = require('express')
const cors = require('cors')
const session = require('express-session')

const authRoutes = require('./routes/auth')
const ingresosRoutes = require('./routes/ingresos')
const gastosRoutes = require('./routes/gastos')
const deudasRoutes = require('./routes/deudas')
const dashboardRoutes = require('./routes/dashboard')

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || 'finanzas_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,     
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}))

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/ingresos', ingresosRoutes)
app.use('/api/gastos', gastosRoutes)
app.use('/api/deudas', deudasRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`\n🟢 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})
