import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import Course from "../models/Course.js";
import ragService from "../services/ragService.js";

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
