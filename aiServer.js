const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// PDF text extraction using pdfjs-dist (CommonJS style)
async function extractTextFromPdf(url) {
  const response = await fetch(url);
  const pdfBuffer = await response.arrayBuffer();

  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
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

// API endpoint for analyzing PDFs with AI
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
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes PDF content.',
        },
        {
          role: 'user',
          content: `${prompt}\n\nPDF Content:\n${extractedText}`,
        },
      ],
      temperature: 0.7,
    });

    const result = aiResponse.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    console.error('Error during analysis:', error.message);
    res.status(500).json({ result: 'Error processing prompt.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`AI Server running on port ${port}`);
});
