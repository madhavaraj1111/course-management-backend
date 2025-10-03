const User = require("../models/User");
const Progress = require("../models/Progress");

// Get student dashboard data
const getStudentDashboard = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Student access required" });
    }

    const user = await User.findById(req.user.userId).populate(
      "enrolledCourses"
    );

    const progressData = await Progress.find({
      user: req.user.userId,
    }).populate("course", "title instructorName");

    const enrolledCoursesWithProgress = user.enrolledCourses.map((course) => {
      const progress = progressData.find(
        (p) => p.course._id.toString() === course._id.toString()
      );

      return {
        ...course.toObject(),
        progress: progress ? progress.overallProgress : 0,
      };
    });

    const completedCourses = progressData.filter(
      (p) => p.overallProgress >= 100
    ).length;
    const avgProgress =
      progressData.length > 0
        ? Math.round(
            progressData.reduce((acc, p) => acc + p.overallProgress, 0) /
              progressData.length
          )
        : 0;

    res.json({
      enrolledCourses: enrolledCoursesWithProgress,
      totalEnrolled: user.enrolledCourses.length,
      completedCourses,
      avgProgress,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getStudentDashboard,
};
