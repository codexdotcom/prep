"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  X, Save, Loader2, Upload, Trash2, Bold, Italic, Subscript, Superscript,
  CheckCircle2, AlertTriangle, Divide, Pencil, Grid3X3, Table2, Plus, Minus,
  Image as ImageIcon,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Topic {
  id: string;
  name: string;
  subject: string;
  subtopics: Array<{ id: string; name: string }>;
  _count: { questions: number };
}

export interface QuestionData {
  id?: string;
  subject: string;
  topicId: string;
  subtopicId?: string;
  year?: number | null;
  questionNumber?: number | null;
  body: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
  explanationImageUrl?: string | null;
  difficulty: string;
  isActive: boolean;
}

interface QuestionEditorProps {
  question: QuestionData | null;
  onClose: (saved: boolean) => void;
}

// ─── Render math + tables ───
function renderMath(text: string): string {
  if (!text) return '<span style="opacity:0.3">Empty</span>';

  // Tables: lines starting with |
  const lines = text.split("\n");
  let result = "";
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:0.8125rem">';
    tableRows.forEach((row, ri) => {
      // Skip separator rows (|---|---|)
      if (row.every((c) => /^[-:]+$/.test(c.trim()))) return;
      const tag = ri === 0 ? "th" : "td";
      const bg = ri === 0 ? "background:var(--color-surface-lighter);font-weight:600;" : ri % 2 === 0 ? "background:var(--color-surface-light);" : "";
      html += "<tr>";
      row.forEach((cell) => {
        html += `<${tag} style="border:1px solid var(--color-surface-border);padding:6px 10px;text-align:left;${bg}">${processMathInline(cell.trim())}</${tag}>`;
      });
      html += "</tr>";
    });
    html += "</table>";
    result += html;
    tableRows = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const cells = trimmed.slice(1, -1).split("|");
      tableRows.push(cells);
    } else {
      if (inTable) { flushTable(); inTable = false; }
      result += processLine(trimmed) + "\n";
    }
  }
  if (inTable) flushTable();

  return result;
}

function processLine(line: string): string {
  if (!line) return "<br/>";
  return processMathInline(line);
}

function processMathInline(text: string): string {
  let r = text;
  // Display math
  r = r.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try { return `<div style="margin:8px 0;text-align:center">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`; }
    catch { return `<span style="color:#ef4444;font-size:0.75rem">[math error]</span>`; }
  });
  // Inline math
  r = r.replace(/\$(.+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
    catch { return `<span style="color:#ef4444;font-size:0.75rem">[math error]</span>`; }
  });
  r = r.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return r;
}

// ─── Symbol categories ───
const MATH_BASICS = [
  { label: "Fraction", tex: "\\frac{a}{b}" },
  { label: "Square root", tex: "\\sqrt{x}" },
  { label: "Nth root", tex: "\\sqrt[n]{x}" },
  { label: "Power", tex: "x^{2}" },
  { label: "Subscript", tex: "x_{1}" },
  { label: "Plus/minus", tex: "\\pm" },
  { label: "Times", tex: "\\times" },
  { label: "Divide", tex: "\\div" },
  { label: "Not equal", tex: "\\neq" },
  { label: "Less/equal", tex: "\\leq" },
  { label: "Greater/equal", tex: "\\geq" },
  { label: "Approx", tex: "\\approx" },
  { label: "Infinity", tex: "\\infty" },
  { label: "Degree", tex: "^{\\circ}" },
  { label: "Arrow", tex: "\\rightarrow" },
  { label: "Therefore", tex: "\\therefore" },
  { label: "Perpendicular", tex: "\\perp" },
  { label: "Proportional", tex: "\\propto" },
];

