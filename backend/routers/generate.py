from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import cm
import uuid
import io

from database import get_db
from models import Messe, MesseSection
import pptx_utils

router = APIRouter(prefix="/generate", tags=["generate"])

SECTION_LABELS = {
    "entree": "Chant d'entrée",
    "kyrie": "Kyrie",
    "gloria": "Gloria",
    "coleta": "Oração Coleta",
    "leitura1": "Leitura I",
    "salmo": "Salmo",
    "leitura2": "Leitura II",
    "aleluia": "Aleluia",
    "evangelho": "Evangelho",
    "homilia": "Homilia",
    "credo": "Credo",
    "oracao_universal": "Oração Universal",
    "ofertorio": "Ofertório",
    "oracao_eucaristica": "Oração Eucarística",
    "consagracao": "Consagração",
    "anamnese": "Anamnese",
    "pai_nosso": "Pai Nosso",
    "comunhao": "Comunhão",
    "conclusao": "Ritos de Conclusão",
    "saida": "Chant de sortie",
    "intencao": "Intenção de Missa",
    "anuncios": "Anúncios",
    "datas": "Datas",
    "adicional": "Adicional",
}


@router.get("/pptx/{messe_id}")
def generate_pptx(messe_id: uuid.UUID, db: Session = Depends(get_db)):
    """Generate and download the full PowerPoint for a mass."""
    messe = (
        db.query(Messe)
        .options(joinedload(Messe.sections).joinedload(MesseSection.chant))
        .filter(Messe.id == messe_id)
        .first()
    )
    if not messe:
        raise HTTPException(404, "Messe introuvable")

    pptx_parts: list[bytes] = []
    missing: list[str] = []

    for section in sorted(messe.sections, key=lambda s: s.ordre):
        if section.chant_id and section.chant:
            if section.chant.pptx_data:
                pptx_parts.append(bytes(section.chant.pptx_data))
            else:
                missing.append(
                    f"{SECTION_LABELS.get(section.section_type, section.section_type)}: "
                    f"chant #{section.chant.numero} sans fichier pptx"
                )

    if missing:
        raise HTTPException(
            422,
            f"Impossible de générer : {len(missing)} chant(s) sans fichier pptx : "
            + " | ".join(missing),
        )

    if not pptx_parts:
        raise HTTPException(422, "Aucun contenu pptx à générer pour cette messe")

    merged_bytes = pptx_utils.merge_pptx_list(pptx_parts)

    date_str = messe.date.strftime("%Y-%m-%d")
    titre = messe.titre or "Messe"
    filename = f"Messe_{date_str}_{titre[:30]}.pptx"

    return Response(
        content=merged_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/liste/{messe_id}")
def generate_liste(messe_id: uuid.UUID, db: Session = Depends(get_db)):
    """Generate and download a PDF song list for a mass."""
    messe = (
        db.query(Messe)
        .options(joinedload(Messe.sections).joinedload(MesseSection.chant))
        .filter(Messe.id == messe_id)
        .first()
    )
    if not messe:
        raise HTTPException(404, "Messe introuvable")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=6,
        textColor=colors.HexColor("#1e3a5f"),
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=11,
        spaceAfter=20,
        textColor=colors.grey,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.grey,
        spaceAfter=2,
    )
    chant_style = ParagraphStyle(
        "Chant",
        parent=styles["Normal"],
        fontSize=12,
        spaceAfter=10,
    )

    story = []

    titre_messe = messe.titre or "Messe"
    story.append(Paragraph(titre_messe, title_style))
    story.append(Paragraph(messe.date.strftime("%d/%m/%Y"), subtitle_style))

    for section in sorted(messe.sections, key=lambda s: s.ordre):
        if section.chant_id and section.chant:
            label = SECTION_LABELS.get(section.section_type, section.section_type)
            story.append(Paragraph(label.upper(), section_style))
            chant = section.chant
            story.append(
                Paragraph(f"<b>#{chant.numero}</b>  {chant.nom}", chant_style)
            )

    doc.build(story)
    buf.seek(0)

    date_str = messe.date.strftime("%Y-%m-%d")
    filename = f"Liste_chants_{date_str}.pdf"

    return Response(
        content=buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
