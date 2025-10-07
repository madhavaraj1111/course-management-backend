const express = require("express");
const router = express.Router();
const ragController = require("../controllers/ragController");
const auth = require("../middleware/auth");

router.post("/search", auth, ragController.searchCourses);

module.exports = router;