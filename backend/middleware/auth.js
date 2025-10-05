const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.warn('Firebase Admin SDK initialization failed:', error.message);
  console.warn('Continuing with JWT fallback authentication only');
}

/**
 * Middleware to protect routes
 * Verifies Firebase token or JWT token
 */
exports.protect = async (req, res, next) => {
  let token;
  
  // Check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check if token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
  
  try {
    let decoded;
    let user;
    
    // Try to verify Firebase token first
    if (admin && admin.auth) {
      try {
        const decodedFirebase = await admin.auth().verifyIdToken(token);
        
        // Find user by Firebase UID or create if not exists
        user = await User.findOne({ firebaseUid: decodedFirebase.uid });
        
        if (!user) {
          // Create new user if not found
          user = await User.create({
            name: decodedFirebase.name || 'User',
            email: decodedFirebase.email,
            avatar: decodedFirebase.picture || '',
            firebaseUid: decodedFirebase.uid,
            role: 'student' // Default role for new users
          });
        }
        
        req.user = user;
        return next();
      } catch (firebaseError) {
        // If Firebase verification fails, try JWT fallback
        console.log('Firebase verification failed, trying JWT fallback');
      }
    }
    
    // JWT fallback verification
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...String} roles - Roles allowed to access the route
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `User role ${req.user.role} is not authorized to access this route` });
    }
    
    next();
  };
};