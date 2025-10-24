import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // adjust path

export const requireSignin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer token"
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: fetch full user from DB
    const user = await User.findById(decoded._id).select('_id name email role');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
