require("dotenv").config();
const connectDB = require("../config/db");
const Course = require("../models/Course");
const ragService = require("../services/ragService");

async function setupAndIndexCourses() {
  try {
    await connectDB();

    await ragService.setupCollection();

    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses to index`);

    for (const course of courses) {
      await ragService.indexCourse(course);
    }

    console.log("✅ All courses indexed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

setupAndIndexCourses();
