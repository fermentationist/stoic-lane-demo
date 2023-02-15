import rateLimit from "express-rate-limit";

const MAX_REQUESTS = 2; // limiting requests to 2 per ms, so our timestamp-based ids will be guaranteed to be unique
const REQUEST_LIMIT_WINDOW = 1; // 1 ms
const MAX_USER_REQUESTS = 60;
const USER_REQUEST_LIMIT_WINDOW = 1000 * 60; // 1 minute

const userRate = MAX_USER_REQUESTS / (USER_REQUEST_LIMIT_WINDOW / (1000 * 60)); // rate per minute

const generalRateLimitConfig = {
  windowMs: REQUEST_LIMIT_WINDOW,
  max: MAX_REQUESTS,
  standardHeaders: true,
  message: {status: "failed", error: {name: "Rate limit exceeded", message: `Maximum of ${MAX_REQUESTS - 1} requests per millisecond.`}},
}

const userRateLimitConfig = {
  windowMs: USER_REQUEST_LIMIT_WINDOW,
  max: MAX_USER_REQUESTS,
  standardHeaders: true,
  message: {status: "failed", error: {name: "Rate limit exceeded", message: `Too many requests from this user. Maximum of ${userRate - 1} per minute.`}},
  keyGenerator: (req, res) => {
    const ip = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;
    return ip;
  }
}

export const generalRateLimiter = rateLimit(generalRateLimitConfig);

export const userRateLimiter = rateLimit(userRateLimitConfig);

export default [userRateLimiter, generalRateLimiter];