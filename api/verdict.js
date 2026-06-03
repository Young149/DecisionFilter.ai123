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
  export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { dilemma, answers } = req.body;
  if (!dilemma || !answers) return res.status(400).json({ error: "missing fields" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  const answersText = answers.map(a => `Q: ${a.question}\nA: ${a.answer || "none"}`).join("\n\n");
  const prompt = `You are a decisive buying advisor.\n\nDilemma: "${dilemma}"\n\nAnswers:\n${answersText}\n\nGive ONE definitive product recommendation. Respond ONLY with JSON:\n{"dilemma":"...","category":"...","product":"Exact Model Name","tagline":"...","reasons":["...","...","..."],"tradeoff":"...","chosen_because":"...","alternatives":[{"product":"...","reason":"..."},{"product":"...","reason":"..."}],"confidence":85}`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "No response" });
    return res.status(200).json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (e) { return res.status(500).json({ error: String(e) }); }
  }
