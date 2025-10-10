import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  category: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  instructorName: { type: String, required: true },
  sections: [
    {
      title: { type: String, required: true },
      description: { type: String },
      lessons: [
        {
          title: { type: String, required: true },
          description: { type: String },
        },
      ],
    },
  ],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Course", courseSchema);
