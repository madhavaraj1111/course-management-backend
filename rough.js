// // index.js - RAG Conversational System with Gemini Embeddings
// import dotenv from "dotenv";
// dotenv.config();
// import weaviate from "weaviate-client";
// import { GoogleGenAI } from "@google/genai";

// // Initialize clients
// const weaviateClient = await weaviate.connectToWeaviateCloud(
//   process.env.WEAVIATE_URL,
//   {
//     authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
//   }
// );

// const geminiAI = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// // Generate embedding using Gemini
// async function generateEmbedding(text) {
//   const response = await geminiAI.models.embedContent({
//     model: "text-embedding-004",
//     contents: text,
//   });
//   return response.embeddings[0].values;
// }

// // RAG function - retrieves and generates response
// async function ragQuery(userQuestion, limit = 3) {
//   try {
//     // Step 1: Generate embedding for user question
//     console.log("🔍 Generating embedding for your question...");
//     const queryVector = await generateEmbedding(userQuestion);
//     console.log(`📊 Query vector dimension: ${queryVector.length}`);

//     // Step 2: Retrieve relevant documents from Weaviate using vector search
//     const questions = weaviateClient.collections.use("Question");
//     const searchResults = await questions.query.nearVector(queryVector, {
//       limit: limit,
//       returnMetadata: ["distance", "vector"],
//     });

//     console.log(`🔎 Found ${searchResults.objects.length} results`);
//     if (searchResults.objects.length > 0) {
//       const firstVector = searchResults.objects[0].metadata?.vector;
//       if (firstVector) {
//         console.log(`📊 Stored vector dimension: ${firstVector.length}`);
//       }
//     }

//     if (searchResults.objects.length === 0) {
//       return {
//         answer:
//           "I couldn't find any relevant information in the database for your question. Please try rephrasing or ask something else!",
//         sources: [],
//       };
//     }

//     // Step 3: Format the retrieved context
//     let context = "Here is relevant information from the database:\n\n";
//     searchResults.objects.forEach((item, index) => {
//       context += `Document ${index + 1}:\n`;
//       context += JSON.stringify(item.properties, null, 2);
//       context += "\n\n";
//     });

//     // Step 4: Create prompt with context and user question
//     const prompt = `${context}

// Based on the information above, please answer the following question in a conversational way:
// ${userQuestion}

// If the information doesn't contain the answer, please say so and provide your best general knowledge response.`;

//     // Step 5: Generate response using Gemini
//     console.log("💭 Generating response...");
//     const response = await geminiAI.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt,
//     });

//     return {
//       answer: response.text,
//       sources: searchResults.objects.map((obj) => obj.properties),
//     };
//   } catch (error) {
//     console.error("Error in RAG query:", error);
//     throw error;
//   }
// }

