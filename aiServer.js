import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { Configuration, OpenAIAPI } from 'openai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIAPI(configuration);

// Helper function to extract text from PDF using pdfjs-dist
async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str).join(' ');
    fullText += strings + '\n';
  }

  return fullText;
}

// API route for prompt + PDF analysis
app.post('/api/analyze', async (req, res) => {
  const { prompt, pdfUrl } = req.body;

  if (!prompt || !pdfUrl) {
    return res.status(400).json({ result: 'Missing prompt or PDF URL.' });
  }

  try {
    const extractedText = await extractTextFromPdf(pdfUrl);

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `${prompt}\n\n${extractedText}` },
      ],
    });

    const reply = aiResponse.choices?.[0]?.message?.content || 'No response.';
    res.json({ result: reply });
  } catch (error) {
    console.error('Error processing AI request:', error.message);
    res.status(500).json({ result: 'Error processing prompt.' });
  }
});

// Launch server
app.listen(port, () => {
  console.log(`AI server is running on port ${port}`);
});
