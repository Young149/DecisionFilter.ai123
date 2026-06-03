import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dilemma, answers } = req.body;
  if (!dilemma || !answers) {
    return res.status(400).json({ error: "dilemma and answers are required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const answersText = answers
    .map((a: { question: string; answer: string }) =>
      `Q: ${a.question}\nA: ${a.answer || "No answer provided"}`
    )
    .join("\n\n");

  const prompt = `You are a decisive buying advisor. A user needs help deciding:

Dilemma: "${dilemma}"

Their answers to clarifying questions:
${answersText}

Give ONE definitive product recommendation. Be specific — name the exact product model.

Respond ONLY with a JSON object in this exact format, no preamble, no markdown:
{
  "dilemma": "brief restatement of their dilemma",
  "category": "product category (e.g. Headphones, Laptop, Camera)",
  "product": "Exact Product Name and Model",
  "tagline": "one punchy italic line about why this is the one",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "tradeoff": "the main thing they give up by choosing this",
  "chosen_because": "2-3 sentences explaining why this specifically fits their situation",
  "alternatives": [
    {"product": "Alternative 1", "reason": "why it loses"},
    {"product": "Alternative 2", "reason": "why it loses"}
  ],
  "confidence": 85
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "No response from AI" });

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate verdict" });
  }
}
