// === aiServer.js ===
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { getDocument } from "pdfjs-dist";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: "https://steeldocs-ai.firebaseapp.com" }));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const pdfBuffer = await response.arrayBuffer();
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

app.post("/analyze", async (req, res) => {
  try {
    const { pdfUrl, prompt } = req.body;
    const text = await extractTextFromPdf(pdfUrl);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `${prompt}\n\n${text}` }
      ]
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "Error processing prompt" });
  }
});

app.listen(port, () => {
  console.log(`AI server is running on port ${port}`);
});
