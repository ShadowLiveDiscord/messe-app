from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


class ChantBase(BaseModel):
    numero: int
    nom: str
    categorie: str
    langue: str = "PT"
    notes: Optional[str] = None


class ChantCreate(ChantBase):
    pass


class ChantUpdate(BaseModel):
    numero: Optional[int] = None
    nom: Optional[str] = None
    categorie: Optional[str] = None
    langue: Optional[str] = None
    notes: Optional[str] = None


class ChantResponse(ChantBase):
    id: UUID
    nombre_slides: int
    has_pptx: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MesseSectionCreate(BaseModel):
    section_type: str
    ordre: int
    chant_id: Optional[UUID] = None
    texte_libre: Optional[str] = None
    titre_libre: Optional[str] = None


class MesseSectionResponse(MesseSectionCreate):
    id: UUID
    chant: Optional[ChantResponse] = None

    class Config:
        from_attributes = True


class MesseCreate(BaseModel):
    date: date
    titre: Optional[str] = None
    notes: Optional[str] = None
    sections: List[MesseSectionCreate] = []


class MesseUpdate(BaseModel):
    date: Optional[date] = None
    titre: Optional[str] = None
    notes: Optional[str] = None
    sections: Optional[List[MesseSectionCreate]] = None


class MesseResponse(BaseModel):
    id: UUID
    date: date
    titre: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    sections: List[MesseSectionResponse] = []

    class Config:
        from_attributes = True


class SlidePreview(BaseModel):
    index: int
    texts: List[str]


class ImportParseResponse(BaseModel):
    total_slides: int
    slides: List[SlidePreview]
    session_id: str


class ImportCreateChant(BaseModel):
    slide_indices: List[int]
    numero: int
    nom: str
    categorie: str
    langue: str = "PT"
    notes: Optional[str] = None
