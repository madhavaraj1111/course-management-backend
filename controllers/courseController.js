import Course from "../models/Course.js";
import User from "../models/User.js";
import Progress from "../models/Progress.js";
import * as ragService from "../services/ragService.js";

// Get all courses (for browsing)
export const getAllCourses = async (req, res) => {
  try {
    const { category, difficulty, instructor, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (instructor) query.instructorName = instructor;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(query)
      .populate("instructor", "username")
      .sort({ createdAt: -1 });

    // Add enrollment status for current user
    const user = await User.findById(req.user.userId);
    const coursesWithEnrollment = courses.map((course) => ({
      ...course.toObject(),
      isEnrolled: user.enrolledCourses.includes(course._id),
    }));

    res.json(coursesWithEnrollment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get course details
export const getCourseById = async (req, res) => {
  try {
    console.log("Fetching course:", req.params.id);
    console.log("User ID:", req.user.userId);

    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "username"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Course found:", course.title);

    // Check if user is enrolled
    const user = await User.findById(req.user.userId);
    console.log("User found:", user ? user.username : "null");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isEnrolled = user.enrolledCourses.includes(course._id);
    console.log("Is enrolled:", isEnrolled);

    // Get progress if enrolled
    let progress = null;
    if (isEnrolled) {
      progress = await Progress.findOne({
        user: req.user.userId,
        course: course._id,
      });
    }

    console.log("Sending response");

    res.json({
      ...course.toObject(),
      isEnrolled,
      progress: progress ? progress.completedLessons : [],
    });
  } catch (error) {
    console.error("getCourseById error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Enroll in course
export const enrollInCourse = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can enroll" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await User.findById(req.user.userId);
    if (user.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    // Add to user's enrolled courses
    user.enrolledCourses.push(course._id);
    await user.save();

    // Add to course's enrolled students
    course.enrolledStudents.push(req.user.userId);
    await course.save();

    // Create progress record
    const progress = new Progress({
      user: req.user.userId,
      course: course._id,
      completedLessons: [],
      overallProgress: 0,
    });
    await progress.save();

    res.json({ message: "Enrolled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
