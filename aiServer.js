import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Dynamically import pdfjs-dist for CommonJS compatibility
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');

// Function to extract text from a PDF URL
async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n';
  }

  return text;
}

// Endpoint for handling AI calls
app.post('/api/call-ai', async (req, res) => {
  const { pdfUrl, prompt } = req.body;

  try {
    const extractedText = await extractTextFromPdf(pdfUrl);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts relevant information from documents.' },
        { role: 'user', content: `${prompt}\n\nPDF content:\n${extractedText}` }
      ],
      temperature: 0.7
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ error: 'Error processing prompt.' });
  }
});

app.listen(port, () => {
  console.log(`AI server is running on port ${port}`);
});
