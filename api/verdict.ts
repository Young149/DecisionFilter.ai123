import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { dilemma, answers } = req.body;
  if (!dilemma || !answers) return res.status(400).json({ error: "dilemma and answers are required" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  const answersText = answers.map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer || "No answer provided"}`).join("\n\n");
  const prompt = `You are a decisive buying advisor. A user needs help deciding:\n\nDilemma: "${dilemma}"\n\nTheir answers:\n${answersText}\n\nGive ONE definitive product recommendation. Be specific — name the exact model.\n\nRespond ONLY with a JSON object, no preamble, no markdown:\n{\n  "dilemma": "brief restatement",\n  "category": "product category",\n  "product": "Exact Product Name and Model",\n  "tagline": "one punchy line",\n  "reasons": ["reason 1", "reason 2", "reason 3"],\n  "tradeoff": "main tradeoff",\n  "chosen_because": "2-3 sentences",\n  "alternatives": [{"product": "Alt 1", "reason": "why it loses"}, {"product": "Alt 2", "reason": "why it loses"}],\n  "confidence": 85\n}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1500 } }),
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "No response from AI" });
    const clean = text.replace(/```json|```/g, "").trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate verdict" });
  }
}
