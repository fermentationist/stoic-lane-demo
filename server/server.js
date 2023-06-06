import "dotenv/config";
import express from "express";
import wakeDyno from "woke-dyno";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import router from "./routes/index.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { API_SERVER_PORT, PROD_URL } from "../vite.config.js";

const WAKE_SERVER_INTERVAL = 1000 * 60 * 14; // 14 minutes
const PROD_MODE = process.env.PROD_MODE === "true";
const STATIC_FOLDER = PROD_MODE ? "../build/" : "../";
const filename = fileURLToPath(import.meta.url);
const dirName = dirname(filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const staticPath = path.join(dirName, STATIC_FOLDER);
app.use(express.static(staticPath));

app.use("/", rateLimiter, router);

app.listen(API_SERVER_PORT, () => {
  console.log(`Express app listening on port ${API_SERVER_PORT}`);

  const offset = 5;
  const getOffsetHours = hours => (hours + offset) > 24 ? Math.abs(24 - (hours + offset)) : hours + offset;
  const napStartHour = getOffsetHours(18);
  const napEndHour = getOffsetHours(8)
  wakeDyno({
    url: PROD_URL,
    interval: WAKE_SERVER_INTERVAL, 
    startNap: [napStartHour, 0, 0, 0],
    endNap: [napEndHour, 0, 0, 0]
  }).start();
});

export default app;
