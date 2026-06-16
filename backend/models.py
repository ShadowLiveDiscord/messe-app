from sqlalchemy import Column, String, Integer, Text, LargeBinary, DateTime, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base


class Chant(Base):
    __tablename__ = "chants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero = Column(Integer, unique=True, nullable=False, index=True)
    nom = Column(String(255), nullable=False)
    categorie = Column(String(100), nullable=False)
    langue = Column(String(20), default="PT")
    notes = Column(Text, nullable=True)
    pptx_data = Column(LargeBinary, nullable=True)
    nombre_slides = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    sections = relationship("MesseSection", back_populates="chant")


SECTION_TYPES = [
    "entree",
    "kyrie",
    "gloria",
    "coleta",
    "leitura1",
    "salmo",
    "leitura2",
    "aleluia",
    "evangelho",
    "homilia",
    "credo",
    "oracao_universal",
    "ofertorio",
    "oracao_eucaristica",
    "consagracao",
    "anamnese",
    "pai_nosso",
    "comunhao",
    "conclusao",
    "saida",
    "intencao",
    "anuncios",
    "datas",
    "adicional",
]


class Messe(Base):
    __tablename__ = "messes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(Date, nullable=False)
    titre = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sections = relationship(
        "MesseSection",
        back_populates="messe",
        order_by="MesseSection.ordre",
        cascade="all, delete-orphan",
    )


class MesseSection(Base):
    __tablename__ = "messe_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    messe_id = Column(UUID(as_uuid=True), ForeignKey("messes.id", ondelete="CASCADE"))
    section_type = Column(String(100), nullable=False)
    ordre = Column(Integer, nullable=False)
    chant_id = Column(UUID(as_uuid=True), ForeignKey("chants.id"), nullable=True)
    texte_libre = Column(Text, nullable=True)
    titre_libre = Column(String(255), nullable=True)

    messe = relationship("Messe", back_populates="sections")
    chant = relationship("Chant", back_populates="sections")
