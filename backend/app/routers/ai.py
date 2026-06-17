from __future__ import annotations

import io
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.ai import generate_design_suggestions, suggest
from app.auth import get_current_user
from app.db import get_db
from app.models import AiSuggestion, DesignRequest, User
from app.schemas import (
    AiSuggestRequest,
    AiSuggestResponse,
    AiSuggestionPublic,
    DesignRequestCreate,
    DesignRequestPublic,
    SavedDesignPublic,
)

router = APIRouter(prefix="/ai", tags=["ai"])


def _image_payload_json_to_dict(raw: str) -> dict[str, str]:
    try:
        data = json.loads(raw or "{}")
    except json.JSONDecodeError:
        return {}
    if not isinstance(data, dict):
        return {}
    return {str(k): str(v) for k, v in data.items() if isinstance(v, str)}


def _suggestion_public(row: AiSuggestion) -> AiSuggestionPublic:
    return AiSuggestionPublic(
        id=row.id,
        request_id=row.request_id,
        interior_suggestion=row.interior_suggestion,
        exterior_suggestion=row.exterior_suggestion,
        color_palette=row.color_palette,
        material_suggestion=row.material_suggestion,
        lighting_suggestion=row.lighting_suggestion,
        image_url=row.image_url,
        image_urls=_image_payload_json_to_dict(row.image_url),
        provider=row.provider,
        note=row.note or "",
        created_at=row.created_at,
    )


def _saved_design_public(row: DesignRequest) -> SavedDesignPublic:
    if not row.suggestion:
        raise HTTPException(status_code=500, detail="Saved design is missing AI suggestions")
    return SavedDesignPublic(
        request=DesignRequestPublic.model_validate(row),
        suggestion=_suggestion_public(row.suggestion),
    )


@router.post("/suggest", response_model=AiSuggestResponse)
def ai_suggest(payload: AiSuggestRequest, user: User = Depends(get_current_user)):
    result = suggest(prompt=payload.prompt, style=payload.style)
    return AiSuggestResponse(
        title=result.title,
        description=result.description,
        suggestions=result.suggestions,
        images_base64_png=result.images_base64_png,
        provider=result.provider,
        note=result.note,
    )


@router.post("/designs/generate", response_model=SavedDesignPublic)
def generate_design(
    payload: DesignRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request_row = DesignRequest(user_id=user.id, **payload.model_dump())
    db.add(request_row)
    db.flush()

    result = generate_design_suggestions(**payload.model_dump())
    suggestion_row = AiSuggestion(
        request_id=request_row.id,
        interior_suggestion=result.interior_suggestion,
        exterior_suggestion=result.exterior_suggestion,
        color_palette=result.color_palette,
        material_suggestion=result.material_suggestion,
        lighting_suggestion=result.lighting_suggestion,
        image_url=json.dumps(result.images_base64_png),
        provider=result.provider,
        note=result.note or "",
    )
    db.add(suggestion_row)
    db.commit()
    db.refresh(request_row)
    request_row = db.scalar(
        select(DesignRequest)
        .options(selectinload(DesignRequest.suggestion))
        .where(DesignRequest.id == request_row.id, DesignRequest.user_id == user.id)
    )
    if not request_row:
        raise HTTPException(status_code=404, detail="Saved design not found")
    return _saved_design_public(request_row)


@router.get("/designs", response_model=list[SavedDesignPublic])
def list_saved_designs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(DesignRequest)
        .options(selectinload(DesignRequest.suggestion))
        .where(DesignRequest.user_id == user.id)
        .order_by(DesignRequest.created_at.desc())
    ).all()
    return [_saved_design_public(row) for row in rows if row.suggestion]


@router.get("/designs/{design_id}", response_model=SavedDesignPublic)
def get_saved_design(
    design_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.scalar(
        select(DesignRequest)
        .options(selectinload(DesignRequest.suggestion))
        .where(DesignRequest.id == design_id, DesignRequest.user_id == user.id)
    )
    if not row or not row.suggestion:
        raise HTTPException(status_code=404, detail="Saved design not found")
    return _saved_design_public(row)


@router.delete("/designs/{design_id}", status_code=204)
def delete_saved_design(
    design_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.scalar(
        select(DesignRequest)
        .where(DesignRequest.id == design_id, DesignRequest.user_id == user.id)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Saved design not found")
    db.delete(row)
    db.commit()
    return None


@router.get("/designs/{design_id}/report")
def download_design_report(
    design_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.scalar(
        select(DesignRequest)
        .options(selectinload(DesignRequest.suggestion))
        .where(DesignRequest.id == design_id, DesignRequest.user_id == user.id)
    )
    if not row or not row.suggestion:
        raise HTTPException(status_code=404, detail="Saved design not found")

    suggestion = row.suggestion
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=42, rightMargin=42, topMargin=42, bottomMargin=42)
    styles = getSampleStyleSheet()
    title_style = styles["Heading1"]
    body_style = styles["BodyText"]
    body_style.leading = 16
    label_style = ParagraphStyle(
        "Label",
        parent=styles["Heading3"],
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=8,
    )

    story = [
        Paragraph("ConstructHub AI Design Report", title_style),
        Spacer(1, 12),
        Paragraph(f"<b>{row.style} {row.house_type}</b> for <b>{row.room_type}</b> in <b>{row.location}</b>", body_style),
        Spacer(1, 16),
    ]

    table = Table(
        [
            ["House Type", row.house_type, "Budget", row.budget],
            ["Style", row.style, "Room Type", row.room_type],
            ["Plot Size", row.plot_size, "Location", row.location],
        ],
        colWidths=[90, 150, 90, 150],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eff6ff")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ]
        )
    )
    story.extend([table, Spacer(1, 18)])

    sections = [
        ("Interior Design", suggestion.interior_suggestion),
        ("Exterior Design", suggestion.exterior_suggestion),
        ("Color Combination", suggestion.color_palette),
        ("Material Suggestions", suggestion.material_suggestion),
        ("Lighting Ideas", suggestion.lighting_suggestion),
    ]
    for heading, text in sections:
        story.append(Paragraph(heading, label_style))
        story.append(Paragraph(text.replace("\n", "<br/>"), body_style))
        story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)
    filename = f"constructhub-design-{row.id}.pdf"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)
