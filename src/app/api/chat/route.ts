import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    console.log('Messages reçus:', messages)

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      messages,
      onError(error) {
    console.error('STREAM ERROR:', error)
  },
    })

    return result.toDataStreamResponse()

  } catch (error) {
    console.error('ERREUR COMPLETE:', error)

    return Response.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    )
  }
}