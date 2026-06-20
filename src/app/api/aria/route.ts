import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: body.system },
          ...body.messages,
        ],
      }),
    });

    const data = await response.json();

    // Adapter format Groq → format attendu par AIAssistant.tsx
    const text = data.choices?.[0]?.message?.content || "Désolée, une erreur s'est produite.";

    return NextResponse.json({
      content: [{ type: "text", text }],
    });

  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json(
      { content: [{ type: "text", text: "Erreur serveur. Réessayez dans un instant." }] },
      { status: 500 }
    );
  }
}