const MATH_GREEK = [
  { label: "Alpha", tex: "\\alpha" }, { label: "Beta", tex: "\\beta" },
  { label: "Gamma", tex: "\\gamma" }, { label: "Delta", tex: "\\Delta" },
  { label: "Theta", tex: "\\theta" }, { label: "Lambda", tex: "\\lambda" },
  { label: "Mu", tex: "\\mu" }, { label: "Pi", tex: "\\pi" },
  { label: "Sigma", tex: "\\sigma" }, { label: "Omega", tex: "\\omega" },
  { label: "Phi", tex: "\\phi" }, { label: "Epsilon", tex: "\\epsilon" },
];

const MATH_FUNCTIONS = [
  { label: "sin", tex: "\\sin" }, { label: "cos", tex: "\\cos" },
  { label: "tan", tex: "\\tan" }, { label: "log", tex: "\\log" },
  { label: "ln", tex: "\\ln" }, { label: "log base", tex: "\\log_{b}" },
  { label: "Limit", tex: "\\lim_{x \\to a}" },
  { label: "Sum", tex: "\\sum_{i=1}^{n}" },
  { label: "Product", tex: "\\prod_{i=1}^{n}" },
  { label: "Integral", tex: "\\int_{a}^{b}" },
  { label: "Partial", tex: "\\partial" },
  { label: "Nabla", tex: "\\nabla" },
];

