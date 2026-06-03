export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { dilemma } = req.body;
  if (!dilemma) return res.status(400).json({ error: "dilemma is required" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  const prompt = `You are a sharp buying advisor. Dilemma: "${dilemma}". Generate exactly 3 clarifying questions. Respond ONLY with JSON: {"questions": [{"id": "q1", "question": "...", "placeholder": "e.g. ..."}, {"id": "q2", "question": "...", "placeholder": "e.g. ..."}, {"id": "q3", "question": "...", "placeholder": "e.g. ..."}]}`;
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
