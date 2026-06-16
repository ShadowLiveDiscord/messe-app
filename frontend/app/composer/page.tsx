'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  getChants, getMesse, createMesse, updateMesse,
  getGeneratePptxUrl, getGenerateListeUrl,
  Chant, SECTION_LABELS
} from '@/lib/api'
import { FileDown, FileText, Save, Search } from 'lucide-react'

interface SectionDef {
  key: string
  type: 'chant' | 'text' | 'fixed'
  groupe: string
}

const MASS_TEMPLATE: SectionDef[] = [
  // Ritos Iniciais
  { key: 'entree', type: 'chant', groupe: 'Ritos Iniciais' },
  { key: 'kyrie', type: 'chant', groupe: 'Ritos Iniciais' },
  { key: 'gloria', type: 'chant', groupe: 'Ritos Iniciais' },
  { key: 'coleta', type: 'fixed', groupe: 'Ritos Iniciais' },
  // Liturgia da Palavra
  { key: 'leitura1', type: 'text', groupe: 'Liturgia da Palavra' },
  { key: 'salmo', type: 'chant', groupe: 'Liturgia da Palavra' },
  { key: 'leitura2', type: 'text', groupe: 'Liturgia da Palavra' },
  { key: 'aleluia', type: 'chant', groupe: 'Liturgia da Palavra' },
  { key: 'evangelho', type: 'text', groupe: 'Liturgia da Palavra' },
  { key: 'homilia', type: 'fixed', groupe: 'Liturgia da Palavra' },
  { key: 'credo', type: 'chant', groupe: 'Liturgia da Palavra' },
  { key: 'oracao_universal', type: 'chant', groupe: 'Liturgia da Palavra' },
  // Liturgia Eucarística
  { key: 'intencao', type: 'text', groupe: 'Liturgia Eucarística' },
  { key: 'ofertorio', type: 'chant', groupe: 'Liturgia Eucarística' },
  { key: 'oracao_eucaristica', type: 'fixed', groupe: 'Liturgia Eucarística' },
  { key: 'consagracao', type: 'fixed', groupe: 'Liturgia Eucarística' },
  { key: 'anamnese', type: 'chant', groupe: 'Liturgia Eucarística' },
  { key: 'pai_nosso', type: 'chant', groupe: 'Liturgia Eucarística' },
  // Comunhão
  { key: 'comunhao', type: 'chant', groupe: 'Comunhão' },
  // Ritos de Conclusão
  { key: 'conclusao', type: 'chant', groupe: 'Ritos de Conclusão' },
  { key: 'saida', type: 'chant', groupe: 'Ritos de Conclusão' },
  // Anúncios
  { key: 'anuncios', type: 'text', groupe: 'Anúncios e Datas' },
  { key: 'datas', type: 'text', groupe: 'Anúncios e Datas' },
]

interface SectionState {
  chant_id: string | null
  texte_libre: string
  titre_libre: string
}

