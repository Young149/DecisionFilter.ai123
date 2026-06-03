import { useState, useRef } from "react";

type Screen = "input" | "loading" | "questions" | "verdict";

interface Question {
  id: string;
  question: string;
  placeholder: string;
}

interface Alternative {
  product: string;
  reason: string;
}

interface VerdictData {
  dilemma: string;
  category: string;
  product: string;
  tagline: string;
  reasons: string[];
  tradeoff: string;
  chosen_because: string;
  alternatives: Alternative[];
  confidence: number;
}

const EXAMPLES = [
  "Wireless headphones for daily commute, max $300, comfort matters",
  "Need a laptop for software dev + occasional gaming, ~$1800",
  "Best mirrorless camera for travel vlogs under $1500",
  "Mechanical keyboard for long coding sessions, quiet office",
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [dilemma, setDilemma] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!dilemma.trim() || dilemma.trim().length < 5) {
      setError("Please describe your dilemma (at least 5 characters).");
      return;
    }
    setError("");
    setScreen("loading");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dilemma: dilemma.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setQuestions(data.questions as Question[]);
      const initAnswers: Record<string, string> = {};
      (data.questions as Question[]).forEach((q: Question) => {
        initAnswers[q.id] = "";
      });
      setAnswers(initAnswers);
      setScreen("questions");
    } catch {
      setError("Something went wrong. Please try again.");
      setScreen("input");
    }
  };

  const handleSubmitAnswers = async () => {
    const answeredQuestions = questions.map((q) => ({
      question: q.question,
      answer: answers[q.id] || "",
    }));
    setScreen("loading");

    try {
      const res = await fetch("/api/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dilemma, answers: answeredQuestions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setVerdict(data as VerdictData);
      setScreen("verdict");
    } catch {
      setError("Failed to generate verdict. Please try again.");
      setScreen("questions");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setScreen("input");
    setDilemma("");
    setQuestions([]);
    setAnswers({});
    setVerdict(null);
    setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--sans)", minHeight: "100vh" }}>
      {/* HEADER */}
      <header style={{
        padding: "20px 28px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "var(--bg)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--ink-muted)", textTransform: "uppercase" }}>
            DecisionFilter // V1
          </span>
          <span style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
            The Anti-Slop Verdict Engine
          </span>
        </div>
      </header>

      {/* INPUT SCREEN */}
      {screen === "input" && (
        <div style={{ padding: "48px 28px 40px", maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 28, lineHeight: 1.35, fontWeight: 400, color: "var(--ink)", marginBottom: 48, maxWidth: 480 }}>
            Describe what you're trying to buy. We'll ask up to three sharp questions, then commit to <em>one</em> recommendation you can stop second-guessing.
          </p>

          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 14 }}>
            Try one
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 48 }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setDilemma(ex)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 100,
                  padding: "12px 20px",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: "var(--ink-muted)",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  textAlign: "center",
                  lineHeight: 1.4,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "var(--ink-muted)";
                  (e.target as HTMLButtonElement).style.color = "var(--ink)";
                  (e.target as HTMLButtonElement).style.background = "var(--surface)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.target as HTMLButtonElement).style.color = "var(--ink-muted)";
                  (e.target as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 12 }}>
            Your turn
          </p>

          {error && (
            <div style={{
              background: "#FFF5F5",
              border: "1px solid #FFCDD2",
              borderRadius: 3,
              padding: "16px 20px",
              fontSize: 13,
              color: "var(--accent-dark)",
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "flex-end", gap: 0, borderBottom: "2px solid var(--ink)", paddingBottom: 10, marginBottom: 24 }}>
            <input
              ref={inputRef}
              type="text"
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I need wireless headphones under $200…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--sans)",
                fontSize: 16,
                color: "var(--ink)",
                fontWeight: 300,
              }}
            />
            <button
              onClick={handleSend}
              style={{
                background: "var(--ink)",
                color: "var(--bg)",
                border: "none",
                padding: "10px 20px",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              Send →
            </button>
          </div>

          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--ink-faint)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--accent)" }}>✦</span> Powered by Gemini · Decisions only
          </p>
        </div>
      )}

      {/* LOADING SCREEN */}
      {screen === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 61px)", gap: 20 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 200, 400].map((delay) => (
              <div
                key={delay}
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--ink)",
                  borderRadius: "50%",
                  animation: `pulse 1.2s ease-in-out ${delay}ms infinite`,
                }}
              />
            ))}
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--ink-muted)", textTransform: "uppercase" }}>
            Eliminating bad fits…
          </p>
          <style>{`
            @keyframes pulse {
              0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* QUESTIONS SCREEN */}
      {screen === "questions" && (
        <div style={{ padding: "48px 28px", maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 400, color: "var(--ink)", marginBottom: 6 }}>
            A few quick questions
          </p>
          <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-muted)", fontWeight: 300, marginBottom: 32 }}>
            Answering these helps eliminate bad fits faster.
          </p>

          {error && (
            <div style={{
              background: "#FFF5F5",
              border: "1px solid #FFCDD2",
              borderRadius: 3,
              padding: "16px 20px",
              fontSize: 13,
              color: "var(--accent-dark)",
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                Question {i + 1}
              </p>
              <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--ink)", fontWeight: 400, marginBottom: 12, lineHeight: 1.5 }}>
                {q.question}
              </p>
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder={q.placeholder}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1.5px solid var(--border)",
                  outline: "none",
                  padding: "8px 0",
                  fontFamily: "var(--sans)",
                  fontSize: 15,
                  color: "var(--ink)",
                  fontWeight: 300,
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = "var(--ink)")}
                onBlur={(e) => (e.target.style.borderBottomColor = "var(--border)")}
              />
            </div>
          ))}

          <button
            onClick={handleSubmitAnswers}
            style={{
              background: "var(--ink)",
              color: "var(--bg)",
              border: "none",
              padding: "14px 28px",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: 2,
              marginTop: 8,
            }}
          >
            Get My Verdict →
          </button>
        </div>
      )}

      {/* VERDICT SCREEN */}
      {screen === "verdict" && verdict && (
        <div style={{ padding: "40px 28px", maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 8 }}>
            The Dilemma
          </p>
          <p style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, color: "var(--ink)", marginBottom: 32, lineHeight: 1.3 }}>
            {verdict.dilemma}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button
              onClick={copyShareLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "1px solid var(--border)",
                padding: "8px 16px",
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                cursor: "pointer",
                borderRadius: 2,
              }}
            >
              ⬡ Copy verdict link
            </button>
            {copied && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--accent)", textTransform: "uppercase" }}>
                Copied.
              </span>
            )}
          </div>

          <div style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: 32,
            marginBottom: 40,
            animation: "fadeUp 0.4s ease forwards",
          }}>
            <style>{`
              @keyframes fadeUp {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 6 }}>
              Verdict · {verdict.category}
            </p>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 40, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1, marginBottom: 8, letterSpacing: "-0.02em" }}>
              {verdict.product}
            </h2>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic", color: "var(--ink-muted)", marginBottom: 20 }}>
              {verdict.tagline}
            </p>

            <div style={{ background: "var(--surface)", borderRadius: 3, padding: "14px 18px", marginBottom: 28 }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 6 }}>
                Chosen because
              </p>
              <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)", lineHeight: 1.5, fontWeight: 400 }}>
                {verdict.chosen_because}
              </p>
            </div>

            <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 28 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start", marginBottom: 28 }}>
              <div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.16em", color: "var(--ink)", textTransform: "uppercase", fontWeight: 500, marginBottom: 16 }}>
                  Why this choice
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                  {verdict.reasons.map((reason, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-faint)", paddingTop: 2, flexShrink: 0 }}>
                        0{i + 1}
                      </span>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--accent)", fontWeight: 500, lineHeight: 1.4 }}>
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ background: "var(--ink)", color: "var(--bg)", padding: "20px", borderRadius: 3, minWidth: 170, maxWidth: 210 }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ffffff", fontWeight: 500, marginBottom: 10 }}>
                  Key Tradeoff
                </p>
                <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--bg)", lineHeight: 1.5, fontWeight: 300 }}>
                  {verdict.tradeoff}
                </p>
              </div>
            </div>

            {verdict.alternatives && verdict.alternatives.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginBottom: 24 }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.16em", color: "var(--ink)", textTransform: "uppercase", fontWeight: 500, marginBottom: 16 }}>
                  Why not alternatives?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {verdict.alternatives.map((alt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", border: "1.5px solid var(--ink-faint)", marginTop: 4 }} />
                      </div>
                      <div>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                          {alt.product}
                        </span>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-muted)", fontWeight: 300 }}>
                          {" "}— {alt.reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <p style={{ fontFamily: "var(--serif)", fontSize: 18, fontStyle: "italic", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                — Stop researching.
              </p>
              {verdict.confidence != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 80, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${verdict.confidence}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-muted)", textTransform: "uppercase" }}>
                    {verdict.confidence}% confidence
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 36 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.2em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 10 }}>
              Your Turn
            </p>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, color: "var(--ink)", marginBottom: 10, lineHeight: 1.3 }}>
              Got a gadget dilemma of your own?
            </h3>
            <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-muted)", fontWeight: 300, marginBottom: 24, lineHeight: 1.5 }}>
              Skip the 47-tab research spiral. Get one decisive recommendation.
            </p>
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                border: "1.5px solid var(--ink)",
                padding: "13px 22px",
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink)",
                cursor: "pointer",
                borderRadius: 2,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--ink)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
              }}
            >
              → Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
