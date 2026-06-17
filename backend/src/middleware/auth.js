const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route. Missing token.' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await db.users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized to access this route. Invalid token.' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user ? req.user.role : 'guest'}) is not authorized to perform this action.`
      });
    }
    next();
  };
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await db.users.findById(decoded.id);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { protect, restrictTo, optionalProtect };
