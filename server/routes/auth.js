const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const db = require('../db')

router.post('/register', async (req, res) => {
  const { nick, password } = req.body
  if (!nick || !password) {
    return res.status(400).json({ error: 'Nick y contraseña son requeridos.' })
  }
  if (nick.length < 3 || nick.length > 50) {
    return res.status(400).json({ error: 'El nick debe tener entre 3 y 50 caracteres.' })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' })
  }
  try {
    const [existing] = await db.query('SELECT id FROM usuarios WHERE nick = ?', [nick])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ese nick ya está en uso. Elige otro.' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const [result] = await db.query(
      'INSERT INTO usuarios (nick, password) VALUES (?, ?)',
      [nick, hashed]
    )
    req.session.userId = result.insertId
    req.session.nick = nick
    return res.status(201).json({ message: 'Cuenta creada.', nick })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

router.post('/login', async (req, res) => {
  const { nick, password } = req.body
  if (!nick || !password) {
    return res.status(400).json({ error: 'Nick y contraseña son requeridos.' })
  }
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE nick = ?', [nick])
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Nick o contraseña incorrectos.' })
    }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Nick o contraseña incorrectos.' })
    }
    req.session.userId = user.id
    req.session.nick = user.nick
    return res.json({ message: 'Login exitoso.', nick: user.nick })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Sesión cerrada.' })
  })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ loggedIn: true, nick: req.session.nick })
  }
  return res.json({ loggedIn: false })
})

module.exports = router
