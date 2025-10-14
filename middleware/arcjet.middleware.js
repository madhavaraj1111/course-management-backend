import aj from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    // Extract real IP from Render's proxy headers
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    
    // Get the first IP from x-forwarded-for (in case of multiple proxies)
    const ip = forwardedFor 
      ? forwardedFor.split(',')[0].trim() 
      : realIp || req.socket.remoteAddress || '0.0.0.0';

    // Pass the IP explicitly to Arcjet
    const decision = await aj.protect(req, { 
      requested: 1,
      ip: ip  // This is the key fix for Render
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
    console.log("Arcjet Middleware Error ", error);
    // Allow request to continue even if Arcjet fails
    next();
  }
};

export default arcjetMiddleware;