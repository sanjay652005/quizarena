const Groq = require('groq-sdk');
const Question = require('../models/Question');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Calls the Groq API (llama-3.3-70b) to generate 10 MCQs for the given topic,
 * parses the response, persists them to MongoDB, and returns the docs.
 *
 * @param {string} topic  - Quiz subject (e.g. "World War II", "JavaScript closures")
 * @param {string} roomId - MongoDB ObjectId of the Room this quiz belongs to
 * @returns {Array<Question>} Saved Question documents
 */
const generateQuiz = async (topic, roomId) => {
  // ── 1. Build the prompt ───────────────────────────────────────────────────
  const prompt = `You are a quiz master. Generate exactly 10 multiple-choice questions about: "${topic}".

RULES:
- Each question must have exactly 4 options (A, B, C, D).
- Only one option is correct.
- Include a brief explanation for the correct answer.
- Vary difficulty: 3 easy, 4 medium, 3 hard.
- Questions must be factually accurate.
- Do NOT repeat similar questions.

Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble, no code fences.

JSON format:
[
  {
    "questionText": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Option A is correct because...",
    "difficulty": "easy"
  }
]`;

  // ── 2. Call Groq API ──────────────────────────────────────────────────────
  let rawContent;
  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator. You always respond with valid JSON arrays only. No markdown, no extra text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) throw new Error('Empty response from Groq');

  } catch (err) {
    logger.error(`Groq API error: ${err.message}`);
    throw new AppError('AI question generation failed. Please try again.', 502);
  }

  // ── 3. Parse JSON safely ──────────────────────────────────────────────────
  let questions;
  try {
    // Strip any accidental markdown fences just in case
    const cleaned = rawContent
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Find the JSON array in the response
    const jsonStart = cleaned.indexOf('[');
    const jsonEnd   = cleaned.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON array found');

    questions = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  } catch (parseErr) {
    logger.error(`Failed to parse Groq response: ${rawContent}`);
    throw new AppError('AI returned an unexpected format. Please try again.', 502);
  }

  // ── 4. Validate structure ─────────────────────────────────────────────────
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('AI returned no questions. Please try again.', 502);
  }

  // ── 5. Persist to MongoDB ─────────────────────────────────────────────────
  const questionDocs = questions.map((q) => ({
    topic,
    roomId,
    questionText: q.questionText,
    options: q.options.map((text, idx) => ({
      text,
      isCorrect: idx === q.correctOptionIndex,
    })),
    correctOptionIndex: q.correctOptionIndex,
    explanation: q.explanation || null,
    difficulty: q.difficulty || 'medium',
    aiGenerated: true,
  }));

  const saved = await Question.insertMany(questionDocs);
  logger.info(`Generated and saved ${saved.length} questions for topic "${topic}" using Groq`);
  return saved;
};

module.exports = { generateQuiz };
