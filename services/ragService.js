import weaviate from "weaviate-client";
import { GoogleGenAI } from "@google/genai";

let weaviateClient = null;
let geminiAI = null;

// Initialize clients
export async function initializeRAG() {
  if (!weaviateClient) {
    weaviateClient = await weaviate.connectToWeaviateCloud(
      process.env.WEAVIATE_URL,
      {
        authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
      }
    );
  }

  if (!geminiAI) {
    geminiAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return { weaviateClient, geminiAI };
}

// Generate embedding
export async function generateEmbedding(text) {
  const { geminiAI } = await initializeRAG();
  const response = await geminiAI.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });
  return response.embeddings[0].values;
}

// Index course content
export async function indexCourse(course) {
  try {
    const { weaviateClient } = await initializeRAG();
    const courses = weaviateClient.collections.use("Course");

    const sectionTitles = course.sections?.map((s) => s.title).join(" ") || "";
    const lessonTitles =
      course.sections
        ?.flatMap((s) => s.lessons?.map((l) => l.title))
        .join(" ") || "";

    const textToEmbed = `${course.title} ${course.description} ${course.instructorName} ${course.category} ${course.difficulty} ${sectionTitles} ${lessonTitles}`;

    const embedding = await generateEmbedding(textToEmbed);

    await courses.data.insert({
      properties: {
        courseId: course._id.toString(),
        title: course.title,
        description: course.description,
        instructorName: course.instructorName,
        category: course.category,
        difficulty: course.difficulty,
        thumbnail: course.thumbnail || "",
        sectionsCount: course.sections?.length || 0,
        enrolledCount: course.enrolledStudents?.length || 0,
      },
      vectors: { default: embedding },
    });

    console.log(`✅ Indexed course: ${course.title}`);
  } catch (error) {
    console.error("Error indexing course:", error);
    throw error;
  }
}

// Update course index
export async function updateCourseIndex(courseId, course) {
  try {
    const { weaviateClient } = await initializeRAG();
    const courses = weaviateClient.collections.use("Course");

    const oldResults = await courses.query.fetchObjects({
      filters: courses.filter.byProperty("courseId").equal(courseId),
      limit: 1,
    });

    if (oldResults.objects.length > 0) {
      await courses.data.deleteById(oldResults.objects[0].uuid);
    }

    await indexCourse(course);
  } catch (error) {
    console.error("Error updating course index:", error);
    throw error;
  }
}

// Delete course from index
export async function deleteCourseIndex(courseId) {
  try {
    const { weaviateClient } = await initializeRAG();
    const courses = weaviateClient.collections.use("Course");

    const results = await courses.query.fetchObjects({
      filters: courses.filter.byProperty("courseId").equal(courseId),
      limit: 1,
    });

    if (results.objects.length > 0) {
      await courses.data.deleteById(results.objects[0].uuid);
      console.log(`✅ Deleted course from index: ${courseId}`);
    }
  } catch (error) {
    console.error("Error deleting course index:", error);
    throw error;
  }
}

// Search courses using RAG
export async function searchCourses(query, limit = 5) {
  try {
    const { weaviateClient, geminiAI } = await initializeRAG();
    const queryVector = await generateEmbedding(query);

    const courses = weaviateClient.collections.use("Course");
    const searchResults = await courses.query.nearVector(queryVector, {
      limit: limit,
      returnMetadata: ["distance"],
    });

    if (searchResults.objects.length === 0) {
      return {
        answer:
          "I couldn't find any relevant courses for your query. Please try rephrasing or browse our course catalog!",
        courses: [],
      };
    }

    let context = "Here are relevant courses from our platform:\n\n";
    searchResults.objects.forEach((item, index) => {
      context += `Course ${index + 1}:\n`;
      context += JSON.stringify(item.properties, null, 2);
      context += "\n\n";
    });

    const prompt = `${context}

Based on the courses above, please answer the following question in a helpful and conversational way:
${query}

If the information doesn't fully answer the question, provide your best recommendation based on the available courses and their details.`;

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return {
      answer: response.text,
      courses: searchResults.objects.map((obj) => obj.properties),
    };
  } catch (error) {
    console.error("Error in RAG search:", error);
    throw error;
  }
}

// Setup collection (run once)
export async function setupCollection() {
  try {
    const { weaviateClient } = await initializeRAG();

    try {
      await weaviateClient.collections.delete("Course");
      console.log("Deleted existing Course collection");
    } catch (e) {
      console.log("No existing collection to delete");
    }

    await weaviateClient.collections.create({
      name: "Course",
    });

    console.log("✅ Course collection created successfully!");
  } catch (error) {
    console.error("Error setting up collection:", error);
    throw error;
  }
}
