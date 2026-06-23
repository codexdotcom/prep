import jsPDF from "jspdf";

interface NoteForPDF {
  id: string;
  title: string;
  subject: string;
  topicName: string;
  content: string;
  summary: string | null;
  keyFormulas: string[];
  commonMistakes: string[];
  examTips: string[];
  questionCount: number;
  difficulty: string;
}

const BRAND_COLOR: [number, number, number] = [20, 184, 166]; // teal #14b8a6

const SUBJECT_COLORS: Record<string, [number, number, number]> = {
  MATHEMATICS: [20, 184, 166],
  PHYSICS: [20, 184, 166],
  CHEMISTRY: [20, 184, 166],
  BIOLOGY: [20, 184, 166],
  USE_OF_ENGLISH: [20, 184, 166],
  LITERATURE: [20, 184, 166],
  GOVERNMENT: [20, 184, 166],
  ECONOMICS: [20, 184, 166],
  COMMERCE: [20, 184, 166],
  ACCOUNTING: [20, 184, 166],
  GEOGRAPHY: [20, 184, 166],
  AGRICULTURAL_SCIENCE: [20, 184, 166],
  CRS: [20, 184, 166],
  IRS: [20, 184, 166],
};

function getColor(subject: string): [number, number, number] {
  return BRAND_COLOR;
}

const fmt = (s: string) =>
  s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function stripEmDashes(text: string): string {
  return text
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, " - ")
    .replace(/—/g, " - ")
    .replace(/–/g, " - ");
}

