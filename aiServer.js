import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import openaiPkg from 'openai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import dotenv from 'dotenv';

dotenv.config();

const { Configuration, OpenAIApi } = openaiPkg;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Function to extract text from a PDF using pdfjs-dist
async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const pdfBuffer = await response.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return fullText;
}

app.post('/api/analyze', async (req, res) => {
  const { prompt, pdfUrl } = req.body;

  if (!prompt || !pdfUrl) {
    return res.status(400).json({ result: 'Missing prompt or PDF URL.' });
  }

  try {
    const extractedText = await extractTextFromPdf(pdfUrl);

    const aiResponse = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that reads PDF content and answers questions based on it.' },
        { role: 'user', content: `${prompt}\n\n${extractedText}` },
      ],
    });

    const result = aiResponse.data.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    console.error('AI server error:', error.message);
    res.status(500).json({ result: 'Error processing prompt.' });
  }
});

app.listen(port, () => {
  console.log(`AI Server running on port ${port}`);
});
