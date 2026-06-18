const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/chat", async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    const response = await client.chat.completions.create({
   model: "llama-3.3-70b-versatile",  // ✅ latest working model
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("Groq Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;