// ===================================
//   BRAINBALANCE — AUTH MIDDLEWARE
//   JWT token verification for protected routes
// ===================================

const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token and extract user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, name: decoded.name, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

// Optional auth — doesn't block, just attaches user if token present
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, name: decoded.name, email: decoded.email };
    } catch (e) {
      // Token invalid, continue without auth
    }
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
