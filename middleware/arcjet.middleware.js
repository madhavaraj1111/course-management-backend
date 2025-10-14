import aj from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    // Extract real IP from various proxy headers (Render, Cloudflare, etc.)
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    
    // Get the first IP from x-forwarded-for (in case of multiple proxies)
    let ip = '127.0.0.1'; // Default fallback
    
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp;
    } else if (cfConnectingIp) {
      ip = cfConnectingIp;
    } else if (req.socket.remoteAddress) {
      ip = req.socket.remoteAddress;
    } else if (req.connection.remoteAddress) {
      ip = req.connection.remoteAddress;
    }

    // Create a request-like object with explicit IP
    const requestWithIp = {
      ...req,
      ip: ip,
      ips: [ip]
    };

    // Pass the IP explicitly to Arcjet in multiple ways
    const decision = await aj.protect(requestWithIp, { 
      requested: 1,
      ip: ip,
      characteristics: {
        ip: ip
      }
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ message: "Rate limit exceeded" });
      }
      if (decision.reason.isBot()) {
        return res.status(403).json({ message: "Bot detected" });
      }

      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch (error) {
    console.log("Arcjet Middleware Error:", error.message);
    // Allow request to continue even if Arcjet fails (fail open)
    next();
  }
};

export default arcjetMiddleware;