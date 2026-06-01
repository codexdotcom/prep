"use client";

import { useMemo } from "react";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className="prose-custom"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMarkdown(text: string): string {
  let html = escapeHtml(text);

  // Code blocks (```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre class="md-code-block"><code>$2</code></pre>'
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="md-inline-code">$1</code>'
  );

  // Bold
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="md-bold">$1</strong>'
  );

  // Italic
  html = html.replace(
    /(?<!\*)\*([^*]+)\*(?!\*)/g,
    '<em>$1</em>'
  );

  // Superscript
  html = html.replace(
    /\^\(([^)]+)\)/g,
    '<sup>$1</sup>'
  );

  // Subscript
  html = html.replace(
    /_\(([^)]+)\)/g,
    '<sub>$1</sub>'
  );

  // Headers
  html = html.replace(
    /^#### (.+)$/gm,
    '<h4 class="md-h4">$1</h4>'
  );
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="md-h3">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="md-h2">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="md-h1">$1</h1>'
  );

  // Numbered lists
  html = html.replace(
    /^(\d+)\. (.+)$/gm,
    '<li class="md-li md-ol" value="$1">$2</li>'
  );

  // Bullet lists
  html = html.replace(
    /^[-•] (.+)$/gm,
    '<li class="md-li md-ul">$1</li>'
  );

  // Wrap consecutive <li> in <ol> or <ul>
  html = html.replace(
    /(<li class="md-li md-ol"[^>]*>[\s\S]*?<\/li>\n?)+/g,
    '<ol class="md-list">$&</ol>'
  );
  html = html.replace(
    /(<li class="md-li md-ul">[\s\S]*?<\/li>\n?)+/g,
    '<ul class="md-list">$&</ul>'
  );

  // Line breaks (double newline = paragraph break)
  html = html.replace(/\n\n/g, '</p><p class="md-p">');
  html = html.replace(/\n/g, "<br>");

  // Wrap in paragraph
  html = `<p class="md-p">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p class="md-p"><\/p>/g, "");
  html = html.replace(/<p class="md-p">(<h[1-4])/g, "$1");
  html = html.replace(/(<\/h[1-4]>)<\/p>/g, "$1");
  html = html.replace(/<p class="md-p">(<[ou]l)/g, "$1");
  html = html.replace(/(<\/[ou]l>)<\/p>/g, "$1");
  html = html.replace(/<p class="md-p">(<pre)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}