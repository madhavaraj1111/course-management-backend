const ragService = require("../services/ragService");

exports.searchCourses = async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const result = await ragService.searchCourses(query, limit || 5);

    res.json({
      success: true,
      answer: result.answer,
      courses: result.courses,
    });
  } catch (error) {
    console.error("RAG search error:", error);
    res.status(500).json({ message: "Error searching courses" });
  }
};