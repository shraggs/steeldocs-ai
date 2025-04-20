import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import pdf from "pdf-parse";
import { OpenAI } from "openai";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/analyze", async (req, res) => {
  const { prompt, pdfUrl } = req.body;

  if (!prompt || !pdfUrl) {
    return res.status(400).json({ result: "Missing prompt or pdfUrl." });
  }

  try {
    // Step 1: Fetch the PDF from Firebase Storage
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("Failed to fetch the PDF file.");
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Step 2: Extract text from the PDF
    const data = await pdf(pdfBuffer);
    const extractedText = data.text;

    // Step 3: Call OpenAI with the prompt + extracted text
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You're an assistant that analyzes uploaded PDF content.",
        },
        {
          role: "user",
          content: `Prompt: ${prompt}\n\nPDF Text:\n${extractedText}`,
        },
      ],
      temperature: 0.3,
    });

    const result = aiResponse.choices[0]?.message?.content?.trim() || "No response.";
    res.json({ result });

  } catch (err) {
    console.error("AI analysis error:", err);
    res.status(500).json({ result: "AI server error." });
  }
});

app.listen(port, () => {
  console.log(`✅ AI server is running on port ${port}`);
});