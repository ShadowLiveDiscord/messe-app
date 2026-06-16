from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from database import get_db
from models import Chant
from schemas import ChantCreate, ChantResponse, ChantUpdate
import pptx_utils

router = APIRouter(prefix="/chants", tags=["chants"])


def _to_response(chant: Chant) -> ChantResponse:
    return ChantResponse(
        id=chant.id,
        numero=chant.numero,
        nom=chant.nom,
        categorie=chant.categorie,
        langue=chant.langue,
        notes=chant.notes,
        nombre_slides=chant.nombre_slides,
        has_pptx=chant.pptx_data is not None,
        created_at=chant.created_at,
    )


@router.get("", response_model=List[ChantResponse])
def list_chants(
    categorie: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Chant)
    if categorie:
        query = query.filter(Chant.categorie == categorie)
    if search:
        query = query.filter(
            (Chant.nom.ilike(f"%{search}%"))
            | (Chant.numero.cast(str).like(f"%{search}%"))
        )
    chants = query.order_by(Chant.numero).all()
    return [_to_response(c) for c in chants]


@router.post("", response_model=ChantResponse, status_code=201)
def create_chant(chant_in: ChantCreate, db: Session = Depends(get_db)):
    existing = db.query(Chant).filter(Chant.numero == chant_in.numero).first()
    if existing:
        raise HTTPException(400, f"Le numéro {chant_in.numero} est déjà utilisé")

    chant = Chant(**chant_in.model_dump())
    db.add(chant)
    db.commit()
    db.refresh(chant)
    return _to_response(chant)


@router.get("/{chant_id}", response_model=ChantResponse)
def get_chant(chant_id: uuid.UUID, db: Session = Depends(get_db)):
    chant = db.query(Chant).filter(Chant.id == chant_id).first()
    if not chant:
        raise HTTPException(404, "Chant introuvable")
    return _to_response(chant)


@router.put("/{chant_id}", response_model=ChantResponse)
def update_chant(
    chant_id: uuid.UUID, update: ChantUpdate, db: Session = Depends(get_db)
):
    chant = db.query(Chant).filter(Chant.id == chant_id).first()
    if not chant:
        raise HTTPException(404, "Chant introuvable")

    for field, value in update.model_dump(exclude_none=True).items():
        setattr(chant, field, value)

    db.commit()
    db.refresh(chant)
    return _to_response(chant)


@router.delete("/{chant_id}", status_code=204)
def delete_chant(chant_id: uuid.UUID, db: Session = Depends(get_db)):
    chant = db.query(Chant).filter(Chant.id == chant_id).first()
    if not chant:
        raise HTTPException(404, "Chant introuvable")
    db.delete(chant)
    db.commit()


@router.post("/{chant_id}/upload-pptx", response_model=ChantResponse)
async def upload_pptx(
    chant_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    chant = db.query(Chant).filter(Chant.id == chant_id).first()
    if not chant:
        raise HTTPException(404, "Chant introuvable")

    pptx_bytes = await file.read()
    nb_slides = pptx_utils.count_slides(pptx_bytes)

    chant.pptx_data = pptx_bytes
    chant.nombre_slides = nb_slides
    db.commit()
    db.refresh(chant)
    return _to_response(chant)


@router.get("/{chant_id}/download-pptx")
def download_pptx(chant_id: uuid.UUID, db: Session = Depends(get_db)):
    chant = db.query(Chant).filter(Chant.id == chant_id).first()
    if not chant or not chant.pptx_data:
        raise HTTPException(404, "Fichier pptx introuvable")

    filename = f"chant_{chant.numero}_{chant.nom[:30]}.pptx"
    return Response(
        content=chant.pptx_data,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
