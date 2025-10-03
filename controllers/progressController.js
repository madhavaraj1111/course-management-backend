const Progress = require('../models/Progress');
const Course = require('../models/Course');

// Mark lesson as complete
const markLessonComplete = async (req, res) => {
  try {
    const { courseId, sectionId, lessonId } = req.params;

    let progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId,
    });

    if (!progress) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    // Check if lesson already completed
    const existingCompletion = progress.completedLessons.find(
      (l) =>
        l.sectionId.toString() === sectionId &&
        l.lessonId.toString() === lessonId
    );

    if (!existingCompletion) {
      progress.completedLessons.push({
        sectionId: sectionId,
        lessonId: lessonId,
      });

      // Calculate overall progress
      const course = await Course.findById(courseId);
      const totalLessons = course.sections.reduce(
        (acc, section) => acc + section.lessons.length,
        0
      );
      progress.overallProgress = Math.round(
        (progress.completedLessons.length / totalLessons) * 100
      );

      progress.lastAccessed = new Date();
      await progress.save();
    }

    res.json({
      message: 'Lesson marked as complete',
      progress: progress.overallProgress,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  markLessonComplete,
};