// // Conversational loop function
// async function startConversation() {
//   const readline = await import("readline");
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   console.log(
//     "🤖 RAG Chatbot initialized! Ask me anything (type 'exit' to quit)\n"
//   );

//   const askQuestion = () => {
//     rl.question("You: ", async (userInput) => {
//       if (userInput.toLowerCase() === "exit") {
//         console.log("Goodbye! 👋");
//         rl.close();
//         weaviateClient.close();
//         return;
//       }

//       if (!userInput.trim()) {
//         askQuestion();
//         return;
//       }

//       try {
//         const result = await ragQuery(userInput);
//         console.log(`\n🤖 Assistant: ${result.answer}\n`);
//         console.log(`📚 Used ${result.sources.length} sources from database\n`);
//       } catch (error) {
//         console.log("❌ Error generating response:", error.message);
//       }

//       askQuestion();
//     });
//   };

//   askQuestion();
// }

// // Single query example
// async function singleQuery() {
//   const question = "What is biology?";
//   console.log(`Question: ${question}\n`);

//   const result = await ragQuery(question);
//   console.log(`Answer: ${result.answer}\n`);
//   console.log("Sources used:");
//   result.sources.forEach((source, i) => {
//     console.log(`${i + 1}. ${JSON.stringify(source, null, 2)}`);
//   });

//   weaviateClient.close();
// }

// // Helper: Setup collection with proper schema (run once)
// async function setupCollection() {
//   try {
//     // Delete existing collection if it exists
//     try {
//       await weaviateClient.collections.delete("Question");
//       console.log("Deleted existing Question collection");
//     } catch (e) {
//       console.log("No existing collection to delete");
//     }

//     // Create new collection WITHOUT vectorizer (we'll use Gemini)
//     await weaviateClient.collections.create({
//       name: "Question",
//     });

//     console.log("✅ Collection created successfully!");

//     // Load and insert sample data
//     console.log("Loading sample data...");
//     const response = await fetch(
//       "https://raw.githubusercontent.com/weaviate-tutorials/quickstart/main/data/jeopardy_tiny.json"
//     );
//     const data = await response.json();

//     const questions = weaviateClient.collections.use("Question");

//     console.log(`\nInserting ${data.length} questions with embeddings...\n`);

//     // Insert ONE BY ONE with proper awaiting
//     let successCount = 0;
//     for (let i = 0; i < data.length; i++) {
//       const item = data[i];
//       const textToEmbed = `${item.Question} ${item.Answer}`;

//       console.log(
//         `[${i + 1}/${data.length}] Processing: "${item.Question.substring(
//           0,
//           60
//         )}..."`
//       );

//       // Step 1: Generate embedding and WAIT for it
//       console.log(`  → Generating embedding...`);
//       const embedding = await generateEmbedding(textToEmbed);
//       console.log(`  ✓ Got embedding: ${embedding.length} dimensions`);
//       console.log(
//         `  → First 3 values: [${embedding
//           .slice(0, 3)
//           .map((v) => v.toFixed(4))
//           .join(", ")}...]`
//       );

//       // Step 2: Verify embedding is valid
//       if (!embedding || !Array.isArray(embedding) || embedding.length < 100) {
//         console.log(
//           `  ✗ INVALID EMBEDDING! Got ${embedding?.length} dimensions. Skipping...`
//         );
//         continue;
//       }

//       // Step 3: Insert with vector
//       console.log(`  → Inserting into Weaviate...`);
//       try {
//         const uuid = await questions.data.insert({
//           properties: {
//             question: item.Question,
//             answer: item.Answer,
//             category: item.Category,
//           },
//           vectors: { default: embedding },
//         });
//         console.log(
//           `  ✓ Inserted successfully! UUID: ${uuid.substring(0, 8)}...`
//         );
//         successCount++;
//       } catch (insertError) {
//         console.log(`  ✗ Insert FAILED:`, insertError.message);
//       }

//       console.log(); // Empty line for readability
//     }

//     console.log(
//       `\n✅ Setup complete! Successfully inserted ${successCount}/${data.length} items`
//     );

//     // Verify immediately
//     console.log("\n🔍 Verifying data was stored...");
//     const verifyResult = await questions.query.fetchObjects({
//       limit: 1,
//       includeVector: true,
//     });

//     if (verifyResult.objects.length > 0) {
//       const obj = verifyResult.objects[0];
//       console.log("Object keys:", Object.keys(obj));
//       console.log("Vector:", obj.vector);
//       console.log("Vectors:", obj.vectors);

//       const vectorData = obj.vector || obj.vectors?.default;
//       if (vectorData) {
//         console.log(
//           `✅ VERIFICATION PASSED! Vector dimension: ${vectorData.length}`
//         );
//       } else {
//         console.log(`❌ VERIFICATION FAILED! No vectors found in object!`);
//       }
//     } else {
//       console.log(`❌ VERIFICATION FAILED! No objects returned!`);
//     }

//     weaviateClient.close();
//   } catch (error) {
//     console.error("Error setting up collection:", error);
//     weaviateClient.close();
//   }
// }

// // Helper: Check if data exists
// async function checkData() {
//   try {
//     const questions = weaviateClient.collections.use("Question");
//     const result = await questions.query.fetchObjects({
//       limit: 5,
//       includeVector: true,
//     });

//     console.log(`✅ Found ${result.objects.length} items in database`);
//     if (result.objects.length > 0) {
//       console.log("\nSample data:");
//       result.objects.forEach((item, i) => {
//         console.log(`\n${i + 1}.`, JSON.stringify(item.properties, null, 2));
//         // Check both item.vectors.default AND item.vector (different Weaviate versions)
//         const vectorData = item.vectors?.default || item.vector;
//         if (vectorData) {
//           console.log(`   ✅ Vector dimension: ${vectorData.length}`);
//           console.log(
//             `   First 5 values: [${vectorData
//               .slice(0, 5)
//               .map((v) => v.toFixed(4))
//               .join(", ")}...]`
//           );
//         } else {
//           console.log(`   ⚠️ NO VECTOR STORED!`);
//         }
//       });
//     } else {
//       console.log("\n⚠️  Database is empty! Run setupCollection() first.");
//     }
//     weaviateClient.close();
//   } catch (error) {
//     console.error("Error checking data:", error.message);
//     console.log("\n⚠️  Collection doesn't exist! Run setupCollection() first.");
//     weaviateClient.close();
//   }
// }

// // Choose your mode:
// // 1. First time setup - run this ONCE to create and populate the collection
// // setupCollection();

// // 2. Check what data you have:
// // checkData();

// // 3. Then use conversational mode:
// // startConversation();

// // 4. Or single query mode:
// singleQuery();



// index.js - RAG Conversational System with Gemini Embeddings
import dotenv from "dotenv";
dotenv.config();
import weaviate from "weaviate-client";
import { GoogleGenAI } from "@google/genai";

// Initialize clients
const weaviateClient = await weaviate.connectToWeaviateCloud(
  process.env.WEAVIATE_URL,
  {
    authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
  }
);

const geminiAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Generate embedding using Gemini
async function generateEmbedding(text) {
  const response = await geminiAI.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });
  return response.embeddings[0].values;
}

