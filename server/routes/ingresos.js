const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

// GET /api/ingresos?mes=2026-00
router.get('/', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { mes } = req.query // formato: YYYY-MM
  try {
    let query = 'SELECT * FROM ingresos WHERE usuario_id = ?'
    const params = [userId]
    if (mes) {
      query += ' AND DATE_FORMAT(fecha, "%Y-%m") = ?'
      params.push(mes)
    }
    query += ' ORDER BY fecha DESC, created_at DESC'
    const [rows] = await db.query(query, params)
    return res.json(rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al obtener ingresos.' })
  }
})

// POST /api/ingresos
router.post('/', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { titulo, frecuencia, valor, fecha } = req.body
  if (!titulo || !frecuencia || !valor || !fecha) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' })
  }
  try {
    const [result] = await db.query(
      'INSERT INTO ingresos (usuario_id, titulo, frecuencia, valor, fecha) VALUES (?, ?, ?, ?, ?)',
      [userId, titulo.trim(), frecuencia, parseFloat(valor), fecha]
    )
    const [rows] = await db.query('SELECT * FROM ingresos WHERE id = ?', [result.insertId])
    return res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al crear ingreso.' })
  }
})

// PUT /api/ingresos/:id
router.put('/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  const { titulo, frecuencia, valor, fecha, activo } = req.body
  try {
    const [existing] = await db.query(
      'SELECT id FROM ingresos WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado.' })
    }
    await db.query(
      `UPDATE ingresos
       SET titulo = COALESCE(?, titulo),
           frecuencia = COALESCE(?, frecuencia),
           valor = COALESCE(?, valor),
           fecha = COALESCE(?, fecha),
           activo = COALESCE(?, activo)
       WHERE id = ? AND usuario_id = ?`,
      [titulo, frecuencia, valor ? parseFloat(valor) : null, fecha, activo !== undefined ? activo : null, id, userId]
    )
    const [rows] = await db.query('SELECT * FROM ingresos WHERE id = ?', [id])
    return res.json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al actualizar ingreso.' })
  }
})

// DELETE /api/ingresos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  try {
    const [existing] = await db.query(
      'SELECT id FROM ingresos WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado.' })
    }
    await db.query('DELETE FROM ingresos WHERE id = ? AND usuario_id = ?', [id, userId])
    return res.json({ message: 'Ingreso eliminado.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al eliminar ingreso.' })
  }
})

// PATCH /api/ingresos/:id/finalizar
router.patch('/:id/finalizar', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  try {
    await db.query(
      'UPDATE ingresos SET activo = 0 WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    return res.json({ message: 'Ingreso finalizado.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al finalizar ingreso.' })
  }
})

module.exports = router
