import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to extract text from PDF using pdfjs-dist
async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const pdfBuffer = await response.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return fullText;
}

// POST route to handle AI prompt and PDF analysis
app.post('/analyze-pdf', async (req, res) => {
  try {
    const { pdfUrl, prompt } = req.body;

    if (!pdfUrl || !prompt) {
      return res.status(400).json({ error: 'Missing pdfUrl or prompt' });
    }

    const pdfText = await extractTextFromPdf(pdfUrl);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that analyzes PDF documents.' },
        { role: 'user', content: `${prompt}\n\nPDF Content:\n${pdfText}` },
      ],
      temperature: 0.5,
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI server error:', error);
    res.status(500).json({ error: 'Error processing prompt.' });
  }
});

app.listen(port, () => {
  console.log(`AI server is running on port ${port}`);
});