// RAG function - retrieves and generates response
async function ragQuery(userQuestion, limit = 3) {
  try {
    const queryVector = await generateEmbedding(userQuestion);
    
    const questions = weaviateClient.collections.use("Question");
    const searchResults = await questions.query.nearVector(queryVector, {
      limit: limit,
      returnMetadata: ["distance"],
    });

    if (searchResults.objects.length === 0) {
      return {
        answer: "I couldn't find any relevant information in the database for your question. Please try rephrasing or ask something else!",
        sources: [],
      };
    }

    let context = "Here is relevant information from the database:\n\n";
    searchResults.objects.forEach((item, index) => {
      context += `Document ${index + 1}:\n`;
      context += JSON.stringify(item.properties, null, 2);
      context += "\n\n";
    });

    const prompt = `${context}

Based on the information above, please answer the following question in a conversational way:
${userQuestion}

If the information doesn't contain the answer, please say so and provide your best general knowledge response.`;

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return {
      answer: response.text,
      sources: searchResults.objects.map((obj) => obj.properties),
    };
  } catch (error) {
    console.error("Error in RAG query:", error);
    throw error;
  }
}

// Conversational loop
async function startConversation() {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🤖 RAG Chatbot initialized! Ask me anything (type 'exit' to quit)\n");

  const askQuestion = () => {
    rl.question("You: ", async (userInput) => {
      if (userInput.toLowerCase() === "exit") {
        console.log("Goodbye! 👋");
        rl.close();
        weaviateClient.close();
        return;
      }

      if (!userInput.trim()) {
        askQuestion();
        return;
      }

      try {
        const result = await ragQuery(userInput);
        console.log(`\n🤖 Assistant: ${result.answer}\n`);
      } catch (error) {
        console.log("❌ Error:", error.message);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Run the chatbot
startConversation();