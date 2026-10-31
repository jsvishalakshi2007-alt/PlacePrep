
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing. Please log in again.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({
        message: "Authentication configuration error.",
      });
    }

    // Temporary diagnostic: check the token received by the backend.
    const payload = jwt.decode(token);

    console.log("JWT diagnostic:", {
      serverTime: new Date().toISOString(),
      tokenIssuedAt: payload?.iat
        ? new Date(payload.iat * 1000).toISOString()
        : "Missing",
      tokenExpiresAt: payload?.exp
        ? new Date(payload.exp * 1000).toISOString()
        : "Missing",
      expiredAccordingToServer: payload?.exp
        ? payload.exp * 1000 <= Date.now()
        : "Unknown",
    });

    const decoded = jwt.verify(token, secret);

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        message: "Token does not contain a user ID. Please log in again.",
      });
    }

    req.user = {
      ...decoded,
      id: userId,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.name, error.message);

    return res.status(401).json({
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
}

module.exports = authMiddleware;
