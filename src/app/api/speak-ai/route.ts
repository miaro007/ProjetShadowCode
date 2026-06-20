import { NextResponse } from "next/server";
import { localAssistant, extractDestination } from "@/lib/localAssistant";
import { getRoute } from "@/lib/openroute";

const SYSTEM_PROMPT = `
Tu es TransitAI, assistant de transport urbain à Madagascar.

Règles:
- uniquement transport, routes, trafic
- réponses courtes
- refuse hors sujet
`;

export async function POST(req: Request) {
  try {
    const { message, location } = await req.json();

    if (!message) {
      return NextResponse.json({ reply: "Message vide" });
    }

    // 🧠 ROUTE INTELLIGENTE
    const destination = extractDestination(message);

    if (destination) {
      const route = await getRoute(destination, location);

      if (route) {
        return NextResponse.json({
          reply: `🗺️ Trajet TransitAI

📍 Départ GPS actuel
🎯 Destination: ${route.destination}

📏 Distance: ${route.distanceKm} km
⏱ Temps: ${route.durationMin} min

🚦 Optimisé pour trafic urbain`,
          action: "SHOW_ROUTE",
          source: "route",
        });
      }
    }

    // 🧠 LOCAL DB
    const local = localAssistant(message);
    if (local) {
      return NextResponse.json({
        reply: local.reply,
        action: local.action,
        source: "local",
      });
    }

    // 🤖 FALLBACK IA GROQ
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const data = await res.json();

    return NextResponse.json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "Je n’ai pas compris",
      action: "NONE",
      source: "ai",
    });
  } catch (e) {
    return NextResponse.json({
      reply: "Erreur TransitAI",
      source: "error",
    });
  }
}