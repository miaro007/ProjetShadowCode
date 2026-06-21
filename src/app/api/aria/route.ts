import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extraire le dernier message utilisateur pour chercher des mots clés
    const lastMessage = body.messages[body.messages.length - 1]?.content?.toLowerCase() || "";
    let extraContext = "";

    // Si l'utilisateur parle de bus, ligne ou arrêt, on fetch les données pertinentes
    if (lastMessage.includes("bus") || lastMessage.includes("ligne") || lastMessage.includes("arrêt") || lastMessage.includes("arret")) {
      try {
        // Fetcher quelques lignes de bus et arrêts pour donner du contexte à l'IA
        // On limite à 10 pour ne pas surcharger le contexte de l'IA
        const { data: busLines } = await supabase.from('bus_lines').select('name, route_name').limit(10);
        const { data: stops } = await supabase.from('arrêts').select('name, location').limit(10);
        
        if (busLines && busLines.length > 0) {
          extraContext += `\n\n[CONTEXTE BASE DE DONNÉES SUPABASE]\nLignes de bus disponibles: ${JSON.stringify(busLines)}.\n`;
        }
        if (stops && stops.length > 0) {
          extraContext += `Arrêts connus: ${JSON.stringify(stops)}.\n\n`;
        }
        if (extraContext) {
          extraContext += "Utilise ces données pour répondre aux questions de l'utilisateur sur les bus et arrêts.\n";
        }
      } catch (err) {
        console.error("Erreur lors de la récupération Supabase:", err);
      }
    }
    
    // Ajout de la position GPS de l'utilisateur si elle est disponible
    if (body.userLocation) {
      extraContext += `\n\n[POSITION ACTUELLE DE L'UTILISATEUR]\nL'utilisateur se trouve actuellement aux coordonnées GPS : Latitude ${body.userLocation.lat}, Longitude ${body.userLocation.lng}. Prends en compte cette position pour lui proposer des itinéraires pertinents.\n`;
    }

    const systemPrompt = body.system + extraContext;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          ...body.messages,
        ],
      }),
    });

    const data = await response.json();
    console.log("GROQ RAW RESPONSE:", data);

    if (data.error) {
      return NextResponse.json(
        { content: [{ type: "text", text: `Erreur Groq: ${data.error.message}` }] }
      );
    }

    // Adapter format Groq → format attendu par AIAssistant.tsx
    const text = data.choices?.[0]?.message?.content || "Désolée, je n'ai pas pu générer de réponse.";

    return NextResponse.json({
      content: [{ type: "text", text }],
    });

  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json(
      { content: [{ type: "text", text: "Erreur serveur interne." }] },
      { status: 500 }
    );
  }
}
