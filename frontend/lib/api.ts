import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

export interface Chant {
  id: string
  numero: number
  nom: string
  categorie: string
  langue: string
  notes: string | null
  nombre_slides: number
  has_pptx: boolean
  created_at: string
}

export interface MesseSection {
  id: string
  section_type: string
  ordre: number
  chant_id: string | null
  texte_libre: string | null
  titre_libre: string | null
  chant: Chant | null
}

export interface Messe {
  id: string
  date: string
  titre: string | null
  notes: string | null
  created_at: string
  sections: MesseSection[]
}

export interface SlidePreview {
  index: number
  texts: string[]
}

export interface ParseResponse {
  total_slides: number
  slides: SlidePreview[]
  session_id: string
}

// Chants
export const getChants = (params?: { categorie?: string; search?: string }) =>
  API.get<Chant[]>('/chants', { params }).then(r => r.data)

export const createChant = (data: Omit<Chant, 'id' | 'created_at' | 'has_pptx' | 'nombre_slides'>) =>
  API.post<Chant>('/chants', data).then(r => r.data)

export const updateChant = (id: string, data: Partial<Chant>) =>
  API.put<Chant>(`/chants/${id}`, data).then(r => r.data)

export const deleteChant = (id: string) => API.delete(`/chants/${id}`)

export const uploadChantPptx = (id: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return API.post<Chant>(`/chants/${id}/upload-pptx`, form).then(r => r.data)
}

// Messes
export const getMesses = () => API.get<Messe[]>('/messes').then(r => r.data)

export const getMesse = (id: string) => API.get<Messe>(`/messes/${id}`).then(r => r.data)

export const createMesse = (data: {
  date: string
  titre?: string
  notes?: string
  sections: Omit<MesseSection, 'id' | 'chant'>[]
}) => API.post<Messe>('/messes', data).then(r => r.data)

export const updateMesse = (id: string, data: Parameters<typeof createMesse>[0]) =>
  API.put<Messe>(`/messes/${id}`, data).then(r => r.data)

export const deleteMesse = (id: string) => API.delete(`/messes/${id}`)

// Import
export const parsePptx = (file: File): Promise<ParseResponse> => {
  const form = new FormData()
  form.append('file', file)
  return API.post<ParseResponse>('/import/parse', form).then(r => r.data)
}

export const createChantFromSlides = (
  sessionId: string,
  data: {
    slide_indices: number[]
    numero: number
    nom: string
    categorie: string
    langue: string
    notes?: string
  }
) => API.post<Chant>(`/import/create-chant/${sessionId}`, data).then(r => r.data)

export const clearImportSession = (sessionId: string) =>
  API.delete(`/import/session/${sessionId}`)

// Generate
export const getGeneratePptxUrl = (messeId: string) =>
  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/generate/pptx/${messeId}`

export const getGenerateListeUrl = (messeId: string) =>
  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/generate/liste/${messeId}`

export const CATEGORIES = [
  { value: 'entree', label: "Chant d'entrée" },
  { value: 'kyrie', label: 'Kyrie' },
  { value: 'gloria', label: 'Gloria' },
  { value: 'salmo', label: 'Salmo responsorial' },
  { value: 'aleluia', label: 'Aleluia / Aclamação' },
  { value: 'credo', label: 'Credo' },
  { value: 'oracao_universal', label: 'Oração Universal' },
  { value: 'ofertorio', label: 'Ofertório' },
  { value: 'comunhao', label: 'Comunhão' },
  { value: 'saida', label: 'Chant de sortie' },
  { value: 'adicional', label: 'Adicional / Autre' },
]

export const SECTION_LABELS: Record<string, string> = {
  entree: "Chant d'entrée",
  kyrie: 'Kyrie',
  gloria: 'Gloria',
  coleta: 'Oração Coleta',
  leitura1: 'Leitura I',
  salmo: 'Salmo',
  leitura2: 'Leitura II',
  aleluia: 'Aleluia',
  evangelho: 'Evangelho',
  homilia: 'Homilia',
  credo: 'Credo',
  oracao_universal: 'Oração Universal',
  ofertorio: 'Ofertório',
  oracao_eucaristica: 'Oração Eucarística',
  consagracao: 'Consagração',
  anamnese: 'Anamnese',
  pai_nosso: 'Pai Nosso',
  comunhao: 'Comunhão',
  conclusao: 'Ritos de Conclusão',
  saida: 'Chant de sortie',
  intencao: 'Intenção de Missa',
  anuncios: 'Anúncios',
  datas: 'Datas',
  adicional: 'Adicional',
}
