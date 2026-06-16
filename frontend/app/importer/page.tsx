'use client'
import { useState } from 'react'
import { parsePptx, createChantFromSlides, clearImportSession, SlidePreview, CATEGORIES } from '@/lib/api'
import { Upload, Plus, Check, ChevronRight } from 'lucide-react'

interface Selection {
  start: number
  end: number
}

export default function Importer() {
  const [slides, setSlides] = useState<SlidePreview[]>([])
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [chantForm, setChantForm] = useState({ numero: '', nom: '', categorie: 'entree', langue: 'PT', notes: '' })
  const [saving, setSaving] = useState(false)
  const [savedChants, setSavedChants] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setSlides([])
    setSessionId('')
    setSavedChants([])
    try {
      const result = await parsePptx(file)
      setSlides(result.slides)
      setSessionId(result.session_id)
    } catch {
      setError('Erreur lors du chargement du fichier')
    } finally {
      setLoading(false)
    }
  }

  const toggleSlide = (idx: number) => {
    if (!selection) {
      setSelection({ start: idx, end: idx })
    } else if (idx === selection.start && idx === selection.end) {
      setSelection(null)
    } else {
      const newStart = Math.min(selection.start, idx)
      const newEnd = Math.max(selection.end, idx)
      setSelection({ start: newStart, end: newEnd })
    }
  }

  const isSelected = (idx: number) =>
    selection !== null && idx >= selection.start && idx <= selection.end

  const selectedIndices = selection
    ? Array.from({ length: selection.end - selection.start + 1 }, (_, i) => selection.start + i)
    : []

  const handleSaveChant = async () => {
    if (!chantForm.numero || !chantForm.nom) { setError('Numéro et nom requis'); return }
    if (selectedIndices.length === 0) { setError('Sélectionnez au moins un slide'); return }
    setSaving(true)
    setError('')
    try {
      await createChantFromSlides(sessionId, {
        slide_indices: selectedIndices,
        numero: parseInt(chantForm.numero),
        nom: chantForm.nom,
        categorie: chantForm.categorie,
        langue: chantForm.langue,
        notes: chantForm.notes || undefined,
      })
      setSavedChants(prev => [...prev, `#${chantForm.numero} ${chantForm.nom}`])
      setSelection(null)
      setChantForm({ numero: '', nom: '', categorie: 'entree', langue: 'PT', notes: '' })
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleFinish = async () => {
    if (sessionId) await clearImportSession(sessionId)
    setSlides([])
    setSessionId('')
    setSavedChants([])
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Importer depuis un pptx</h1>
        <p className="text-sm text-gray-500 mt-1">
          Uploadez votre fichier pptx existant, sélectionnez les slides de chaque chant, et enregistrez-les dans la bibliothèque.
        </p>
      </div>

      {/* Upload zone */}
      {slides.length === 0 && (
        <label className="card p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors border-2 border-dashed border-gray-300">
          <Upload className="text-gray-300 mb-3" size={40} />
          <p className="font-medium text-gray-600">Cliquez pour sélectionner un fichier pptx</p>
          <p className="text-sm text-gray-400 mt-1">.pptx uniquement</p>
          <input type="file" accept=".pptx" className="hidden" onChange={handleFile} />
          {loading && <p className="text-primary mt-3 text-sm">Analyse en cours...</p>}
        </label>
      )}

      {slides.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          {/* Slide list */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-700">
                {slides.length} slides — cliquez pour sélectionner une plage
              </p>
              {selection && (
                <span className="text-sm text-primary font-medium">
                  Slides {selection.start + 1} à {selection.end + 1} sélectionnées
                </span>
              )}
            </div>
            <div className="grid gap-2 max-h-[70vh] overflow-y-auto pr-1">
              {slides.map(slide => (
                <div
                  key={slide.index}
                  onClick={() => toggleSlide(slide.index)}
                  className={`card p-3 cursor-pointer transition-all ${
                    isSelected(slide.index)
                      ? 'border-primary bg-primary/5 border-2'
                      : savedChants.length > 0 && 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected(slide.index) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {slide.index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {slide.texts.length === 0 ? (
                        <p className="text-gray-300 text-sm italic">Slide vide (image/fond)</p>
                      ) : (
                        slide.texts.slice(0, 3).map((t, i) => (
                          <p key={i} className="text-xs text-gray-600 truncate">{t}</p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Saved chants */}
            {savedChants.length > 0 && (
              <div className="card p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Chants sauvegardés</p>
                {savedChants.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-green-700 py-1">
                    <Check size={13} /> {name}
                  </div>
                ))}
                <button onClick={handleFinish} className="btn-secondary w-full mt-3 text-xs">
                  Terminer l'import
                </button>
              </div>
            )}

            {/* Chant form */}
            {selectedIndices.length > 0 && (
              <div className="card p-4 border-primary/30 border-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                  {selectedIndices.length} slide(s) sélectionnée(s)
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="label">Numéro</label>
                    <input className="input" type="number" placeholder="15" value={chantForm.numero} onChange={e => setChantForm(f => ({ ...f, numero: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Nom du chant</label>
                    <input className="input" placeholder="Nós somos o povo..." value={chantForm.nom} onChange={e => setChantForm(f => ({ ...f, nom: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Catégorie</label>
                    <select className="input" value={chantForm.categorie} onChange={e => setChantForm(f => ({ ...f, categorie: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Langue</label>
                    <select className="input" value={chantForm.langue} onChange={e => setChantForm(f => ({ ...f, langue: e.target.value }))}>
                      <option value="PT">PT</option>
                      <option value="FR">FR</option>
                      <option value="BILINGUAL">Bilingue</option>
                    </select>
                  </div>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <button onClick={handleSaveChant} disabled={saving} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                  <Plus size={14} /> {saving ? 'Sauvegarde...' : 'Ajouter à la bibliothèque'}
                </button>
              </div>
            )}

            {selectedIndices.length === 0 && (
              <div className="card p-6 text-center text-gray-400">
                <ChevronRight className="mx-auto mb-2" size={24} />
                <p className="text-sm">Sélectionnez des slides à gauche pour créer un chant</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
