import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio fourni." }, { status: 400 });
    }

    // Préparer les données pour Groq Whisper
    const groqFormData = new FormData();
    groqFormData.append("file", file, "audio.webm");
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("language", "fr"); // Force le français par défaut, mais Whisper est multilingue

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Groq Whisper:", data);
      return NextResponse.json({ error: data.error?.message || "Erreur de transcription." }, { status: response.status });
    }

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("Erreur Serveur Transcription:", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}