const MATH_MATRICES = [
  { label: "2×2 Matrix", tex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
  { label: "3×3 Matrix", tex: "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}" },
  { label: "2×2 Bracket", tex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
  { label: "3×3 Bracket", tex: "\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix}" },
  { label: "Determinant", tex: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}" },
  { label: "3×3 Det", tex: "\\begin{vmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{vmatrix}" },
  { label: "Column Vec", tex: "\\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}" },
  { label: "Row Vec", tex: "\\begin{pmatrix} x & y & z \\end{pmatrix}" },
  { label: "Augmented", tex: "\\left(\\begin{array}{cc|c} a & b & e \\\\ c & d & f \\end{array}\\right)" },
  { label: "System", tex: "\\begin{cases} ax + by = e \\\\ cx + dy = f \\end{cases}" },
  { label: "Identity 2×2", tex: "\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}" },
  { label: "Identity 3×3", tex: "\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}" },
];

type PaletteTab = "basics" | "greek" | "functions" | "matrices";

function preventBlur(e: React.MouseEvent) { e.preventDefault(); }

// ─── Table Builder Modal ───
function TableBuilder({ onInsert, onClose }: { onInsert: (table: string) => void; onClose: () => void }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);
  const [cells, setCells] = useState<string[][]>(() =>
    Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ""))
  );

  useEffect(() => {
    setCells((prev) => {
      const newCells: string[][] = [];
      for (let r = 0; r < rows; r++) {
        newCells.push([]);
        for (let c = 0; c < cols; c++) {
          newCells[r][c] = prev[r]?.[c] ?? "";
        }
      }
      return newCells;
    });
  }, [rows, cols]);

  const updateCell = (r: number, c: number, val: string) => {
    setCells((prev) => {
      const n = prev.map((row) => [...row]);
      n[r][c] = val;
      return n;
    });
  };

  const buildMarkdown = () => {
    let md = "";
    cells.forEach((row, ri) => {
      md += "| " + row.map((c) => c || " ").join(" | ") + " |\n";
      if (ri === 0 && hasHeader) {
        md += "| " + row.map(() => "---").join(" | ") + " |\n";
      }
    });
    return md.trim();
  };

  return (
    <div className="rounded-xl p-4 mb-2" style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }} onMouseDown={preventBlur}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Insert Table</p>
        <button type="button" onMouseDown={preventBlur} onClick={onClose} className="btn-ghost" style={{ padding: "2px" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Size controls */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Rows</span>
          <button type="button" onMouseDown={preventBlur} onClick={() => setRows(Math.max(1, rows - 1))} className="btn-ghost" style={{ padding: "2px" }}><Minus className="h-3 w-3" /></button>
          <span className="text-xs font-bold w-4 text-center" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{rows}</span>
          <button type="button" onMouseDown={preventBlur} onClick={() => setRows(Math.min(10, rows + 1))} className="btn-ghost" style={{ padding: "2px" }}><Plus className="h-3 w-3" /></button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Cols</span>
          <button type="button" onMouseDown={preventBlur} onClick={() => setCols(Math.max(1, cols - 1))} className="btn-ghost" style={{ padding: "2px" }}><Minus className="h-3 w-3" /></button>
          <span className="text-xs font-bold w-4 text-center" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{cols}</span>
          <button type="button" onMouseDown={preventBlur} onClick={() => setCols(Math.min(8, cols + 1))} className="btn-ghost" style={{ padding: "2px" }}><Plus className="h-3 w-3" /></button>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer ml-auto" onMouseDown={preventBlur}>
          <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="h-3 w-3 rounded accent-green-500" />
          <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Header row</span>
        </label>
      </div>

      {/* Editable grid */}
      <div className="overflow-x-auto mb-3">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            {cells.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "2px" }}>
                    <input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      onMouseDown={preventBlur}
                      placeholder={ri === 0 && hasHeader ? `Header ${ci + 1}` : ""}
                      className="w-full rounded-md px-2 py-1.5 text-xs"
                      style={{
                        background: ri === 0 && hasHeader ? "var(--color-surface-lighter)" : "var(--color-surface-card)",
                        border: "1px solid var(--color-surface-border)",
                        color: "var(--color-text-primary)",
                        fontWeight: ri === 0 && hasHeader ? 600 : 400,
                        minWidth: "60px",
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button type="button" onMouseDown={preventBlur} onClick={onClose} className="btn-secondary flex-1" style={{ fontSize: "0.75rem" }}>Cancel</button>
        <button type="button" onMouseDown={preventBlur} onClick={() => { onInsert(buildMarkdown()); onClose(); }}
          className="btn-primary flex-1" style={{ fontSize: "0.75rem" }}>
          <Table2 className="h-3 w-3" /> Insert
        </button>
      </div>
    </div>
  );
}

// ─── Image Uploader ───
function ImageUploader({ imageUrl, onUpload, onRemove, label }: {
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(imageUrl);
  const [error, setError] = useState("");

  useEffect(() => { setPreview(imageUrl); }, [imageUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed"); setPreview(null); return; }
      onUpload(data.url);
    } catch { setError("Upload failed"); setPreview(null); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="label">{label}</label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ background: "var(--color-surface-lighter)", border: "1px solid var(--color-surface-border)" }}>
          <img src={preview} alt="" className="mx-auto max-h-40 object-contain p-3" />
          <button type="button" onClick={() => { onRemove(); setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(239,68,68,0.9)", color: "white" }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-5 transition-all"
          style={{ background: "var(--color-surface-light)", border: "2px dashed var(--color-surface-border)", color: "var(--color-text-tertiary)" }}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Upload className="h-4 w-4" /><span className="text-xs">Upload image</span></>)}
        </button>
      )}
      {error && <p className="text-[0.5625rem] mt-1" style={{ color: "var(--color-danger-400)" }}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}

// ─── MathField ───
function MathField({
  id, value, onChange, placeholder, minRows, highlight,
}: {
  id: string; value: string; onChange: (val: string) => void; placeholder: string; minRows?: number; highlight?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [paletteTab, setPaletteTab] = useState<PaletteTab>("basics");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = () => {
    setEditing(true);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  };

  const stopEditing = () => { setEditing(false); setShowPalette(false); setShowTableBuilder(false); };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, (minRows || 1) * 24)}px`;
  };

  useEffect(() => { if (editing) autoResize(); }, [editing, value]);

  const insertAtCursor = (tex: string, useDisplay?: boolean) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const wrap = useDisplay ? `$$${tex}$$` : `$${tex}$`;
    onChange(`${before}${wrap}${after}`);
    requestAnimationFrame(() => { el.focus(); const pos = start + wrap.length; el.setSelectionRange(pos, pos); autoResize(); });
  };

  const insertRawAtCursor = (raw: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(el.selectionEnd);
    const needsNewline = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
    onChange(`${before}${needsNewline}${raw}\n${after}`);
    requestAnimationFrame(() => { el.focus(); autoResize(); });
  };

  const insertFormat = (format: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    let wrapped = "";
    switch (format) {
      case "bold": wrapped = `**${selected || "text"}**`; break;
      case "italic": wrapped = `*${selected || "text"}*`; break;
      case "inlinemath": wrapped = `$${selected || "x"}$`; break;
      case "displaymath": wrapped = `$$${selected || "\\frac{a}{b}"}$$`; break;
    }
    onChange(value.substring(0, start) + wrapped + value.substring(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + wrapped.length, start + wrapped.length); autoResize(); });
  };

  const getPaletteSymbols = () => {
    switch (paletteTab) {
      case "basics": return MATH_BASICS;
      case "greek": return MATH_GREEK;
      case "functions": return MATH_FUNCTIONS;
      case "matrices": return MATH_MATRICES;
    }
  };

  // Preview mode
  if (!editing) {
    return (
      <button type="button" onClick={startEditing} className="w-full text-left rounded-xl p-3 transition-all group relative"
        style={{ minHeight: `${Math.max((minRows || 1) * 24 + 8, 42)}px`, background: highlight ? "rgba(34,197,94,0.04)" : "var(--color-surface-light)", border: `1.5px solid ${highlight ? "rgba(34,197,94,0.2)" : "var(--color-surface-border)"}` }}>
        {value ? (
          <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }} dangerouslySetInnerHTML={{ __html: renderMath(value) }} />
        ) : (
          <span className="text-sm" style={{ color: "var(--color-text-muted)", opacity: 0.5 }}>{placeholder}</span>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 rounded-md px-1.5 py-0.5"
          style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
          <Pencil className="h-2.5 w-2.5" style={{ color: "var(--color-text-muted)" }} />
          <span className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>edit</span>
        </div>
      </button>
    );
  }

  // Edit mode
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 mb-1.5 p-1 rounded-lg flex-wrap" style={{ background: "var(--color-surface-light)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <button type="button" onMouseDown={preventBlur} onClick={() => insertFormat("bold")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Bold"><Bold className="h-3 w-3" /></button>
        <button type="button" onMouseDown={preventBlur} onClick={() => insertFormat("italic")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Italic"><Italic className="h-3 w-3" /></button>

        <div style={{ width: "1px", height: "14px", background: "var(--color-surface-border)", margin: "0 2px" }} />

        <button type="button" onMouseDown={preventBlur} onClick={() => insertFormat("inlinemath")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Inline math">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem" }}>$x$</span>
        </button>
        <button type="button" onMouseDown={preventBlur} onClick={() => insertFormat("displaymath")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Display math">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem" }}>$$</span>
        </button>

        <div style={{ width: "1px", height: "14px", background: "var(--color-surface-border)", margin: "0 2px" }} />

        <button type="button" onMouseDown={preventBlur} onClick={() => insertAtCursor("\\frac{}{}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Fraction"><Divide className="h-3 w-3" /></button>
        <button type="button" onMouseDown={preventBlur} onClick={() => insertAtCursor("\\sqrt{}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Square root">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem" }}>√</span>
        </button>
        <button type="button" onMouseDown={preventBlur} onClick={() => insertAtCursor("x^{2}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Power"><Superscript className="h-3 w-3" /></button>
        <button type="button" onMouseDown={preventBlur} onClick={() => insertAtCursor("x_{n}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Subscript"><Subscript className="h-3 w-3" /></button>

        <div style={{ width: "1px", height: "14px", background: "var(--color-surface-border)", margin: "0 2px" }} />

        <button type="button" onMouseDown={preventBlur} onClick={() => insertAtCursor("\\begin{pmatrix} a & b \\\\\\\\ c & d \\end{pmatrix}", true)} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Matrix"><Grid3X3 className="h-3 w-3" /></button>

        {/* Table */}
        <button type="button" onMouseDown={preventBlur} onClick={() => { setShowTableBuilder(!showTableBuilder); setShowPalette(false); }}
          className="btn-ghost" style={{ padding: "0.25rem 0.375rem", background: showTableBuilder ? "rgba(59,130,246,0.1)" : undefined, color: showTableBuilder ? "var(--color-info-400)" : undefined }} title="Insert table">
          <Table2 className="h-3 w-3" />
        </button>

        {/* Symbol palette */}
        <button type="button" onMouseDown={preventBlur} onClick={() => { setShowPalette(!showPalette); setShowTableBuilder(false); }}
          className="btn-ghost" style={{ padding: "0.25rem 0.375rem", background: showPalette ? "rgba(34,197,94,0.1)" : undefined, color: showPalette ? "var(--color-accent-green)" : undefined }} title="More symbols">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700 }}>fx</span>
        </button>

        <button type="button" onMouseDown={preventBlur} onClick={stopEditing} className="btn-ghost ml-auto"
          style={{ padding: "0.25rem 0.5rem", color: "var(--color-accent-green)", fontSize: "0.625rem", fontWeight: 600 }}>Done</button>
      </div>

      {/* Table builder */}
      {showTableBuilder && (
        <TableBuilder
          onInsert={(md) => insertRawAtCursor(md)}
          onClose={() => setShowTableBuilder(false)}
        />
      )}

      {/* Symbol palette */}
      {showPalette && (
        <div className="mb-2 rounded-lg overflow-hidden" style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }} onMouseDown={preventBlur}>
          <div className="flex border-b" style={{ borderColor: "var(--color-surface-border)" }}>
            {(["basics", "greek", "functions", "matrices"] as PaletteTab[]).map((key) => (
              <button key={key} type="button" onMouseDown={preventBlur} onClick={() => setPaletteTab(key)}
                className="flex-1 py-1.5 text-[0.5625rem] font-semibold transition-all capitalize"
                style={{ background: paletteTab === key ? "var(--color-surface-card)" : "transparent", color: paletteTab === key ? "var(--color-accent-green)" : "var(--color-text-muted)", borderBottom: paletteTab === key ? "2px solid var(--color-accent-green)" : "2px solid transparent" }}>
                {key}
              </button>
            ))}
          </div>
          <div className={`p-2 grid gap-1 ${paletteTab === "matrices" ? "grid-cols-3" : "grid-cols-6"}`}>
            {getPaletteSymbols().map((s) => (
              <button key={s.label} type="button" onMouseDown={preventBlur}
                onClick={() => { insertAtCursor(s.tex, s.tex.includes("\\begin{")); }}
                className="rounded-md p-1.5 text-center transition-all" style={{ background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-card)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                title={s.label}>
                <div className="flex items-center justify-center overflow-hidden" style={{ minHeight: paletteTab === "matrices" ? "40px" : "20px" }}
                  dangerouslySetInnerHTML={{ __html: (() => { try { return katex.renderToString(s.tex, { throwOnError: false, displayMode: paletteTab === "matrices" }); } catch { return s.tex; } })() }} />
                <span className="block mt-0.5" style={{ fontSize: paletteTab === "matrices" ? "0.5rem" : "0.4375rem", color: "var(--color-text-muted)" }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Textarea */}
      <textarea ref={textareaRef} id={id} value={value}
        onChange={(e) => { onChange(e.target.value); autoResize(); }}
        onBlur={() => { setTimeout(() => { if (document.activeElement !== textareaRef.current) stopEditing(); }, 200); }}
        placeholder={placeholder} rows={minRows || 2} className="input-field"
        style={{ resize: "vertical", lineHeight: "1.6", minHeight: `${Math.max((minRows || 1) * 24, 42)}px`, fontFamily: "var(--font-mono)", fontSize: "0.8125rem", borderColor: "rgba(34,197,94,0.3)" }} />

      {/* Live preview */}
      {value && (
        <div className="mt-1.5 rounded-lg px-3 py-2" onMouseDown={preventBlur} style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}>
          <p className="text-[0.5rem] uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>Preview</p>
          <div className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }} dangerouslySetInnerHTML={{ __html: renderMath(value) }} />
        </div>
      )}
    </div>
  );
}

// ─── Main Editor ───
export function QuestionEditor({ question, onClose }: QuestionEditorProps) {
  const isEditing = !!question?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [form, setForm] = useState<QuestionData>({
    subject: question?.subject || "",
    topicId: question?.topicId || "",
    subtopicId: question?.subtopicId || "",
    year: question?.year || null,
    questionNumber: question?.questionNumber || null,
    body: question?.body || "",
    imageUrl: question?.imageUrl || null,
    optionA: question?.optionA || "",
    optionB: question?.optionB || "",
    optionC: question?.optionC || "",
    optionD: question?.optionD || "",
    correctOption: question?.correctOption || "A",
    explanation: question?.explanation || "",
    explanationImageUrl: question?.explanationImageUrl || null,
    difficulty: question?.difficulty || "MEDIUM",
    isActive: question?.isActive ?? true,
  });

  useEffect(() => {
    if (!form.subject) { setTopics([]); return; }
    fetch(`/api/admin/topics?subject=${form.subject}`).then((r) => r.json()).then(setTopics);
  }, [form.subject]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); attemptClose(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty]);

  const updateField = (field: keyof QuestionData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const attemptClose = useCallback(() => {
    if (isDirty) setShowCloseConfirm(true);
    else onClose(false);
  }, [isDirty, onClose]);

  const handleSave = async () => {
    setSaving(true); setError("");
    if (!form.subject || !form.topicId || !form.body || !form.optionA) {
      setError("Fill in all required fields (subject, topic, question, and at least option A)");
      setSaving(false); return;
    }
    try {
      const url = isEditing ? `/api/admin/questions/${question!.id}` : "/api/admin/questions";
      const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const data = await res.json(); setError(data.details?.join(", ") || data.error || "Save failed"); return; }
      setIsDirty(false); onClose(true);
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const selectedTopic = topics.find((t) => t.id === form.topicId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) attemptClose(); }}>
        <div className="w-full max-w-2xl rounded-2xl"
          style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)", boxShadow: "var(--shadow-elevated)", animation: "var(--animate-scale-in)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
            <div className="flex items-center gap-2">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
                {isEditing ? "Edit Question" : "New Question"}
              </h2>
              {isDirty && (
                <span className="text-[0.5625rem] rounded-full px-2 py-0.5" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning-400)", border: "1px solid rgba(245,158,11,0.2)" }}>Unsaved</span>
              )}
            </div>
            <button onClick={attemptClose} className="btn-ghost" style={{ padding: "0.25rem" }}><X className="h-5 w-5" /></button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-danger-400)" }}>{error}</div>
            )}

            <div className="rounded-lg px-3 py-2 text-[0.625rem]" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", color: "var(--color-text-muted)" }}>
              Click any field to edit. Use the toolbar for math symbols, matrices, and tables.
            </div>

            {/* Subject + Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Subject *</label>
                <select value={form.subject} onChange={(e) => { updateField("subject", e.target.value); updateField("topicId", ""); }} className="input-field" style={{ appearance: "none" }}>
                  <option value="">Select subject</option>
                  {JAMB_SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Topic *</label>
                <select value={form.topicId} onChange={(e) => updateField("topicId", e.target.value)} className="input-field" style={{ appearance: "none", opacity: form.subject ? 1 : 0.5 }} disabled={!form.subject}>
                  <option value="">Select topic</option>
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.name} ({t._count.questions})</option>)}
                </select>
              </div>
            </div>

            {/* Subtopic + Year + Difficulty */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedTopic && selectedTopic.subtopics.length > 0 && (
                <div>
                  <label className="label">Subtopic</label>
                  <select value={form.subtopicId || ""} onChange={(e) => updateField("subtopicId", e.target.value || undefined)} className="input-field" style={{ appearance: "none" }}>
                    <option value="">None</option>
                    {selectedTopic.subtopics.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Year</label>
                <input type="number" value={form.year || ""} onChange={(e) => updateField("year", e.target.value ? parseInt(e.target.value) : null)} placeholder="e.g. 2023" className="input-field" min={1990} max={2030} />
              </div>
              <div>
                <label className="label">Difficulty *</label>
                <div className="flex gap-1">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((d) => {
                    const isSelected = form.difficulty === d;
                    const colors = { EASY: "var(--color-accent-green)", MEDIUM: "var(--color-warning-400)", HARD: "var(--color-danger-400)" };
                    return (
                      <button key={d} type="button" onClick={() => updateField("difficulty", d)} className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                        style={{ background: isSelected ? `${colors[d]}15` : "var(--color-surface-light)", border: `1.5px solid ${isSelected ? colors[d] : "var(--color-surface-border)"}`, color: isSelected ? colors[d] : "var(--color-text-tertiary)" }}>
                        {d.charAt(0) + d.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question body */}
            <div>
              <label className="label">Question *</label>
              <MathField id="field-body" value={form.body} onChange={(v) => updateField("body", v)} placeholder="Click here to type your question..." minRows={4} />
            </div>

            {/* Question image */}
            <ImageUploader
              label="Question Image (optional)"
              imageUrl={form.imageUrl || null}
              onUpload={(url) => updateField("imageUrl", url)}
              onRemove={() => updateField("imageUrl", null)}
            />

            {/* Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label" style={{ marginBottom: 0 }}>Options *</label>
                <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>Click letter to mark correct</p>
              </div>
              <div className="space-y-2.5">
                {(["A", "B", "C", "D"] as const).map((key) => {
                  const fieldKey = `option${key}` as "optionA" | "optionB" | "optionC" | "optionD";
                  const isCorrect = form.correctOption === key;
                  return (
                    <div key={key} className="flex items-start gap-2">
                      <button type="button" onClick={() => updateField("correctOption", key)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all mt-1"
                        style={{
                          background: isCorrect ? "var(--color-accent-green)" : "var(--color-surface-lighter)",
                          color: isCorrect ? "var(--color-surface)" : "var(--color-text-muted)",
                          border: `1.5px solid ${isCorrect ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                          fontFamily: "var(--font-mono)",
                        }}>
                        {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : key}
                      </button>
                      <div className="flex-1">
                        <MathField id={`field-option${key}`} value={(form as any)[fieldKey]} onChange={(v) => updateField(fieldKey, v)} placeholder={`Option ${key}...`} minRows={1} highlight={isCorrect} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="label">Explanation</label>
              <MathField id="field-explanation" value={form.explanation || ""} onChange={(v) => updateField("explanation", v)} placeholder="Explain why the correct answer is right..." minRows={3} />
            </div>

            {/* Explanation image */}
            <ImageUploader
              label="Explanation Image (optional)"
              imageUrl={form.explanationImageUrl || null}
              onUpload={(url) => updateField("explanationImageUrl", url)}
              onRemove={() => updateField("explanationImageUrl", null)}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} className="h-4 w-4 rounded accent-green-500" />
              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Active</span>
            </label>
            <div className="flex gap-2">
              <button onClick={attemptClose} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close confirmation */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)", boxShadow: "var(--shadow-elevated)", animation: "var(--animate-scale-in)" }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(245,158,11,0.1)" }}>
              <AlertTriangle className="h-6 w-6" style={{ color: "var(--color-warning-400)" }} />
            </div>
            <h3 className="mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>Unsaved Changes</h3>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>You have unsaved changes. Are you sure you want to close?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseConfirm(false)} className="btn-secondary flex-1">Keep Editing</button>
              <button onClick={() => { setShowCloseConfirm(false); onClose(false); }} className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-danger-400)" }}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}