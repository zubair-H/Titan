import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config();  

const { JWT_SECRET } = process.env;


export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user; // Attach the decoded user information to the request object
        next(); // Pass control to the next middleware or route handler
    });
};
