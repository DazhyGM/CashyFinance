const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

// GET /api/gastos?mes=2026-03
router.get('/', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { mes } = req.query
  try {
    const [gastos] = await db.query(
      'SELECT * FROM gastos WHERE usuario_id = ? ORDER BY created_at DESC',
      [userId]
    )
    let registros = []
    if (mes) {
      const [rows] = await db.query(
        `SELECT * FROM registros_automaticos
         WHERE usuario_id = ? AND tipo = 'gasto'
         AND DATE_FORMAT(fecha_aplicada, '%Y-%m') = ?
         ORDER BY fecha_aplicada DESC`,
        [userId, mes]
      )
      registros = rows
    }
    return res.json({ gastos, registros })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al obtener gastos.' })
  }
})

// POST /api/gastos
router.post('/', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { titulo, frecuencia, valor, fecha_inicio, dia_del_mes } = req.body
  if (!titulo || !frecuencia || !valor || !fecha_inicio) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' })
  }
  try {
    const diaMes = frecuencia === 'mensual' && dia_del_mes ? parseInt(dia_del_mes) : null
    const [result] = await db.query(
      `INSERT INTO gastos (usuario_id, titulo, frecuencia, valor, fecha_inicio, dia_del_mes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, titulo.trim(), frecuencia, parseFloat(valor), fecha_inicio, diaMes]
    )
    const [rows] = await db.query('SELECT * FROM gastos WHERE id = ?', [result.insertId])
    return res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al crear gasto.' })
  }
})

// PUT /api/gastos/:id
router.put('/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  const { titulo, frecuencia, valor, fecha_inicio, dia_del_mes, activo } = req.body
  try {
    const [existing] = await db.query(
      'SELECT id FROM gastos WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado.' })
    }
    const diaMes = frecuencia === 'mensual' && dia_del_mes ? parseInt(dia_del_mes) : null
    await db.query(
      `UPDATE gastos
       SET titulo = COALESCE(?, titulo),
           frecuencia = COALESCE(?, frecuencia),
           valor = COALESCE(?, valor),
           fecha_inicio = COALESCE(?, fecha_inicio),
           dia_del_mes = ?,
           activo = COALESCE(?, activo)
       WHERE id = ? AND usuario_id = ?`,
      [titulo, frecuencia, valor ? parseFloat(valor) : null, fecha_inicio, diaMes, activo !== undefined ? activo : null, id, userId]
    )
    const [rows] = await db.query('SELECT * FROM gastos WHERE id = ?', [id])
    return res.json(rows[0])
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al actualizar gasto.' })
  }
})

// DELETE /api/gastos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  try {
    const [existing] = await db.query(
      'SELECT id FROM gastos WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado.' })
    }
    await db.query(
      "DELETE FROM registros_automaticos WHERE tipo = 'gasto' AND referencia_id = ? AND usuario_id = ?",
      [id, userId]
    )
    await db.query('DELETE FROM gastos WHERE id = ? AND usuario_id = ?', [id, userId])
    return res.json({ message: 'Gasto eliminado.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al eliminar gasto.' })
  }
})

// PATCH /api/gastos/:id/finalizar
router.patch('/:id/finalizar', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  try {
    await db.query(
      'UPDATE gastos SET activo = 0 WHERE id = ? AND usuario_id = ?',
      [id, userId]
    )
    return res.json({ message: 'Gasto finalizado.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al finalizar gasto.' })
  }
})

module.exports = router