function stripMarkdown(text: string): string {
  let clean = text;
  // Remove em dashes
  clean = stripEmDashes(clean);
  // Remove LaTeX display math, keep content
  clean = clean.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => m.trim());
  // Remove inline LaTeX delimiters
  clean = clean.replace(/\$(.+?)\$/g, "$1");
  // Remove code blocks
  clean = clean.replace(/```[\s\S]*?```/g, "");
  // Remove [PRACTICE] blocks
  clean = clean.replace(/\[PRACTICE\][\s\S]*?\[\/PRACTICE\]/g, "");
  // Remove metadata markers
  clean = clean.replace(/---[A-Z_]+---[\s\S]*/, "");
  // Remove markdown formatting
  clean = clean.replace(/#{1,3}\s/g, "");
  clean = clean.replace(/\*\*(.+?)\*\*/g, "$1");
  clean = clean.replace(/\*(.+?)\*/g, "$1");
  clean = clean.replace(/`([^`]+)`/g, "$1");
  // Remove table separators
  clean = clean.replace(/^\|[-:| ]+\|$/gm, "");
  // Clean pipes from tables
  clean = clean.replace(/\|/g, "  ");
  // Clean up whitespace
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
}

function parseContentSections(
  content: string
): Array<{ type: "heading" | "subheading" | "text" | "bullet" | "table"; text: string }> {
  const lines = content.split("\n");
  const parts: Array<{ type: "heading" | "subheading" | "text" | "bullet" | "table"; text: string }> = [];
  let inCodeBlock = false;
  let inPractice = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    if (trimmed === "[PRACTICE]") { inPractice = true; continue; }
    if (trimmed === "[/PRACTICE]") { inPractice = false; continue; }
    if (inPractice) continue;
    if (trimmed.startsWith("---") && trimmed.endsWith("---") && trimmed.length > 6) break; // metadata

    if (trimmed.startsWith("## ")) {
      parts.push({ type: "heading", text: trimmed.replace(/^##\s+/, "") });
    } else if (trimmed.startsWith("### ")) {
      parts.push({ type: "subheading", text: trimmed.replace(/^###\s+/, "") });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      parts.push({ type: "bullet", text: trimmed.replace(/^[-*]\s+/, "") });
    } else if (/^\d+\.\s/.test(trimmed)) {
      parts.push({ type: "bullet", text: trimmed });
    } else if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!/^[-:| ]+$/.test(trimmed.replace(/\|/g, "").trim())) {
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        parts.push({ type: "table", text: cells.join("    |    ") });
      }
    } else if (trimmed.length > 0) {
      // Strip bold/italic
      const clean = trimmed
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\$(.+?)\$/g, "$1")
        .replace(/\$\$([\s\S]+?)\$\$/g, "$1");
      if (clean.length > 0) {
        parts.push({ type: "text", text: clean });
      }
    }
  }

  return parts;
}

export function generateNotePDF(note: NoteForPDF) {
  const pdf = new jsPDF("p", "mm", "a4");
  const W = 210;
  const H = 297;
  const ML = 18; // margin left
  const MR = 18;
  const CW = W - ML - MR; // content width
  const color = getColor(note.subject);
  const subjectLabel = fmt(note.subject);
  const dateStr = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let y = 0;

  // Strip em dashes from all text content
  const cleanTitle = stripEmDashes(note.title);
  const cleanSummary = note.summary ? stripEmDashes(note.summary) : null;
  const cleanFormulas = note.keyFormulas.map(stripEmDashes);
  const cleanMistakes = note.commonMistakes.map(stripEmDashes);
  const cleanTips = note.examTips.map(stripEmDashes);
  const cleanContent = stripEmDashes(note.content);

  function checkPage(needed: number) {
    if (y + needed > H - 20) {
      // Footer on current page
      addFooter();
      pdf.addPage();
      y = 18;
    }
  }

  function addFooter() {
    const pageNum = pdf.getNumberOfPages();
    pdf.setFontSize(7);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`JambOS Study Notes`, ML, H - 10);
    pdf.text(`Page ${pageNum}`, W - MR, H - 10, { align: "right" });
    // Thin line
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.3);
    pdf.line(ML, H - 14, W - MR, H - 14);
  }

  // ═══ PAGE 1: COVER HEADER ═══

  // Dark header block
  pdf.setFillColor(26, 26, 46);
  pdf.rect(0, 0, W, 72, "F");

  // Accent bar at top
  pdf.setFillColor(color[0], color[1], color[2]);
  pdf.rect(0, 0, W, 3, "F");

  // "JAMBOS" brand
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text("JAMBOS", ML, 16);

  // Subject badge
  pdf.setFontSize(7);
  pdf.setTextColor(color[0], color[1], color[2]);
  pdf.text(subjectLabel.toUpperCase(), ML, 24);

  // Topic name (big title)
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(note.topicName, CW);
  pdf.text(titleLines, ML, 38);

  // Meta line
  const titleHeight = titleLines.length * 8;
  pdf.setFontSize(8);
  pdf.setTextColor(150, 160, 180);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `JAMB questions analyzed  •  ${dateStr}`,
    ML,
    38 + titleHeight + 4
  );

  y = 80;

  // ═══ SUMMARY ═══
  if (cleanSummary) {
    // Light accent background
    pdf.setFillColor(
      Math.min(color[0] + 180, 250),
      Math.min(color[1] + 180, 250),
      Math.min(color[2] + 180, 250)
    );
    pdf.roundedRect(ML, y, CW, 0.1, 2, 2, "F"); // measure first

    const summaryLines = pdf.splitTextToSize(cleanSummary, CW - 16);
    const boxH = summaryLines.length * 5 + 14;

    pdf.setFillColor(
      Math.min(color[0] + 180, 250),
      Math.min(color[1] + 180, 250),
      Math.min(color[2] + 180, 250)
    );
    pdf.roundedRect(ML, y, CW, boxH, 3, 3, "F");

    // Left accent bar
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(ML, y, 2.5, boxH, "F");

    // "KEY TAKEAWAY" label
    pdf.setFontSize(6.5);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text("KEY TAKEAWAY", ML + 10, y + 7);

    // Summary text
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont("helvetica", "normal");
    pdf.text(summaryLines, ML + 10, y + 13);

    y += boxH + 8;
  }

  // ═══ QUICK REFERENCE CARDS ═══
  const cards: Array<{
    title: string;
    items: string[];
    iconColor: [number, number, number];
  }> = [];

  if (cleanFormulas.length > 0) {
    cards.push({
      title: "KEY FORMULAS",
      items: cleanFormulas,
      iconColor: BRAND_COLOR,
    });
  }
  if (cleanMistakes.length > 0) {
    cards.push({
      title: "COMMON MISTAKES",
      items: cleanMistakes,
      iconColor: [239, 68, 68],
    });
  }
  if (cleanTips.length > 0) {
    cards.push({
      title: "EXAM TIPS",
      items: cleanTips,
      iconColor: [245, 158, 11],
    });
  }

  for (const card of cards) {
    checkPage(30);

    // Card header
    pdf.setFillColor(card.iconColor[0], card.iconColor[1], card.iconColor[2]);
    pdf.roundedRect(ML, y, CW, 7, 2, 2, "F");
    // Only round top corners - cover bottom with rect
    pdf.setFillColor(card.iconColor[0], card.iconColor[1], card.iconColor[2]);
    pdf.rect(ML, y + 4, CW, 3, "F");

    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.text(card.title, ML + 5, y + 5);

    y += 9;

    // Card body
    pdf.setFillColor(250, 250, 250);
    let bodyStart = y;

    for (let i = 0; i < card.items.length; i++) {
      checkPage(10);
      const itemText = card.items[i]
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\$(.+?)\$/g, "$1");
      const itemLines = pdf.splitTextToSize(itemText, CW - 18);
      const itemH = itemLines.length * 4.5 + 3;

      // Alternating row bg
      if (i % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(ML, y, CW, itemH, "F");
      }

      // Number
      pdf.setFontSize(7);
      pdf.setTextColor(180, 180, 180);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${i + 1}`, ML + 4, y + 5);

      // Text
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont("helvetica", "normal");
      pdf.text(itemLines, ML + 12, y + 5);

      y += itemH;
    }

    // Bottom border
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.3);
    pdf.line(ML, y, ML + CW, y);

    y += 8;
  }

  // ═══ MAIN CONTENT ═══
  checkPage(20);

  const sections = parseContentSections(cleanContent);

  for (const sec of sections) {
    switch (sec.type) {
      case "heading": {
        checkPage(16);
        y += 4;

        // Colored underline
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(ML, y + 6, 20, 1.5, "F");

        pdf.setFontSize(13);
        pdf.setTextColor(26, 26, 26);
        pdf.setFont("helvetica", "bold");
        pdf.text(sec.text, ML, y + 5);
        y += 12;
        break;
      }
      case "subheading": {
        checkPage(12);
        y += 2;

        // Left accent
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(ML, y - 1, 2, 6, "F");

        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        pdf.setFont("helvetica", "bold");
        pdf.text(sec.text, ML + 5, y + 3);
        y += 9;
        break;
      }
      case "bullet": {
        checkPage(8);
        const bulletLines = pdf.splitTextToSize(sec.text, CW - 8);

        // Dot
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.circle(ML + 2, y + 1.5, 1, "F");

        pdf.setFontSize(8.5);
        pdf.setTextColor(70, 70, 70);
        pdf.setFont("helvetica", "normal");
        pdf.text(bulletLines, ML + 7, y + 2.5);
        y += bulletLines.length * 4.5 + 2;
        break;
      }
      case "table": {
        checkPage(8);
        pdf.setFontSize(7.5);
        pdf.setTextColor(70, 70, 70);
        pdf.setFont("helvetica", "normal");
        const tLines = pdf.splitTextToSize(sec.text, CW);
        pdf.text(tLines, ML + 2, y + 3);
        y += tLines.length * 4 + 3;
        break;
      }
      case "text": {
        checkPage(8);
        pdf.setFontSize(8.5);
        pdf.setTextColor(70, 70, 70);
        pdf.setFont("helvetica", "normal");
        const textLines = pdf.splitTextToSize(sec.text, CW);
        pdf.text(textLines, ML, y + 3);
        y += textLines.length * 4.5 + 2;
        break;
      }
    }
  }

  // ═══ FOOTER ON LAST PAGE ═══
  addFooter();

  // ═══ BACK COVER ═══
  pdf.addPage();

  // Centered branding
  const cy = H / 2 - 20;
  pdf.setFontSize(20);
  pdf.setTextColor(26, 26, 26);
  pdf.setFont("helvetica", "bold");
  pdf.text("JambOS", W / 2, cy, { align: "center" });

  pdf.setFontSize(9);
  pdf.setTextColor(160, 160, 160);
  pdf.setFont("helvetica", "normal");
  pdf.text("AI-Powered JAMB Preparation", W / 2, cy + 8, { align: "center" });

  // Accent line
  pdf.setFillColor(color[0], color[1], color[2]);
  pdf.rect(W / 2 - 15, cy + 14, 30, 1.5, "F");

  pdf.setFontSize(8);
  pdf.setTextColor(180, 180, 180);
  pdf.text(`${stripEmDashes(note.topicName)} - ${subjectLabel}`, W / 2, cy + 24, {
    align: "center",
  });
  pdf.text(`Generated ${dateStr}`, W / 2, cy + 30, { align: "center" });
  pdf.text("jambos.ng", W / 2, cy + 40, { align: "center" });

  // Save
  const filename = `JambOS_${note.topicName.replace(/\s+/g, "_")}_Notes.pdf`;
  pdf.save(filename);
}