import rateLimit from "express-rate-limit";

const MAX_REQUESTS = 1; // limiting requests to 1 per ms, so our timestamp-based ids will be guaranteed to be unique
const REQUEST_LIMIT_WINDOW = 1; // 1 ms
const MAX_USER_REQUESTS = 30;
const USER_REQUEST_LIMIT_WINDOW = 1000 * 60; // 1 minute

const rate = MAX_REQUESTS / (REQUEST_LIMIT_WINDOW / (1000 * 60)); // rate per minute
const userRate = MAX_USER_REQUESTS / (USER_REQUEST_LIMIT_WINDOW / (1000 * 60)); // rate per minute

const generalRateLimitConfig = {
  windowMs: REQUEST_LIMIT_WINDOW,
  max: MAX_REQUESTS,
  standardHeaders: true,
  message: {error: {name: "Rate limit exceeded", message: `Maximum of ${rate} requests per minute.`}}
}

const userRateLimitConfig = {
  windowMs: USER_REQUEST_LIMIT_WINDOW,
  max: MAX_USER_REQUESTS,
  standardHeaders: true,
  message: {error: {name: "Rate limit exceeded", message: `Too many requests from this user. Maximum of ${userRate} per minute.`}},
  keyGenerator: (req, res) => {
    const ip = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;
    return ip;
  }
}

export const rateLimiter = rateLimit(generalRateLimitConfig);

export const userRateLimiter = rateLimit(userRateLimitConfig);

export default [rateLimiter, userRateLimiter];