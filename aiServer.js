import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fetch from "node-fetch";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to extract text using pdfjs-dist
async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const pdfBuffer = await response.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(" ") + "\n";
  }

  return fullText;
}

app.post("/api/analyze", async (req, res) => {
  const { prompt, pdfUrl } = req.body;

  if (!prompt || !pdfUrl) {
    return res.status(400).json({ result: "Missing prompt or PDF URL." });
  }

  try {
    const extractedText = await extractTextFromPdf(pdfUrl);

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
    console.error("AI server error:", err);
    res.status(500).json({ result: "Error processing prompt." });
  }
});

app.listen(port, () => {
  console.log(`✅ AI server is running on port ${port}`);
});
