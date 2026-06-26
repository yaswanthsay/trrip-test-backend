const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateItinerary = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
You are a travel itinerary generator.

Convert this text into a structured travel itinerary:

${text}

Rules:
- Only travel content
- Day-wise format
- If not travel-related, reply: INVALID TRAVEL DOCUMENT
`;

    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    throw err;
  }
};

module.exports = generateItinerary;