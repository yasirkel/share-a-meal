const jwt = require('jsonwebtoken');
const config = require('../config');

// Controleert of een request een geldige JWT-token bevat.
function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication token is required',
      data: null,
    });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = {
      userId: payload.userId,
      emailAddress: payload.emailAddress,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: 'Invalid or expired authentication token',
      data: null,
    });
  }
}

module.exports = authenticateToken;
