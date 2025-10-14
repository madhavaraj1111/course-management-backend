import dotenv from "dotenv";
import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";
dotenv.config();

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  // Remove ip.src from characteristics - we'll pass it explicitly
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: 10,
      capacity: 10,
    }),
  ],
});

export default aj;