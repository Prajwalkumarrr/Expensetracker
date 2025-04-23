import React from "react";
import "../styles/Dashboard.css";

export const UserProfileCard = ({ user }) => (
  <div className="user-profile-card" style={{
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
    background: "linear-gradient(120deg, #232946 60%, #4a6aff 100%)",
    borderRadius: 18,
    padding: 18,
    color: "#a5ffd6",
    boxShadow: "0 4px 24px rgba(74,106,255,0.13)",
    border: "1.5px solid #4a6aff",
    maxWidth: 420,
    margin: "0 auto 28px auto"
  }}>
    <img
      src={user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)}
      alt="avatar"
      style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid #a5ffd6" }}
    />
    <div>
      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#a5ffd6" }}>{user.name}</div>
      <div style={{ fontSize: "0.95rem", color: "#bfcfff" }}>Welcome back!</div>
    </div>
  </div>
);

const AISuggestions = ({
  expenses = [],
  income = 0,
  netWorth = null,
  savingsGoal = null,
  user = { name: "User", avatar: null },
  motivationalQuote = "Believe in yourself and all that you are.",
  petImage = null,
  onQuickAction = () => {},
}) => {
  // --- Dummy AI Logic ---
  const monthlyTotals = {};
  expenses.forEach((exp) => {
    const date = new Date(exp.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + exp.amount;
  });

  // Calculate total expenses for just the filtered year
  const totalYearlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Only use months present in the filtered expenses
  const months = expenses.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${d.getMonth()}`;
  });
  const uniqueMonths = [...new Set(months)];
  const last3Months = uniqueMonths.slice(-3).map(key => monthlyTotals[key] || 0);

  const avgMonthly =
    last3Months.length > 0
      ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
      : 0;

  const getNextMonthName = () => {
    if (expenses.length === 0) return "Next Month";
    const last = expenses.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    const next = new Date(last.date);
    next.setMonth(next.getMonth() + 1);
    return next.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Dummy suggestions
  const suggestions = [
    "Try cooking at home more often to save on food costs.",
    "Consider negotiating a raise or exploring freelance opportunities.",
    "Review your subscription services for potential savings.",
  ];
  const incomeSuggestion =
    income < avgMonthly
      ? "Your income is less than your average monthly spending. Consider ways to increase income."
      : "Your income covers your spending. Keep it up!";

  // Dummy progress (for savings goal)
  const savingsProgress = savingsGoal
    ? Math.min(100, Math.round(((income - avgMonthly) / savingsGoal) * 100))
    : null;

  // Utility: Format INR currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  // --- UI ---
  return (
    <div
      className="ai-insights-panel"
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: "linear-gradient(120deg, #181c2f 60%, #232946 100%)",
        border: "1.5px solid #ffd166",
        color: "#f3f6fa"
      }}
    >
      <h3
        style={{
          fontWeight: 700,
          fontSize: "1.2rem",
          marginBottom: "1rem",
          letterSpacing: "0.01em",
          color: "#ffd166"
        }}
      >
        🔮 AI Suggestions & Predictions
      </h3>
      <div style={{ marginBottom: "1.2rem" }}>
        <span style={{ fontWeight: 500 }}>
          Based on your spending trend, you might spend{" "}
          <span style={{ color: "#ffd166" }}>
            {formatCurrency(avgMonthly || 15000)}
          </span>{" "}
          in {getNextMonthName()}.
        </span>
      </div>
      {suggestions.map((s, idx) => (
        <div key={idx} className="ai-insight-tip" style={{ color: "#a5ffd6" }}>{s}</div>
      ))}
      <div className="ai-insight-tip" style={{ color: "#a5ffd6" }}>{incomeSuggestion}</div>
      <div className="ai-insight-note" style={{ color: "#bfcfff" }}>
        💡 These are AI-generated insights based on your recent activity.
      </div>
      {/* Motivational Quote / Fun Widget */}
      <div style={{ marginTop: 18, background: "rgba(255,209,102,0.10)", borderRadius: 10, padding: 10, color: "#ffd166", fontStyle: "italic", fontSize: "1.02rem", textAlign: "center" }}>
        {motivationalQuote}
      </div>
      {petImage && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <img src={petImage} alt="pet" style={{ width: 54, height: 54, borderRadius: "50%", border: "2px solid #ffd166" }} />
        </div>
      )}
    </div>
  );
};

export default AISuggestions;