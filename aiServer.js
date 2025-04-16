const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/analyze", async (req, res) => {
  const { prompt, text } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a document analysis assistant." },
        { role: "user", content: `${prompt}\n\nDocument Text:\n${text}` },
      ],
      temperature: 0.2,
    });

    const result = response.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to analyze document." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AI Server running on port ${PORT}`));