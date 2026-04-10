const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth } = require('../middleware/auth')
const { generarRecurrentes } = require('../recurrencia')

// GET /api/dashboard?mes=2026-03
router.get('/', requireAuth, async (req, res) => {
  const userId = req.session.userId
  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const mes = req.query.mes || mesActual

  try {
    if (mes === mesActual) {
      await generarRecurrentes(userId)
    }

    const [[{ totalIngresos }]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as totalIngresos
       FROM ingresos
       WHERE usuario_id = ? AND DATE_FORMAT(fecha, '%Y-%m') = ? AND activo = 1`,
      [userId, mes]
    )

    const [[{ gastosDirectos }]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as gastosDirectos
       FROM gastos
       WHERE usuario_id = ?
         AND frecuencia = 'unico'
         AND DATE_FORMAT(fecha_inicio, '%Y-%m') = ?
         AND activo = 1`,
      [userId, mes]
    )
    const [[{ gastosAuto }]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as gastosAuto
       FROM registros_automaticos
       WHERE usuario_id = ? AND tipo = 'gasto'
         AND DATE_FORMAT(fecha_aplicada, '%Y-%m') = ?`,
      [userId, mes]
    )
    const totalGastos = parseFloat(gastosDirectos) + parseFloat(gastosAuto)

    const [[{ deudasDirectas }]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as deudasDirectas
       FROM deudas
       WHERE usuario_id = ?
         AND frecuencia = 'unico'
         AND DATE_FORMAT(fecha_inicio, '%Y-%m') = ?
         AND activo = 1`,
      [userId, mes]
    )
    const [[{ deudasAuto }]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as deudasAuto
       FROM registros_automaticos
       WHERE usuario_id = ? AND tipo = 'deuda'
         AND DATE_FORMAT(fecha_aplicada, '%Y-%m') = ?`,
      [userId, mes]
    )
    const totalDeudas = parseFloat(deudasDirectas) + parseFloat(deudasAuto)

    const balanceNeto = parseFloat(totalIngresos) - totalGastos - totalDeudas

    const [ingresos] = await db.query(
      `SELECT id, titulo, frecuencia, valor, fecha, 'ingreso' as tipo
       FROM ingresos
       WHERE usuario_id = ? AND DATE_FORMAT(fecha, '%Y-%m') = ? AND activo = 1
       ORDER BY fecha DESC LIMIT 5`,
      [userId, mes]
    )
    const [gastosRec] = await db.query(
      `(SELECT g.id, g.titulo, g.frecuencia, g.valor, g.fecha_inicio as fecha, 'gasto' as tipo
        FROM gastos g
        WHERE g.usuario_id = ? AND g.frecuencia = 'unico'
          AND DATE_FORMAT(g.fecha_inicio, '%Y-%m') = ?
        ORDER BY g.fecha_inicio DESC LIMIT 5)
       UNION ALL
       (SELECT ra.id, ra.titulo, 'automatico' as frecuencia, ra.valor, ra.fecha_aplicada as fecha, 'gasto' as tipo
        FROM registros_automaticos ra
        WHERE ra.usuario_id = ? AND ra.tipo = 'gasto'
          AND DATE_FORMAT(ra.fecha_aplicada, '%Y-%m') = ?
        ORDER BY ra.fecha_aplicada DESC LIMIT 5)`,
      [userId, mes, userId, mes]
    )
    const [deudasRec] = await db.query(
      `(SELECT d.id, d.titulo, d.frecuencia, d.valor, d.fecha_inicio as fecha, 'deuda' as tipo
        FROM deudas d
        WHERE d.usuario_id = ? AND d.frecuencia = 'unico'
          AND DATE_FORMAT(d.fecha_inicio, '%Y-%m') = ?
        ORDER BY d.fecha_inicio DESC LIMIT 5)
       UNION ALL
       (SELECT ra.id, ra.titulo, 'automatico' as frecuencia, ra.valor, ra.fecha_aplicada as fecha, 'deuda' as tipo
        FROM registros_automaticos ra
        WHERE ra.usuario_id = ? AND ra.tipo = 'deuda'
          AND DATE_FORMAT(ra.fecha_aplicada, '%Y-%m') = ?
        ORDER BY ra.fecha_aplicada DESC LIMIT 5)`,
      [userId, mes, userId, mes]
    )

    const movimientos = [...ingresos, ...gastosRec, ...deudasRec]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10)

    return res.json({
      mes,
      totales: {
        ingresos: parseFloat(totalIngresos),
        gastos: totalGastos,
        deudas: totalDeudas,
        balance: balanceNeto
      },
      movimientos
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al obtener dashboard.' })
  }
})

// GET /api/dashboard/historial
router.get('/historial', requireAuth, async (req, res) => {
  const userId = req.session.userId
  try {
    const [mesesIngresos] = await db.query(
      `SELECT DISTINCT DATE_FORMAT(fecha, '%Y-%m') as mes FROM ingresos WHERE usuario_id = ?`,
      [userId]
    )
    const [mesesGastos] = await db.query(
      `SELECT DISTINCT DATE_FORMAT(fecha_inicio, '%Y-%m') as mes FROM gastos WHERE usuario_id = ?`,
      [userId]
    )
    const [mesesAuto] = await db.query(
      `SELECT DISTINCT DATE_FORMAT(fecha_aplicada, '%Y-%m') as mes FROM registros_automaticos WHERE usuario_id = ?`,
      [userId]
    )

    const todosMeses = [...new Set([
      ...mesesIngresos.map(r => r.mes),
      ...mesesGastos.map(r => r.mes),
      ...mesesAuto.map(r => r.mes)
    ])].sort((a, b) => b.localeCompare(a))

    const historial = []
    for (const mes of todosMeses) {
      const [[{ totalIngresos }]] = await db.query(
        `SELECT COALESCE(SUM(valor), 0) as totalIngresos FROM ingresos
         WHERE usuario_id = ? AND DATE_FORMAT(fecha, '%Y-%m') = ? AND activo = 1`,
        [userId, mes]
      )
      const [[{ gastosDirectos }]] = await db.query(
        `SELECT COALESCE(SUM(valor), 0) as gastosDirectos FROM gastos
         WHERE usuario_id = ? AND frecuencia = 'unico' AND DATE_FORMAT(fecha_inicio, '%Y-%m') = ?`,
        [userId, mes]
      )
      const [[{ gastosAuto }]] = await db.query(
        `SELECT COALESCE(SUM(valor), 0) as gastosAuto FROM registros_automaticos
         WHERE usuario_id = ? AND tipo = 'gasto' AND DATE_FORMAT(fecha_aplicada, '%Y-%m') = ?`,
        [userId, mes]
      )
      const [[{ deudasDirectas }]] = await db.query(
        `SELECT COALESCE(SUM(valor), 0) as deudasDirectas FROM deudas
         WHERE usuario_id = ? AND frecuencia = 'unico' AND DATE_FORMAT(fecha_inicio, '%Y-%m') = ?`,
        [userId, mes]
      )
      const [[{ deudasAuto }]] = await db.query(
        `SELECT COALESCE(SUM(valor), 0) as deudasAuto FROM registros_automaticos
         WHERE usuario_id = ? AND tipo = 'deuda' AND DATE_FORMAT(fecha_aplicada, '%Y-%m') = ?`,
        [userId, mes]
      )
      const ingresos = parseFloat(totalIngresos)
      const gastos = parseFloat(gastosDirectos) + parseFloat(gastosAuto)
      const deudas = parseFloat(deudasDirectas) + parseFloat(deudasAuto)
      historial.push({
        mes,
        ingresos,
        gastos,
        deudas,
        balance: ingresos - gastos - deudas
      })
    }
    return res.json(historial)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al obtener historial.' })
  }
})

module.exports = router
