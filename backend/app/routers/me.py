from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import ClientProfile, CompanyProfile, CompanyProject, User, UserRole
from app.schemas import (
    ClientProfilePublic,
    ClientProfileUpsert,
    CompanyProfilePublic,
    CompanyProjectPublic,
    CompanyProfileUpsert,
    UserPublic,
)

router = APIRouter(tags=["me"])
uploads_dir = Path("backend/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)


def _sync_company_completed_projects(db: Session, company_id: int) -> None:
    profile = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).one_or_none()
    if profile is None:
        return
    profile.completed_projects = db.query(CompanyProject).filter(CompanyProject.company_id == company_id).count()


@router.get("/me", response_model=UserPublic)
def read_me(user: User = Depends(get_current_user)):
    return UserPublic.model_validate(user)


@router.get("/me/company-profile", response_model=CompanyProfilePublic | None)
def read_company_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only company accounts can access this")
    return db.query(CompanyProfile).filter(CompanyProfile.user_id == user.id).one_or_none()


@router.put("/me/company-profile", response_model=CompanyProfilePublic)
def upsert_company_profile(
    payload: CompanyProfileUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company accounts can update a company profile",
        )

    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user.id).one_or_none()
    if profile is None:
        profile = CompanyProfile(user_id=user.id, name=payload.name)
        db.add(profile)

    profile.name = payload.name
    profile.phone = payload.phone
    profile.location = payload.location
    profile.description = payload.description
    profile.website = payload.website
    profile.services = payload.services
    profile.logo_url = payload.logo_url
    profile.completed_projects = payload.completed_projects
    profile.project_price_range = payload.project_price_range
    user.name = payload.name
    user.phone = payload.phone
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me/client-profile", response_model=ClientProfilePublic | None)
def read_client_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only client accounts can access this")
    return db.query(ClientProfile).filter(ClientProfile.user_id == user.id).one_or_none()


@router.put("/me/client-profile", response_model=ClientProfilePublic)
def upsert_client_profile(
    payload: ClientProfileUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only client accounts can update a client profile",
        )

    profile = db.query(ClientProfile).filter(ClientProfile.user_id == user.id).one_or_none()
    if profile is None:
        profile = ClientProfile(user_id=user.id, name=payload.name)
        db.add(profile)

    profile.name = payload.name
    profile.location = payload.location
    profile.phone = payload.phone
    user.name = payload.name
    user.phone = payload.phone
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me/company-projects", response_model=list[CompanyProjectPublic])
def list_my_company_projects(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only company accounts can access this")
    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user.id).one_or_none()
    if profile is None:
        return []
    return (
        db.query(CompanyProject)
        .filter(CompanyProject.company_id == profile.id)
        .order_by(CompanyProject.created_at.desc())
        .all()
    )


@router.post("/me/company-projects", response_model=CompanyProjectPublic)
async def create_company_project(
    client_name: str = Form(...),
    title: str = Form(...),
    project_price: str = Form(...),
    summary: str = Form(default=""),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only company accounts can add projects")

    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user.id).one_or_none()
    if profile is None:
        raise HTTPException(status_code=400, detail="Create your company profile first")

    original_name = image.filename or "project-image"
    ext = Path(original_name).suffix or ".jpg"
    stored_name = f"company-project-{uuid4().hex}{ext}"
    target = uploads_dir / stored_name
    target.write_bytes(await image.read())

    project = CompanyProject(
        company_id=profile.id,
        client_name=client_name.strip(),
        title=title.strip(),
        summary=summary.strip(),
        project_price=project_price.strip(),
        image_url=f"/uploads/{stored_name}",
    )
    db.add(project)
    db.flush()
    _sync_company_completed_projects(db, profile.id)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/me/company-projects/{project_id}", status_code=204)
def delete_company_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only company accounts can delete projects")

    profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user.id).one_or_none()
    if profile is None:
        raise HTTPException(status_code=400, detail="Create your company profile first")

    project = db.query(CompanyProject).filter(CompanyProject.id == project_id).one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.company_id != profile.id:
        raise HTTPException(status_code=403, detail="Not your project")

    db.delete(project)
    db.flush()
    _sync_company_completed_projects(db, profile.id)
    db.commit()
    return None
