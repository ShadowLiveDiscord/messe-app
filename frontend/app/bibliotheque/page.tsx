'use client'
import { useEffect, useState } from 'react'
import { getChants, createChant, updateChant, deleteChant, uploadChantPptx, Chant, CATEGORIES } from '@/lib/api'
import { Plus, Trash2, Upload, Edit2, Check, X, Music } from 'lucide-react'

const LANGUE_OPTIONS = ['PT', 'FR', 'BILINGUAL']

export default function Bibliotheque() {
  const [chants, setChants] = useState<Chant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ numero: '', nom: '', categorie: 'entree', langue: 'PT', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    getChants({ search: search || undefined, categorie: catFilter || undefined })
      .then(setChants)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, catFilter])

  const resetForm = () => {
    setForm({ numero: '', nom: '', categorie: 'entree', langue: 'PT', notes: '' })
    setEditId(null)
    setError('')
  }

  const startEdit = (c: Chant) => {
    setForm({
      numero: String(c.numero),
      nom: c.nom,
      categorie: c.categorie,
      langue: c.langue,
      notes: c.notes || '',
    })
    setEditId(c.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.numero || !form.nom) { setError('Numéro et nom requis'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        numero: parseInt(form.numero),
        nom: form.nom,
        categorie: form.categorie,
        langue: form.langue,
        notes: form.notes || null,
      }
      if (editId) {
        await updateChant(editId, payload)
      } else {
        await createChant(payload)
      }
      setShowForm(false)
      resetForm()
      load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce chant ?')) return
    await deleteChant(id)
    load()
  }

  const handleUploadPptx = async (chant: Chant) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pptx'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      await uploadChantPptx(chant.id, file)
      load()
    }
    input.click()
  }

  const catLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label || v

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Bibliothèque</h1>
          <p className="text-sm text-gray-500 mt-1">{chants.length} chant(s)</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter un chant
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Rechercher par nom ou numéro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input max-w-[200px]" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card p-5 mb-6 border-primary/30 border-2">
          <h2 className="font-semibold text-primary mb-4">{editId ? 'Modifier le chant' : 'Nouveau chant'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numéro</label>
              <input className="input" type="number" placeholder="ex: 15" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Nom du chant</label>
              <input className="input" placeholder="ex: Nós somos o povo de Deus" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div>
              <label className="label">Langue</label>
              <select className="input" value={form.langue} onChange={e => setForm(f => ({ ...f, langue: e.target.value }))}>
                {LANGUE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" placeholder="Optionnel" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-1.5">
              <Check size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm() }} className="btn-secondary flex items-center gap-1.5">
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      )}

      {loading && <div className="text-center py-20 text-gray-400">Chargement...</div>}

      {!loading && chants.length === 0 && (
        <div className="card p-12 text-center">
          <Music className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">Aucun chant dans la bibliothèque</p>
          <p className="text-sm text-gray-400 mt-1">Utilisez l'import pour extraire les chants de votre fichier pptx existant.</p>
        </div>
      )}

      <div className="grid gap-3">
        {chants.map(c => (
          <div key={c.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {c.numero}
              </div>
              <div>
                <p className="font-medium text-gray-900">{c.nom}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge bg-blue-50 text-blue-700">{catLabel(c.categorie)}</span>
                  <span className="badge bg-gray-100 text-gray-500">{c.langue}</span>
                  {c.has_pptx && (
                    <span className="badge bg-green-50 text-green-700">{c.nombre_slides} slide(s)</span>
                  )}
                  {!c.has_pptx && (
                    <span className="badge bg-orange-50 text-orange-600">Sans pptx</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleUploadPptx(c)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Uploader le pptx">
                <Upload size={15} />
              </button>
              <button onClick={() => startEdit(c)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
