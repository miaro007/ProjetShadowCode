'use client'

import { useEffect, useState, useCallback, useId } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Employe {
  id: string
  prenom: string
  nom: string
  email: string
  telephone: string | null
  date_naissance: string | null
  date_embauche: string
  poste: string
  departement: 'R&D' | 'Marketing' | 'Ventes' | 'RH' | 'Finance' | 'Support'
  salaire: number | null
  est_actif: boolean
  created_at: string
}

export default function TestDatabase() {
  const [data, setData] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // États pour les champs du formulaire
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [poste, setPoste] = useState('')
  const [departement, setDepartement] = useState('R&D')
  const [salaire, setSalaire] = useState('')
  const [estActif, setEstActif] = useState(true)

  // ✅ Génération d'IDs uniques accessibles pour lier les Labels aux Inputs
  const prenomId = useId()
  const nomId = useId()
  const emailId = useId()
  const telephoneId = useId()
  const dateNaissanceId = useId()
  const salaireId = useId()
  const posteId = useId()
  const departementId = useId()
  const estActifId = useId()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: responseData, error: responseError } = await supabase
        .from('employes')
        .select('*')
        .order('created_at', { ascending: false })

      if (responseError) throw responseError
      
      setData(responseData || [])
      setError(null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      
      const { error: insertError } = await supabase
        .from('employes')
        .insert([
          {
            prenom,
            nom,
            email,
            telephone: telephone || null,
            date_naissance: dateNaissance || null,
            poste,
            departement,
            salaire: salaire ? parseFloat(salaire) : null,
            est_actif: estActif
          }
        ])

      if (insertError) throw insertError

      setPrenom('')
      setNom('')
      setEmail('')
      setTelephone('')
      setDateNaissance('')
      setPoste('')
      setDepartement('R&D')
      setSalaire('')
      setEstActif(true)

      await fetchData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'ajout"
      setError(errorMessage)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const initialize = async () => {
      if (isMounted) {
        await fetchData()
      }
    }
    
    initialize()
    
    return () => {
      isMounted = false
    }
  }, [fetchData])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- COLONNE GAUCHE : FORMULAIRE D'AJOUT --- */}
        <div>
          <h2 className="text-2xl font-bold mb-6">👤 Ajouter un employé</h2>
          
          <Card className="p-6 bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={prenomId} className="block text-sm font-medium mb-1">Prénom *</label>
                  <input id={prenomId} type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} required className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label htmlFor={nomId} className="block text-sm font-medium mb-1">Nom *</label>
                  <input id={nomId} type="text" value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full border p-2 rounded" />
                </div>
              </div>

              <div>
                <label htmlFor={emailId} className="block text-sm font-medium mb-1">Email *</label>
                <input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border p-2 rounded" />
              </div>

              <div>
                <label htmlFor={telephoneId} className="block text-sm font-medium mb-1">Téléphone</label>
                <input id={telephoneId} type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border p-2 rounded" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={dateNaissanceId} className="block text-sm font-medium mb-1">Date de naissance</label>
                  <input id={dateNaissanceId} type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label htmlFor={salaireId} className="block text-sm font-medium mb-1">Salaire (€)</label>
                  <input id={salaireId} type="number" step="0.01" value={salaire} onChange={(e) => setSalaire(e.target.value)} className="w-full border p-2 rounded" />
                </div>
              </div>

              <div>
                <label htmlFor={posteId} className="block text-sm font-medium mb-1">Poste occupé *</label>
                <input id={posteId} type="text" value={poste} onChange={(e) => setPoste(e.target.value)} required className="w-full border p-2 rounded" />
              </div>

              <div>
                <label htmlFor={departementId} className="block text-sm font-medium mb-1">Département *</label>
                <select id={departementId} value={departement} onChange={(e) => setDepartement(e.target.value)} className="w-full border p-2 rounded bg-white">
                  <option value="R&D">R&D</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Ventes">Ventes</option>
                  <option value="RH">RH</option>
                  <option value="Finance">Finance</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input type="checkbox" id={estActifId} checked={estActif} onChange={(e) => setEstActif(e.target.checked)} className="h-4 w-4 rounded text-blue-600" />
                <label htmlFor={estActifId} className="text-sm font-medium">Employé actif</label>
              </div>

              <Button type="submit" className="w-full">Enregistrer lemployé</Button>
            </form>
          </Card>
        </div>

        {/* --- COLONNE DROITE : LISTE DES EMPLOYÉS --- */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">🗄️ Liste des employés ({data.length})</h2>
            <Button onClick={fetchData} variant="outline" size="sm">🔄 Actualiser</Button>
          </div>

          {error && (
            <Card className="p-4 mb-4 bg-red-50 border-red-200 text-red-800 text-sm">
              ❌ Erreur: {error}
            </Card>
          )}

          {loading ? (
            <p className="text-gray-500">Chargement des données...</p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {data.map((emp) => (
                <Card key={emp.id} className="p-4 bg-white relative">
                  <span className={`absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full ${emp.est_actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {emp.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                  
                  <h3 className="font-bold text-lg">{emp.prenom} {emp.nom}</h3>
                  <p className="text-sm font-medium text-indigo-600">{emp.poste} — <span className="text-gray-500">{emp.departement}</span></p>
                  
                  <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-1">
                    <p>📧 {emp.email}</p>
                    {emp.telephone && <p>📞 {emp.telephone}</p>}
                    {emp.salaire && <p>💰 {parseFloat(emp.salaire.toString()).toLocaleString('fr-FR')} €/an</p>}
                    <p>📅 Embauche: {new Date(emp.date_embauche).toLocaleDateString('fr-FR')}</p>
                  </div>
                </Card>
              ))}

              {data.length === 0 && (
                <Card className="p-8 text-center text-gray-500 bg-white">
                  {/* ✅ Correction de l'apostrophe ici pour ESLint : &quot; au lieu de " */}
                  Aucun employé en base de données. Utilisez le formulaire pour faire un test !
                </Card>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}