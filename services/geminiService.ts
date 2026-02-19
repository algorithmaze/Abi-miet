import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question, Difficulty, StudyTask, ExamType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const LATEX_INSTRUCTION = "CRITICAL: Use LaTeX for ALL mathematical expressions, scientific formulas, and symbols. Use $...$ for inline math and $$...$$ for block math. Example: $E=mc^2$ or $\\frac{a}{b}$. Avoid plain text for formulas.";

// Helper to clean JSON string if model wraps it in markdown
const cleanJson = (text: string) => {
  return text.replace(/^```json\n/, '').replace(/\n```$/, '').trim();
};

export const generateQuestion = async (
  topic: string,
  difficulty: Difficulty,
  examType: ExamType
): Promise<Question> => {
  const modelId = "gemini-2.0-flash";

  let promptContext = "";
  if (examType === 'JEE') {
    promptContext = "The question should be suitable for the Joint Entrance Examination (JEE) for engineering aspirants. Focus on Physics, Chemistry, or Mathematics concepts at a high school/pre-university level.";
  } else if (examType === 'NEET') {
    promptContext = "The question should be suitable for the National Eligibility cum Entrance Test (NEET) for medical aspirants. Focus on Biology, Physics, or Chemistry.";
  } else if (examType === 'UPSC') {
    promptContext = "The question should be suitable for the Union Public Service Commission (UPSC) Civil Services Preliminary exam. Focus on General Studies, History, Polity, Geography, or Current Affairs.";
  } else {
    promptContext = "Academic knowledge for competitive exams.";
  }

  const prompt = `
    Generate a single multiple-choice question about "${topic}".
    Context: ${promptContext}
    Difficulty Level: ${difficulty}.
    ${LATEX_INSTRUCTION}
    
    Ensure the question tests conceptual understanding and critical thinking appropriate for the ${examType} exam.
    Return strictly valid JSON.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          correctIndex: { type: Type.INTEGER, description: "0-based index of the correct option" },
          explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct" },
          topic: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
        },
        required: ["question", "options", "correctIndex", "explanation", "topic", "difficulty"]
      }
    }
  });

  const rawText = response.text || "{}";
  console.log("Raw API Response:", rawText);
  if (rawText === "{}") {
    console.error("Empty response from AI model");
    throw new Error("Empty response from AI");
  }
  const data = JSON.parse(cleanJson(rawText));

  return {
    id: crypto.randomUUID(),
    text: data.question,
    options: data.options,
    correctIndex: data.correctIndex,
    explanation: data.explanation,
    difficulty: data.difficulty as Difficulty,
    topic: data.topic,
    examType: examType
  };
};

export const generateStudyPlan = async (
  goal: string,
  days: number,
  hoursPerDay: number
): Promise<StudyTask[]> => {
  const modelId = "gemini-2.0-flash";

  const prompt = `
    Create a ${days}-day study plan for a student who wants to master "${goal}".
    They have ${hoursPerDay} hours per day.
    Return strictly valid JSON.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING, description: "e.g., Day 1" },
            focus: { type: Type.STRING, description: "Main topic of the day" },
            tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["day", "focus", "tasks"]
        }
      }
    }
  });

  const rawText = response.text || "[]";
  return JSON.parse(cleanJson(rawText));
};

export const getDoubtSolution = async (history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  // We use chat for doubts
  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
    history: history,
    config: {
      systemInstruction: `You are an expert tutor for JEE, NEET, and UPSC exams. 
            CRITICAL RULES:
            1. ONLY answer questions related to JEE (Physics, Chemistry, Maths), NEET (Physics, Chemistry, Biology), or UPSC (History, Geography, Polity, Economics, Science, Environment).
            2. If a user asks anything general, non-academic, or unrelated to these exams (e.g., jokes, sports, entertainment, general conversation), politely steer them back to their studies. 
            3. Use LaTeX for ALL mathematical expressions ($...$ for inline, $$...$$ for block).
            4. Keep responses high-quality and textbook-like.`,
    }
  });

  // Logic is handled by the component using the chat object
  return "";
};

export const generateVoiceExplanation = async (text: string): Promise<string | undefined> => {
  const modelId = "gemini-2.0-flash"; // Or another valid multimodal/audio model

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e: any) {
    console.error("Voice generation failed", e);
    console.error("Error details:", e?.message, e?.stack);
    return undefined;
  }
};