'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMesses, deleteMesse, getGeneratePptxUrl, getGenerateListeUrl, Messe } from '@/lib/api'
import { CalendarDays, FileDown, Trash2, Plus, FileText } from 'lucide-react'

export default function Home() {
  const [messes, setMesses] = useState<Messe[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    getMesses()
      .then(setMesses)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette messe ?')) return
    await deleteMesse(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Messes</h1>
          <p className="text-sm text-gray-500 mt-1">Historique et génération des PowerPoints</p>
        </div>
        <Link href="/composer" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Composer une messe
        </Link>
      </div>

      {loading && (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      )}

      {!loading && messes.length === 0 && (
        <div className="card p-12 text-center">
          <CalendarDays className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Aucune messe composée</p>
          <p className="text-sm text-gray-400 mt-1">
            Commencez par importer vos chants, puis composez votre première messe.
          </p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link href="/importer" className="btn-secondary">Importer des chants</Link>
            <Link href="/composer" className="btn-primary">Composer une messe</Link>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {messes.map(messe => (
          <div key={messe.id} className="card p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gold font-bold text-base">✠</span>
                <h2 className="font-semibold text-primary">
                  {messe.titre || 'Messe'}
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(messe.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {messe.sections.filter(s => s.chant_id).length} chant(s) sélectionné(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/composer?edit=${messe.id}`} className="btn-secondary text-xs px-3 py-1.5">
                Modifier
              </Link>
              <a
                href={getGenerateListeUrl(messe.id)}
                target="_blank"
                className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
              >
                <FileText size={13} /> Liste PDF
              </a>
              <a
                href={getGeneratePptxUrl(messe.id)}
                target="_blank"
                className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
              >
                <FileDown size={13} /> PowerPoint
              </a>
              <button
                onClick={() => handleDelete(messe.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
