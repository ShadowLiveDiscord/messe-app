from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
import uuid

from database import get_db
from models import Messe, MesseSection, Chant
from schemas import MesseCreate, MesseResponse, MesseUpdate, ChantResponse, MesseSectionResponse

router = APIRouter(prefix="/messes", tags=["messes"])


def _build_response(messe: Messe) -> MesseResponse:
    sections = []
    for s in messe.sections:
        chant_resp = None
        if s.chant:
            chant_resp = ChantResponse(
                id=s.chant.id,
                numero=s.chant.numero,
                nom=s.chant.nom,
                categorie=s.chant.categorie,
                langue=s.chant.langue,
                notes=s.chant.notes,
                nombre_slides=s.chant.nombre_slides,
                has_pptx=s.chant.pptx_data is not None,
                created_at=s.chant.created_at,
            )
        sections.append(
            MesseSectionResponse(
                id=s.id,
                section_type=s.section_type,
                ordre=s.ordre,
                chant_id=s.chant_id,
                texte_libre=s.texte_libre,
                titre_libre=s.titre_libre,
                chant=chant_resp,
            )
        )
    return MesseResponse(
        id=messe.id,
        date=messe.date,
        titre=messe.titre,
        notes=messe.notes,
        created_at=messe.created_at,
        sections=sections,
    )


@router.get("", response_model=List[MesseResponse])
def list_messes(db: Session = Depends(get_db)):
    messes = (
        db.query(Messe)
        .options(joinedload(Messe.sections).joinedload(MesseSection.chant))
        .order_by(Messe.date.desc())
        .all()
    )
    return [_build_response(m) for m in messes]


@router.post("", response_model=MesseResponse, status_code=201)
def create_messe(messe_in: MesseCreate, db: Session = Depends(get_db)):
    messe = Messe(date=messe_in.date, titre=messe_in.titre, notes=messe_in.notes)
    db.add(messe)
    db.flush()

    for sec in messe_in.sections:
        section = MesseSection(
            messe_id=messe.id,
            section_type=sec.section_type,
            ordre=sec.ordre,
            chant_id=sec.chant_id,
            texte_libre=sec.texte_libre,
            titre_libre=sec.titre_libre,
        )
        db.add(section)

    db.commit()
    db.refresh(messe)
    messe = (
        db.query(Messe)
        .options(joinedload(Messe.sections).joinedload(MesseSection.chant))
        .filter(Messe.id == messe.id)
        .first()
    )
    return _build_response(messe)


@router.get("/{messe_id}", response_model=MesseResponse)
def get_messe(messe_id: uuid.UUID, db: Session = Depends(get_db)):
    messe = (
        db.query(Messe)
        .options(joinedload(Messe.sections).joinedload(MesseSection.chant))
        .filter(Messe.id == messe_id)
        .first()
    )
    if not messe:
        raise HTTPException(404, "Messe introuvable")
    return _build_response(messe)


@router.put("/{messe_id}", response_model=MesseResponse)
def update_messe(
    messe_id: uuid.UUID, update: MesseUpdate, db: Session = Depends(get_db)
):
    messe = db.query(Messe).filter(Messe.id == messe_id).first()
    if not messe:
        raise HTTPException(404, "Messe introuvable")

    if update.date is not None:
        messe.date = update.date
    if update.titre is not None:
        messe.titre = update.titre
    if update.notes is not None:
        messe.notes = update.notes

    if update.sections is not None:
        db.query(MesseSection).filter(MesseSection.messe_id == messe_id).delete()
        for sec in update.sections:
            section = MesseSection(
                messe_id=messe.id,
                section_type=sec.section_type,
                ordre=sec.ordre,
                chant_id=sec.chant_id,
                texte_libre=sec.texte_libre,
                titre_libre=sec.titre_libre,
            )
            db.add(section)

    db.commit()
    messe = (
        db.query(Messe)
        .options(joinedload(Messe.sections).joinedload(MesseSection.chant))
        .filter(Messe.id == messe_id)
        .first()
    )
    return _build_response(messe)


@router.delete("/{messe_id}", status_code=204)
def delete_messe(messe_id: uuid.UUID, db: Session = Depends(get_db)):
    messe = db.query(Messe).filter(Messe.id == messe_id).first()
    if not messe:
        raise HTTPException(404, "Messe introuvable")
    db.delete(messe)
    db.commit()
