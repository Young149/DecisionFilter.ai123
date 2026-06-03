import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dilemma } = req.body;
  if (!dilemma) {
    return res.status(400).json({ error: "dilemma is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const prompt = `You are a sharp buying advisor. A user has this purchasing dilemma: "${dilemma}"

Generate exactly 3 clarifying questions that will help you make a decisive recommendation. These should be short, specific questions that eliminate options quickly.

Respond ONLY with a JSON object in this exact format, no preamble, no markdown:
{
  "questions": [
    {"id": "q1", "question": "...", "placeholder": "e.g. ..."},
    {"id": "q2", "question": "...", "placeholder": "e.g. ..."},
    {"id": "q3", "question": "...", "placeholder": "e.g. ..."}
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
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
    return res.status(500).json({ error: "Failed to generate questions" });
  }
}
