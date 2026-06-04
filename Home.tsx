import { useState } from "react";

type Screen = "input" | "loading" | "questions" | "verdict";
interface Question { id: string; question: string; placeholder: string; }
interface VerdictData {
  dilemma: string; category: string; product: string; tagline: string;
  reasons: string[]; tradeoff: string; chosen_because: string;
  alternatives: { product: string; reason: string }[]; confidence: number;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [dilemma, setDilemma] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!dilemma.trim()) return;
    setError("");
    setScreen("loading");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dilemma }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
      const init: Record<string, string> = {};
      data.questions.forEach((q: Question) => { init[q.id] = ""; });
      setAnswers(init);
      setScreen("questions");
    } catch {
      setError("Something went wrong. Please try again.");
      setScreen("input");
    }
  };

  const handleVerdict = async () => {
    setScreen("loading");
    try {
      const res = await fetch("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemma,
          answers: questions.map(q => ({ question: q.question, answer: answers[q.id] || "" })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerdict(data);
      setScreen("verdict");
    } catch {
      setError("Failed to get verdict. Try again.");
      setScreen("questions");
    }
  };

  const reset = () => {
    setScreen("input"); setDilemma(""); setQuestions([]);
    setAnswers({}); setVerdict(null); setError("");
  };

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh", fontFamily: "sans-serif", color: "#1A1816" }}>
      <header style={{ padding: "20px 28px", borderBottom: "1px solid #D8D3CB", position: "sticky", top: 0, background: "#F2EFE9", zIndex: 100 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>✦ DecisionFilter</div>
        <div style={{ fontSize: 12, color: "#6B6560" }}>The Anti-Slop Verdict Engine</div>
      </header>

      {screen === "input" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 28px" }}>
          <p style={{ fontSize: 24, marginBottom: 32, lineHeight: 1.4 }}>
            Describe what you're trying to buy. We'll ask a few questions, then give you one decisive recommendation.
          </p>
          {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
          <input
            type="text"
            value={dilemma}
            onChange={e => setDilemma(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="e.g. wireless headphones under $200..."
            style={{ width: "100%", padding: "12px 0", fontSize: 16, border: "none", borderBottom: "2px solid #1A1816", background: "transparent", outline: "none", marginBottom: 16 }}
          />
          <button onClick={handleSend} style={{ background: "#1A1816", color: "#F2EFE9", border: "none", padding: "12px 24px", fontSize: 14, cursor: "pointer", borderRadius: 2 }}>
            Send →
          </button>
        </div>
      )}

      {screen === "loading" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontSize: 14, color: "#6B6560" }}>
          Thinking…
        </div>
      )}

      {screen === "questions" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 28px" }}>
          <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>A few quick questions</p>
          {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
          {questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, color: "#6B6560", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Question {i + 1}</p>
              <p style={{ fontSize: 15, marginBottom: 10 }}>{q.question}</p>
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder={q.placeholder}
                style={{ width: "100%", padding: "8px 0", fontSize: 15, border: "none", borderBottom: "1.5px solid #D8D3CB", background: "transparent", outline: "none" }}
              />
            </div>
          ))}
          <button onClick={handleVerdict} style={{ background: "#1A1816", color: "#F2EFE9", border: "none", padding: "12px 24px", fontSize: 14, cursor: "pointer", borderRadius: 2 }}>
            Get My Verdict →
          </button>
        </div>
      )}

      {screen === "verdict" && verdict && (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 28px" }}>
          <p style={{ fontSize: 11, color: "#B0AA9F", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>Verdict · {verdict.category}</p>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>{verdict.product}</h1>
          <p style={{ fontSize: 15, color: "#6B6560", fontStyle: "italic", marginBottom: 24 }}>{verdict.tagline}</p>
          <div style={{ background: "#EDEAE3", padding: 20, borderRadius: 4, marginBottom: 24 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6560", marginBottom: 6 }}>Why this</p>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{verdict.chosen_because}</p>
          </div>
          <div style={{ marginBottom: 24 }}>
            {verdict.reasons.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <span style={{ color: "#B0AA9F", fontSize: 11, paddingTop: 2 }}>0{i + 1}</span>
                <span style={{ fontSize: 14, color: "#C0392B", fontWeight: 500 }}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#1A1816", color: "#F2EFE9", padding: 20, borderRadius: 4, marginBottom: 24 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Key tradeoff</p>
            <p style={{ fontSize: 14 }}>{verdict.tradeoff}</p>
          </div>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Why not alternatives?</p>
            {verdict.alternatives.map((a, i) => (
              <p key={i} style={{ fontSize: 14, marginBottom: 8 }}><strong>{a.product}</strong> — {a.reason}</p>
            ))}
          </div>
          <button onClick={reset} style={{ background: "transparent", border: "1.5px solid #1A1816", padding: "12px 24px", fontSize: 13, cursor: "pointer", borderRadius: 2 }}>
            → Start over
          </button>
        </div>
      )}
    </div>
  );
    }
