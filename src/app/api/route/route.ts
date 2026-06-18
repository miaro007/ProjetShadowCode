import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Variables d\'environnement manquantes',
        url: supabaseUrl ? '✅' : '❌',
        key: supabaseKey ? '✅' : '❌'
      },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error } = await supabase.from('test_table').select('id').limit(1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Supabase connecté avec succès !',
      url: supabaseUrl,
      keyStatus: '✅ Définie'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}