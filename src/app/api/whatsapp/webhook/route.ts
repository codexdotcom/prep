import { NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/wa-router";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// GET — webhook verification (Meta requires this)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — incoming messages
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract message data from Meta's webhook format
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.[0]) {
      // Status update or other non-message event
      return NextResponse.json({ received: true });
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];
    const phone = message.from;

    let text = "";
    let type = message.type;
    let buttonReplyId: string | undefined;
    let listReplyId: string | undefined;

    switch (type) {
      case "text":
        text = message.text?.body || "";
        break;
      case "interactive":
        if (message.interactive?.type === "button_reply") {
          buttonReplyId = message.interactive.button_reply?.id;
          text = message.interactive.button_reply?.title || "";
        } else if (message.interactive?.type === "list_reply") {
          listReplyId = message.interactive.list_reply?.id;
          text = message.interactive.list_reply?.title || "";
        }
        break;
      default:
        // Unsupported message type
        break;
    }

    if (!text && !buttonReplyId && !listReplyId) {
      return NextResponse.json({ received: true });
    }

    // Process async — don't block the webhook response
    handleIncomingMessage({
      phone,
      text,
      messageId: message.id,
      type,
      buttonReplyId,
      listReplyId,
    }).catch((err) => {
      console.error("WhatsApp handler error:", err);
    });

    // Return 200 immediately (Meta requires fast response)
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ received: true });
  }
}