import { Router } from "express";
import {
  shortenURL,
  redirectToFullURL,
  testController,
} from "../controllers/index.js";

const router = Router();

// used for testing
router.get("/api/test", testController);

// catch all for shortened url redirects
router.get("/:redirectID", redirectToFullURL);

// url shortening route
router.post("/api/shorten-url", shortenURL);

export default router;
