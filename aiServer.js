import express from "express";
import cors from "cors";
import fetch from "node-fetch";

// Dynamically import OpenAI SDK
const { Configuration, OpenAIApi } = await import("openai");

// Import pdfjs-dist using CommonJS-compatible workaround
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import worker from "pdfjs-dist/legacy/build/pdf.worker.js?worker";
pdfjsLib.GlobalWorkerOptions.workerSrc = worker;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Helper function to extract text using pdfjs-dist
async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const pdfBuffer = await response.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  const numPages = pdf.numPages;
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    fullText += pageText + "\n";
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

    const aiResponse = await openai.createChatCompletion({
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
