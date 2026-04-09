function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autorizado. Por favor inicia sesión.' })
  }
  next()
}

module.exports = { requireAuth }
