from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import uuid

from database import get_db
from models import Chant
from schemas import ImportParseResponse, ImportCreateChant, ChantResponse, SlidePreview
import pptx_utils

router = APIRouter(prefix="/import", tags=["import"])

# Temporary in-memory store for uploaded pptx during import session
# In production this could be a temp file or Redis
_upload_cache: dict[str, bytes] = {}


@router.post("/parse", response_model=ImportParseResponse)
async def parse_pptx(file: UploadFile = File(...)):
    """
    Upload a pptx file and get back a preview of all slides (text content).
    Returns a session_id to use when creating chants from specific slides.
    """
    pptx_bytes = await file.read()
    slides = pptx_utils.get_slide_texts(pptx_bytes)

    session_id = str(uuid.uuid4())
    _upload_cache[session_id] = pptx_bytes

    return ImportParseResponse(
        total_slides=len(slides),
        slides=[SlidePreview(index=s["index"], texts=s["texts"]) for s in slides],
        session_id=session_id,
    )


@router.post("/create-chant/{session_id}", response_model=ChantResponse, status_code=201)
def create_chant_from_slides(
    session_id: str,
    chant_in: ImportCreateChant,
    db: Session = Depends(get_db),
):
    """
    Create a chant in the database from specific slides of a previously uploaded pptx.
    """
    pptx_bytes = _upload_cache.get(session_id)
    if not pptx_bytes:
        raise HTTPException(404, "Session d'import introuvable ou expirée. Re-uploadez le fichier.")

    existing = db.query(Chant).filter(Chant.numero == chant_in.numero).first()
    if existing:
        raise HTTPException(400, f"Le numéro {chant_in.numero} est déjà utilisé")

    extracted = pptx_utils.extract_slides_as_pptx(pptx_bytes, chant_in.slide_indices)

    chant = Chant(
        numero=chant_in.numero,
        nom=chant_in.nom,
        categorie=chant_in.categorie,
        langue=chant_in.langue,
        notes=chant_in.notes,
        pptx_data=extracted,
        nombre_slides=len(chant_in.slide_indices),
    )
    db.add(chant)
    db.commit()
    db.refresh(chant)

    return ChantResponse(
        id=chant.id,
        numero=chant.numero,
        nom=chant.nom,
        categorie=chant.categorie,
        langue=chant.langue,
        notes=chant.notes,
        nombre_slides=chant.nombre_slides,
        has_pptx=True,
        created_at=chant.created_at,
    )


@router.delete("/session/{session_id}", status_code=204)
def clear_session(session_id: str):
    """Free the uploaded file from memory once import is complete."""
    _upload_cache.pop(session_id, None)
