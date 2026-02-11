import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        console.log("❌ Blocked: No 'Authorization' header found.");
        return res.status(403).json({ error: "No token provided" });
    }

    try {
        // Handle "Bearer " prefix if present, or raw token
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'secret_key');

        req.userId = decoded.id;
        req.userRole = decoded.role;

        console.log(`✅ Token Verified. User ID: ${req.userId}, Role: ${req.userRole}`);
        next();
    } catch (err) {
        console.log("❌ Blocked: Token verification failed:", err.message);
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
};

export const isAdmin = (req, res, next) => {
    console.log(`🔹 Checking Admin Role... Current Role: '${req.userRole}'`);

    if (req.userRole !== 'admin') {
        console.log("❌ Blocked: User is not 'admin'.");
        return res.status(403).json({ error: "Access Denied: Admins Only" });
    }

    console.log("✅ Admin Access Granted.");
    next();
};