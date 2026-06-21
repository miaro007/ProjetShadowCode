import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── 1. Extraire le message utilisateur ──────────────────────────────
    const lastMessage = body.messages[body.messages.length - 1]?.content?.toLowerCase() || "";
    let extraContext = "";

    // ── 2. Injecter le contexte temps-réel (heure, jour, position, zones) ──
    const ctx = body.context;
    if (ctx) {
      const isRushMorning = (() => {
        const h = parseInt(ctx.time?.split("h")[0] ?? "0");
        return h >= 6 && h < 9;
      })();
      const isRushEvening = (() => {
        const h = parseInt(ctx.time?.split("h")[0] ?? "0");
        return h >= 17 && h < 20;
      })();

      extraContext += `\n\n[CONTEXTE TEMPS-RÉEL]\n`;
      extraContext += `- Heure actuelle : ${ctx.time ?? "inconnue"}, ${ctx.day ?? ""}\n`;
      extraContext += `- Position de l'utilisateur : ${ctx.location ?? "Antananarivo"}\n`;

      if (ctx.criticalZones && ctx.criticalZones.length > 0) {
        extraContext += `- Zones saturées en ce moment : ${ctx.criticalZones.join(", ")}\n`;
      }

      if (isRushMorning) {
        extraContext += `- ALERTE : C'est l'heure de pointe matinale. Recommande systématiquement le Taxi-be ou un départ décalé.\n`;
      } else if (isRushEvening) {
        extraContext += `- ALERTE : C'est l'heure de pointe du soir. Recommande de partir après 20h ou d'emprunter un axe alternatif.\n`;
      } else {
        extraContext += `- Trafic : globalement fluide en ce moment.\n`;
      }

      extraContext += `\nSur la base de ce contexte, donne TOUJOURS une recommandation d'action concrète (heure de départ, ligne de transport, axe alternatif). Ne te contente jamais d'une information passive.\n`;
    }

    // ── 3. Enrichir avec données Supabase si question sur bus/lignes ──────
    if (
      lastMessage.includes("bus") ||
      lastMessage.includes("ligne") ||
      lastMessage.includes("arrêt") ||
      lastMessage.includes("arret") ||
      lastMessage.includes("taxi-be") ||
      lastMessage.includes("taxibe")
    ) {
      try {
        const { data: routes } = await supabase
          .from("routes")
          .select("route_number, route_name")
          .limit(15);

        if (routes && routes.length > 0) {
          extraContext += `\n[LIGNES DE BUS DISPONIBLES]\n`;
          routes.forEach((r) => {
            extraContext += `- Ligne ${r.route_number}: ${r.route_name}\n`;
          });
          extraContext += `Utilise ces lignes pour tes recommandations d'itinéraire.\n`;
        }
      } catch (err) {
        console.error("Erreur Supabase routes:", err);
      }
    }

    // ── 4. Injecter la position GPS de l'utilisateur ──────────────────────
    if (body.userLocation) {
      extraContext += `\n[POSITION GPS]\nLatitude: ${body.userLocation.lat}, Longitude: ${body.userLocation.lng}\n`;
      extraContext += `Prends en compte cette position GPS pour proposer les lignes de bus et les itinéraires les plus proches.\n`;
    }

    // ── 5. Construire le prompt système final ─────────────────────────────
    const systemPrompt = body.system + extraContext;

    // ── 6. Appel à l'API Groq (LLaMA 3) ──────────────────────────────────
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...body.messages,
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({
        content: [{ type: "text", text: `Désolée, je rencontre une erreur temporaire. (${data.error.message})` }],
      });
    }

    const text =
      data.choices?.[0]?.message?.content ||
      "Désolée, je n'ai pas pu générer de réponse.";

    return NextResponse.json({
      content: [{ type: "text", text }],
    });
  } catch (error) {
    console.error("Aria API error:", error);
    return NextResponse.json(
      { content: [{ type: "text", text: "Erreur serveur. Veuillez réessayer." }] },
      { status: 500 }
    );
  }
}
