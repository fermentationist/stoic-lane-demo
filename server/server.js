import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import router from "./routes/index.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { API_SERVER_PORT } from "../vite.config.js";

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
});

export default app;
