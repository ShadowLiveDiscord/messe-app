# Déploiement

## 1. Variables d'environnement à configurer

### Backend (Render)
- `DATABASE_URL` : URL PostgreSQL Supabase (ex: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`)
- `FRONTEND_URL` : URL de ton frontend Vercel (ex: `https://messe-app.vercel.app`)

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` : URL de ton backend Render (ex: `https://messe-app-backend.onrender.com`)

## 2. Render (Backend)

1. Nouveau service Web > connecte ton repo GitHub
2. Root directory : `backend`
3. Runtime : Python 3
4. Build command : `pip install -r requirements.txt`
5. Start command : `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Ajoute les variables d'environnement ci-dessus

## 3. Vercel (Frontend)

1. Nouveau projet > connecte ton repo GitHub
2. Root directory : `frontend`
3. Framework : Next.js (détection automatique)
4. Ajoute la variable `NEXT_PUBLIC_API_URL`

## 4. Supabase (Base de données)

L'app crée les tables automatiquement au démarrage (`init_db()`).
Aucune migration manuelle nécessaire pour le premier déploiement.
