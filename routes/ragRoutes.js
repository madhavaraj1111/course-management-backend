import { searchCourses } from "../controllers/ragController.js";
import auth from "../middleware/auth.js";
import express from "express";

const router = express.Router();

router.post("/search", auth, searchCourses);

export default router;
