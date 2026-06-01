const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_BASE = `https://graph.facebook.com/v21.0/${PHONE_ID}`;

interface SendMessageOptions {
  to: string;
  text?: string;
  buttons?: Array<{ id: string; title: string }>;
  listSections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
  listButtonText?: string;
  templateName?: string;
  templateParams?: string[];
}

export async function sendWhatsAppMessage(options: SendMessageOptions) {
  const { to, text, buttons, listSections, listButtonText } = options;

  let body: any;

  if (buttons && buttons.length > 0) {
    // Interactive buttons (max 3)
    body = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: text || "" },
        action: {
          buttons: buttons.slice(0, 3).map((btn) => ({
            type: "reply",
            reply: { id: btn.id, title: btn.title.slice(0, 20) },
          })),
        },
      },
    };
  } else if (listSections && listSections.length > 0) {
    // Interactive list
    body = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: text || "" },
        action: {
          button: listButtonText || "Select",
          sections: listSections,
        },
      },
    };
  } else {
    // Plain text
    body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text || "", preview_url: false },
    };
  }

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("WhatsApp send failed:", data);
      return { success: false, error: data };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, error };
  }
}

export async function markAsRead(messageId: string) {
  try {
    await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch {}
}

// Format long text for WhatsApp (compress, limit length)
export function formatForWhatsApp(text: string, maxLength = 4000): string {
  let formatted = text
    .replace(/#{1,4} /g, "*")         // headers → bold
    .replace(/\*\*(.+?)\*\*/g, "*$1*") // **bold** → *bold*
    .replace(/```[\s\S]*?```/g, (match) => {
      // Code blocks → monospace
      const code = match.replace(/```\w*\n?/g, "").trim();
      return "```" + code + "```";
    })
    .replace(/\n{3,}/g, "\n\n")      // collapse excessive newlines
    .trim();

  if (formatted.length > maxLength) {
    formatted = formatted.slice(0, maxLength - 50) + "\n\n..._(message truncated)_";
  }

  return formatted;
}

// Split long messages (WhatsApp limit is 4096 chars)
export function splitMessage(text: string, limit = 4000): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }

    // Find a good split point
    let splitAt = remaining.lastIndexOf("\n\n", limit);
    if (splitAt < limit * 0.5) splitAt = remaining.lastIndexOf("\n", limit);
    if (splitAt < limit * 0.5) splitAt = remaining.lastIndexOf(". ", limit);
    if (splitAt < limit * 0.5) splitAt = limit;

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks;
}