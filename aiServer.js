import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fetch from "node-fetch";
import pdfParse from "pdf-parse";
// Triggering redeploy
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/analyze", async (req, res) => {
  const { prompt, pdfUrl } = req.body;

  if (!prompt || !pdfUrl) {
    return res.status(400).json({ result: "Missing prompt or PDF URL." });
  }

  try {
    // ✅ Download the PDF from URL and extract text
    const response = await fetch(pdfUrl);
    const pdfBuffer = await response.arrayBuffer();
    const data = await pdfParse(Buffer.from(pdfBuffer)); // ✅ This is the correct usage
    const extractedText = data.text;

    // ✅ Send to OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an assistant that analyzes uploaded PDF content.",
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
    console.error("AI server error:", err.message);
    res.status(500).json({ result: "Error processing prompt." });
  }
});

app.listen(port, () => {
  console.log(`✅ AI server is running on port ${port}`);
});
