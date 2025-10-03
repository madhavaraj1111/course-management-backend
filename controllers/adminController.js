const Course = require("../models/Course");
const Progress = require("../models/Progress");

// Create course
const createCourse = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);
    const course = new Course({
      ...req.body,
      instructor: req.user.userId,
      instructorName: req.user.username,
      enrolledStudents: [],
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get admin's courses
const getAdminCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      instructor: req.user.userId,
    }).populate("enrolledStudents", "username email");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to sync progress after course update
const syncProgressAfterCourseUpdate = async (courseId, updatedSections) => {
  try {
    // Get all valid section and lesson IDs from updated course
    const validSectionIds = new Set();
    const validLessonIds = new Set();

    updatedSections.forEach((section) => {
      validSectionIds.add(section._id.toString());
      section.lessons.forEach((lesson) => {
        validLessonIds.add(lesson._id.toString());
      });
    });

    // Find all progress records for this course
    const progressRecords = await Progress.find({ course: courseId });

    // Update each progress record
    for (const progress of progressRecords) {
      let hasChanges = false;

      // Filter out orphaned completed lessons
      const validCompletedLessons = progress.completedLessons.filter(
        (completion) => {
          const sectionValid = validSectionIds.has(
            completion.sectionId.toString()
          );
          const lessonValid = validLessonIds.has(
            completion.lessonId.toString()
          );
          return sectionValid && lessonValid;
        }
      );

      // Check if any lessons were removed
      if (validCompletedLessons.length !== progress.completedLessons.length) {
        hasChanges = true;
        progress.completedLessons = validCompletedLessons;
      }

      // Recalculate overall progress
      if (hasChanges) {
        const totalLessons = updatedSections.reduce(
          (acc, section) => acc + section.lessons.length,
          0
        );

        progress.overallProgress =
          totalLessons > 0
            ? Math.round((validCompletedLessons.length / totalLessons) * 100)
            : 0;

        await progress.save();
      }
    }

    console.log(`Synced progress for ${progressRecords.length} students`);
  } catch (error) {
    console.error("Error syncing progress:", error);
    throw error;
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      instructor: req.user.userId,
    });

    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or unauthorized" });
    }

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Sync progress for all enrolled students
    await syncProgressAfterCourseUpdate(req.params.id, updatedCourse.sections);
    res.json(updatedCourse);
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      instructor: req.user.userId,
    });

    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or unauthorized" });
    }

    await Course.findByIdAndDelete(req.params.id);
    await Progress.deleteMany({ course: req.params.id });

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({
      instructor: req.user.userId,
    });
    const courses = await Course.find({ instructor: req.user.userId });

    let totalStudents = 0;
    courses.forEach((course) => {
      totalStudents += course.enrolledStudents.length;
    });

    const totalProgress = await Progress.find({
      course: { $in: courses.map((c) => c._id) },
    });

    const avgCompletion =
      totalProgress.length > 0
        ? totalProgress.reduce((acc, p) => acc + p.overallProgress, 0) /
          totalProgress.length
        : 0;

    res.json({
      totalCourses,
      totalStudents,
      activeEnrollments: totalProgress.length,
      avgCompletion: Math.round(avgCompletion),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createCourse,
  getAdminCourses,
  updateCourse,
  deleteCourse,
  getDashboardStats,
};
