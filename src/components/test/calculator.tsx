"use client";

import { useState } from "react";
import { X, Delete } from "lucide-react";

export function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const input = (digit: string) => {
    if (fresh) { setDisplay(digit); setFresh(false); }
    else if (display.length < 15) setDisplay(display + digit);
  };

  const decimal = () => {
    if (fresh) { setDisplay("0."); setFresh(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const operate = (nextOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op && !fresh) {
      let result = 0;
      switch (op) {
        case "+": result = prev + current; break;
        case "-": result = prev - current; break;
        case "×": result = prev * current; break;
        case "÷": result = current !== 0 ? prev / current : 0; break;
      }
      const str = Number.isInteger(result) ? String(result) : result.toFixed(8).replace(/\.?0+$/, "");
      setDisplay(str);
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setFresh(true);
  };

  const equals = () => {
    if (prev === null || !op) return;
    operate("=");
    setOp(null);
  };

  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setFresh(true); };
  const backspace = () => {
    if (display.length <= 1 || fresh) { setDisplay("0"); setFresh(true); }
    else setDisplay(display.slice(0, -1));
  };
  const negate = () => {
    if (display !== "0") setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  };

  const Btn = ({ label, onClick, span, bg, color }: { label: string; onClick: () => void; span?: number; bg?: string; color?: string }) => (
    <button type="button" onClick={onClick}
      className="flex items-center justify-center rounded-xl text-sm font-semibold transition-all active:scale-95"
      style={{
        gridColumn: span ? `span ${span}` : undefined,
        background: bg || "#f5f5f5",
        color: color || "#111",
        height: "48px",
        border: "none",
        fontSize: "1rem",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = bg ? "#1a8a4a" : "#eee"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = bg || "#f5f5f5"; }}>
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #eee", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: "280px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid #f3f3f3" }}>
        <span className="text-xs font-semibold" style={{ color: "#888" }}>JAMB Calculator</span>
        <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-md" style={{ color: "#aaa" }}><X className="h-3.5 w-3.5" /></button>
      </div>

      {/* Display */}
      <div className="px-4 py-3 text-right" style={{ background: "#fafafa" }}>
        {op && prev !== null && (
          <p className="text-[0.625rem] mb-0.5" style={{ color: "#bbb" }}>{prev} {op}</p>
        )}
        <p className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{display}</p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5 p-3">
        <Btn label="C" onClick={clear} bg="#fee2e2" color="#ef4444" />
        <Btn label="+/−" onClick={negate} />
        <Btn label="⌫" onClick={backspace} />
        <Btn label="÷" onClick={() => operate("÷")} bg={op === "÷" ? "#22c55e" : "#e0f2fe"} color={op === "÷" ? "#fff" : "#3b82f6"} />

        <Btn label="7" onClick={() => input("7")} />
        <Btn label="8" onClick={() => input("8")} />
        <Btn label="9" onClick={() => input("9")} />
        <Btn label="×" onClick={() => operate("×")} bg={op === "×" ? "#22c55e" : "#e0f2fe"} color={op === "×" ? "#fff" : "#3b82f6"} />

        <Btn label="4" onClick={() => input("4")} />
        <Btn label="5" onClick={() => input("5")} />
        <Btn label="6" onClick={() => input("6")} />
        <Btn label="−" onClick={() => operate("-")} bg={op === "-" ? "#22c55e" : "#e0f2fe"} color={op === "-" ? "#fff" : "#3b82f6"} />

        <Btn label="1" onClick={() => input("1")} />
        <Btn label="2" onClick={() => input("2")} />
        <Btn label="3" onClick={() => input("3")} />
        <Btn label="+" onClick={() => operate("+")} bg={op === "+" ? "#22c55e" : "#e0f2fe"} color={op === "+" ? "#fff" : "#3b82f6"} />

        <Btn label="0" onClick={() => input("0")} span={2} />
        <Btn label="." onClick={decimal} />
        <Btn label="=" onClick={equals} bg="#22c55e" color="#fff" />
      </div>


    </div>
  );
}