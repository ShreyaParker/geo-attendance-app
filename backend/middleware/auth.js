import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No token provided" });

    try {

        const cleanToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'secret_key');
        req.userId = decoded.id;
        req.userRole = decoded.role;
        console.log(`🔐 Token Decoded -> User: ${req.userId}, Role: ${req.userRole}`);
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
};

export const isAdmin = (req, res, next) => {
    console.log(`👮 Admin Check -> Role is: ${req.userRole}`);
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: "Access Denied: Admins Only" });
    }
    next();
};
