const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

// GET /api/deudas?mes=2026-00
router.get('/', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { mes } = req.query
  try {
    const [deudas] = await db.query(
      'SELECT * FROM deudas WHERE usuario_id = ? ORDER BY created_at DESC',
      [userId]
    )
    let registros = []
    if (mes) {
      const [rows] = await db.query(
        `SELECT * FROM registros_automaticos
         WHERE usuario_id = ? AND tipo = 'deuda'
         AND DATE_FORMAT(fecha_aplicada, '%Y-%m') = ?
         ORDER BY fecha_aplicada DESC`,
        [userId, mes]
      )
      registros = rows
    }
    return res.json({ deudas, registros })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al obtener deudas.' })
  }
})
//prueba de ruta
router.get('/prueba', requireAuth, (req, res) => {
  res.json({ message: 'Ruta de prueba de deudas funciona!' })
})
// POST /api/deudas
router.post('/', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { titulo, frecuencia, valor, fecha_inicio, dia_del_mes } = req.body
  if (!titulo || !frecuencia || !valor || !fecha_inicio) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' })
  }
  try {
    const diaMes = frecuencia === 'mensual' && dia_del_mes ? parseInt(dia_del_mes) : null
    const [result] = await db.query(
      `INSERT INTO deudas (usuario_id, titulo, frecuencia, valor, fecha_inicio, dia_del_mes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, titulo.trim(), frecuencia, parseFloat(valor), fecha_inicio, diaMes]
    )
    const [rows] = await db.query('SELECT * FROM deudas WHERE id = ?', [result.insertId])
    return res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al crear deuda.' })
  }
})

// PUT /api/deudas/:id
router.put('/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  const { titulo, frecuencia, valor, fecha_inicio, dia_del_mes, activo } = req.body
  try {
    const [existing] = await db.query(
      'SELECT id FROM deudas WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Deuda no encontrada.' })
    }
    const diaMes = frecuencia === 'mensual' && dia_del_mes ? parseInt(dia_del_mes) : null
    await db.query(
      `UPDATE deudas
       SET titulo = COALESCE(?, titulo),
           frecuencia = COALESCE(?, frecuencia),
           valor = COALESCE(?, valor),
           fecha_inicio = COALESCE(?, fecha_inicio),
           dia_del_mes = ?,
           activo = COALESCE(?, activo)
       WHERE id = ? AND usuario_id = ?`,
      [titulo, frecuencia, valor ? parseFloat(valor) : null, fecha_inicio, diaMes, activo !== undefined ? activo : null, id, userId]
    )
    const [rows] = await db.query('SELECT * FROM deudas WHERE id = ?', [id])
    return res.json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al actualizar deuda.' })
  }
})

// DELETE /api/deudas/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  try {
    const [existing] = await db.query(
      'SELECT id FROM deudas WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Deuda no encontrada.' })
    }
    await db.query(
      "DELETE FROM registros_automaticos WHERE tipo = 'deuda' AND referencia_id = ? AND usuario_id = ?",
      [id, userId]
    )
    await db.query('DELETE FROM deudas WHERE id = ? AND usuario_id = ?', [id, userId])
    return res.json({ message: 'Deuda eliminada.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al eliminar deuda.' })
  }
})

// PATCH /api/deudas/:id/finalizar
router.patch('/:id/finalizar', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  try {
    await db.query(
      'UPDATE deudas SET activo = 0 WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    return res.json({ message: 'Deuda finalizada.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al finalizar deuda.' })
  }
})

module.exports = router
