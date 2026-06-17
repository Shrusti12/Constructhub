from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.admin import require_admin
from app.db import get_db
from app.models import User
from app.schemas import AdminUserRow

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserRow], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    q = select(User).order_by(User.id.asc())
    users = db.execute(q).scalars().all()
    return [AdminUserRow.model_validate(u) for u in users]