export default function Composer() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get('edit')

  const [date, setDate] = useState('')
  const [titre, setTitre] = useState('')
  const [notes, setNotes] = useState('')
  const [sections, setSections] = useState<Record<string, SectionState>>(() => {
    const init: Record<string, SectionState> = {}
    MASS_TEMPLATE.forEach(s => { init[s.key] = { chant_id: null, texte_libre: '', titre_libre: '' } })
    return init
  })
  const [chants, setChants] = useState<Chant[]>([])
  const [search, setSearch] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getChants().then(setChants)
  }, [])

  useEffect(() => {
    if (!editId) return
    getMesse(editId).then(messe => {
      setDate(messe.date)
      setTitre(messe.titre || '')
      setNotes(messe.notes || '')
      setSavedId(editId)
      setSections(prev => {
        const next = { ...prev }
        messe.sections.forEach(s => {
          if (next[s.section_type] !== undefined) {
            next[s.section_type] = {
              chant_id: s.chant_id,
              texte_libre: s.texte_libre || '',
              titre_libre: s.titre_libre || '',
            }
          }
        })
        return next
      })
    })
  }, [editId])

  const filteredChants = (sectionKey: string) => {
    const q = (search[sectionKey] || '').toLowerCase()
    return chants.filter(c =>
      !q || c.nom.toLowerCase().includes(q) || String(c.numero).includes(q)
    )
  }

  const setSection = (key: string, patch: Partial<SectionState>) => {
    setSections(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  const buildPayload = () => ({
    date,
    titre: titre || undefined,
    notes: notes || undefined,
    sections: MASS_TEMPLATE.map((s, i) => ({
      section_type: s.key,
      ordre: i,
      chant_id: sections[s.key].chant_id || undefined,
      texte_libre: sections[s.key].texte_libre || undefined,
      titre_libre: sections[s.key].titre_libre || undefined,
    })),
  })

  const handleSave = async () => {
    if (!date) { setError('La date est requise'); return }
    setSaving(true)
    setError('')
    try {
      let messe
      if (savedId) {
        messe = await updateMesse(savedId, buildPayload())
      } else {
        messe = await createMesse(buildPayload())
        setSavedId(messe.id)
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const groups = Array.from(new Set(MASS_TEMPLATE.map(s => s.groupe)))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Composer une messe</h1>
          <p className="text-sm text-gray-500 mt-1">Sélectionnez les chants et renseignez les textes</p>
        </div>
        <div className="flex items-center gap-2">
          {savedId && (
            <>
              <a href={getGenerateListeUrl(savedId)} target="_blank" className="btn-secondary flex items-center gap-1.5 text-sm">
                <FileText size={14} /> Liste PDF
              </a>
              <a href={getGeneratePptxUrl(savedId)} target="_blank" className="btn-primary flex items-center gap-1.5 text-sm">
                <FileDown size={14} /> Générer pptx
              </a>
            </>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Header info */}
      <div className="card p-5 mb-6 grid grid-cols-3 gap-4">
        <div>
          <label className="label">Date de la messe *</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Titre</label>
          <input className="input" placeholder="ex: Dimanche XI - Ano A" value={titre} onChange={e => setTitre(e.target.value)} />
        </div>
        <div>
          <label className="label">Notes</label>
          <input className="input" placeholder="Notes internes..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Sections by group */}
      {groups.map(groupe => (
        <div key={groupe} className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">{groupe}</h2>
          <div className="card divide-y divide-gray-100">
            {MASS_TEMPLATE.filter(s => s.groupe === groupe).map(sectionDef => {
              const sec = sections[sectionDef.key]
              const label = SECTION_LABELS[sectionDef.key] || sectionDef.key
              const selectedChant = sec.chant_id ? chants.find(c => c.id === sec.chant_id) : null

              return (
                <div key={sectionDef.key} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-40 flex-shrink-0 pt-1">
                      <p className="text-sm font-semibold text-gray-700">{label}</p>
                      {sectionDef.type === 'fixed' && (
                        <span className="text-xs text-gray-400 italic">Section fixe</span>
                      )}
                    </div>

                    {sectionDef.type === 'chant' && (
                      <div className="flex-1">
                        {selectedChant ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
                              <span className="text-primary font-bold text-sm">#{selectedChant.numero}</span>
                              <span className="text-sm text-gray-700">{selectedChant.nom}</span>
                              {!selectedChant.has_pptx && (
                                <span className="badge bg-orange-50 text-orange-600 ml-auto">Sans pptx</span>
                              )}
                            </div>
                            <button
                              onClick={() => setSection(sectionDef.key, { chant_id: null })}
                              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                            >
                              Changer
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-300" size={14} />
                            <input
                              className="input pl-8"
                              placeholder="Rechercher par nom ou numéro..."
                              value={search[sectionDef.key] || ''}
                              onChange={e => setSearch(prev => ({ ...prev, [sectionDef.key]: e.target.value }))}
                            />
                            {(search[sectionDef.key] || '').length > 0 && (
                              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {filteredChants(sectionDef.key).slice(0, 10).map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      setSection(sectionDef.key, { chant_id: c.id })
                                      setSearch(prev => ({ ...prev, [sectionDef.key]: '' }))
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                  >
                                    <span className="text-primary font-bold text-sm w-8">#{c.numero}</span>
                                    <span className="text-sm text-gray-700">{c.nom}</span>
                                    {!c.has_pptx && <span className="badge bg-orange-50 text-orange-600 ml-auto text-xs">Sans pptx</span>}
                                  </button>
                                ))}
                                {filteredChants(sectionDef.key).length === 0 && (
                                  <p className="text-sm text-gray-400 px-4 py-3">Aucun résultat</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {sectionDef.type === 'text' && (
                      <div className="flex-1">
                        <textarea
                          className="input resize-none"
                          rows={3}
                          placeholder={`Contenu ${label.toLowerCase()}...`}
                          value={sec.texte_libre}
                          onChange={e => setSection(sectionDef.key, { texte_libre: e.target.value })}
                        />
                      </div>
                    )}

                    {sectionDef.type === 'fixed' && (
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 italic py-1">Incluse automatiquement depuis la bibliothèque</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 mt-6">
        {savedId && (
          <a href={getGeneratePptxUrl(savedId)} target="_blank" className="btn-primary flex items-center gap-2">
            <FileDown size={15} /> Générer le PowerPoint
          </a>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-secondary flex items-center gap-2">
          <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
