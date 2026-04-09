const db = require('../server/db')

function generarFechas(item, hoy) {
    const fechas = []
    const inicio = new Date(item.fecha_inicio)
    inicio.setHours(0, 0, 0, 0)
    hoy.setHours(0, 0, 0, 0)

    if (inicio > hoy) return fechas

    switch (item.frecuencia) {
        case 'unico': {
            if (inicio <= hoy) fechas.push(new Date(inicio))
            break
        }
        case 'diario': {
            const cursor = new Date(inicio)
            while (cursor <= hoy) {
                fechas.push(new Date(cursor))
                cursor.setDate(cursor.getDate() + 1)
            }
            break
        }
        case 'semanal': {
            const cursor = new Date(inicio)
            while (cursor <= hoy) {
                fechas.push(new Date(cursor))
                cursor.setDate(cursor.getDate() + 7)
            }
            break
        }
        case 'mensual': {
            if (item.dia_del_mes) {
                const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), item.dia_del_mes)
                if (cursor < inicio) cursor.setMonth(cursor.getMonth() + 1)
                while (cursor <= hoy) {
                    fechas.push(new Date(cursor))
                    cursor.setMonth(cursor.getMonth() + 1)
                    cursor.setDate(item.dia_del_mes)
                }
            } else {
                const cursor = new Date(inicio)
                while (cursor <= hoy) {
                    fechas.push(new Date(cursor))
                    cursor.setMonth(cursor.getMonth() + 1)
                }
            }
            break
        }
    }
    return fechas
}

function toSQLDate(date) {
    return date.toISOString().split('T')[0]
}

async function procesarItems(items, tipo) {
    if (items.length === 0) return
    const hoy = new Date()

    for (const item of items) {
        if (!item.activo && item.frecuencia !== 'unico') continue
        const fechas = generarFechas(item, new Date(hoy))

        for (const fecha of fechas) {
            const fechaStr = toSQLDate(fecha)
            try {
                await db.query(
                    `INSERT IGNORE INTO registros_automaticos
             (usuario_id, tipo, referencia_id, titulo, valor, fecha_aplicada)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [item.usuario_id, tipo, item.id, item.titulo, item.valor, fechaStr]
                )
            } catch (err) {
            }
        }
    }
}

async function generarRecurrentes(userId) {
    try {
        const [gastos] = await db.query(
            "SELECT * FROM gastos WHERE usuario_id = ? AND frecuencia != 'unico'",
            [userId]
        )
        const [deudas] = await db.query(
            "SELECT * FROM deudas WHERE usuario_id = ? AND frecuencia != 'unico'",
            [userId]
        )
        await procesarItems(gastos, 'gasto')
        await procesarItems(deudas, 'deuda')
    } catch (err) {
        console.error('[recurrencia] Error generando recurrentes:', err.message)
    }
}

module.exports = { generarRecurrentes }
