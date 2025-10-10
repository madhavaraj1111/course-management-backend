import express from "express";
import authenticateToken from "../middleware/auth.js";
import { getStudentDashboard } from "../controllers/studentController.js";

const router = express.Router();

// All student routes require authentication
router.use(authenticateToken);

router.get("/dashboard", getStudentDashboard);

export default router;
