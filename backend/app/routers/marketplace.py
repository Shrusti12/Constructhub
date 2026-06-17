from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import (
    BuildRequest,
    ClientProfile,
    CompanyProfile,
    CompanyProject,
    Connection,
    ConnectionRead,
    ConnectionStatus,
    Message,
    RequestStatus,
    User,
    UserRole,
)
from app.schemas import (
    BuildRequestCreate,
    BuildRequestPublic,
    CompanyIncomingItem,
    CompanyProfilePublic,
    CompanyProjectPublic,
    ClientConnectToCompanyCreate,
    ConnectionCreate,
    ConnectionPublic,
    MessageCreate,
    MessagePublic,
    NotificationsResponse,
    InboxItem,
)

router = APIRouter(prefix="/market", tags=["market"])
uploads_dir = Path("backend/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)


def _require_company_profile(db: Session, user: User) -> CompanyProfile:
    profile = db.execute(select(CompanyProfile).where(CompanyProfile.user_id == user.id)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Create your company profile first")
    return profile


def _require_client_profile(db: Session, user: User) -> ClientProfile:
    profile = db.execute(select(ClientProfile).where(ClientProfile.user_id == user.id)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Create your client profile first")
    return profile


@router.get("/companies", response_model=list[CompanyProfilePublic])
def list_companies(db: Session = Depends(get_db)):
    q = (
        select(CompanyProfile)
        .join(User, User.id == CompanyProfile.user_id)
        .where(~User.email.like("demo.company%@constructhub.local"))
        .order_by(CompanyProfile.id.desc())
    )
    return db.execute(q).scalars().all()


@router.get("/companies/{company_id}/projects", response_model=list[CompanyProjectPublic])
def list_company_projects(company_id: int, db: Session = Depends(get_db)):
    company = db.get(CompanyProfile, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return (
        db.execute(
            select(CompanyProject).where(CompanyProject.company_id == company_id).order_by(CompanyProject.created_at.desc())
        )
        .scalars()
        .all()
    )


@router.get("/requests", response_model=list[BuildRequestPublic])
def list_requests(db: Session = Depends(get_db)):
    return db.execute(select(BuildRequest).order_by(BuildRequest.created_at.desc())).scalars().all()


@router.get("/my/requests", response_model=list[BuildRequestPublic])
def list_my_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can access this")
    client = _require_client_profile(db, user)
    q = select(BuildRequest).where(BuildRequest.client_id == client.id).order_by(BuildRequest.created_at.desc())
    return db.execute(q).scalars().all()


@router.post("/requests", response_model=BuildRequestPublic)
def create_request(
    payload: BuildRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can create requests")

    client = _require_client_profile(db, user)
    req = BuildRequest(
        client_id=client.id,
        title=payload.title,
        description=payload.description,
        city=payload.city,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        status=RequestStatus.open,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.delete("/requests/{request_id}", status_code=204)
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can delete requests")

    client = _require_client_profile(db, user)
    req = db.get(BuildRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.client_id != client.id:
        raise HTTPException(status_code=403, detail="Not your request")

    db.delete(req)
    db.commit()
    return None


@router.get("/connections", response_model=list[ConnectionPublic])
def list_connections(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.company:
        company = _require_company_profile(db, user)
        q = select(Connection).where(Connection.company_id == company.id).order_by(Connection.created_at.desc())
        return db.execute(q).scalars().all()

    client = _require_client_profile(db, user)
    q = (
        select(Connection)
        .join(BuildRequest, BuildRequest.id == Connection.request_id)
        .where(BuildRequest.client_id == client.id)
        .order_by(Connection.created_at.desc())
    )
    return db.execute(q).scalars().all()


@router.post("/connections", response_model=ConnectionPublic)
def create_connection(
    payload: ConnectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can connect to requests")

    company = _require_company_profile(db, user)
    req = db.get(BuildRequest, payload.request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.open:
        raise HTTPException(status_code=400, detail="Request is not open")

    existing = db.execute(
        select(Connection).where(Connection.request_id == req.id, Connection.company_id == company.id)
    ).scalar_one_or_none()
    if existing:
        return existing

    conn = Connection(request_id=req.id, company_id=company.id, status=ConnectionStatus.pending)
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.post("/client-connect", response_model=ConnectionPublic)
def client_connect_company(
    payload: ClientConnectToCompanyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can connect to companies")

    client = _require_client_profile(db, user)
    req = db.get(BuildRequest, payload.request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.client_id != client.id:
        raise HTTPException(status_code=403, detail="Not your request")

    company = db.get(CompanyProfile, payload.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    existing = db.execute(
        select(Connection).where(Connection.request_id == req.id, Connection.company_id == company.id)
    ).scalar_one_or_none()
    if existing:
        return existing

    conn = Connection(request_id=req.id, company_id=company.id, status=ConnectionStatus.pending)
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.get("/company-incoming", response_model=list[CompanyIncomingItem])
def list_company_incoming(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can access this")

    company = _require_company_profile(db, user)
    conns = (
        db.execute(select(Connection).where(Connection.company_id == company.id).order_by(Connection.created_at.desc()))
        .scalars()
        .all()
    )
    if not conns:
        return []

    requests = {
        r.id: r
        for r in db.execute(select(BuildRequest).where(BuildRequest.id.in_([c.request_id for c in conns]))).scalars().all()
    }
    client_ids = sorted({r.client_id for r in requests.values()})
    clients = {
        c.id: c for c in db.execute(select(ClientProfile).where(ClientProfile.id.in_(client_ids))).scalars().all()
    }

    items: list[CompanyIncomingItem] = []
    for conn in conns:
        req = requests.get(conn.request_id)
        client = clients.get(req.client_id) if req else None
        items.append(
            CompanyIncomingItem(
                connection_id=conn.id,
                request_id=conn.request_id,
                company_id=conn.company_id,
                status=conn.status.value,
                client_name=client.name if client else f"Client #{req.client_id if req else '?'}",
                client_phone=client.phone if client else "",
                request_title=req.title if req else f"Request #{conn.request_id}",
                city=req.city if req else "",
                budget_min=req.budget_min if req else 0,
                budget_max=req.budget_max if req else 0,
                description=req.description if req else "",
                created_at=conn.created_at,
            )
        )
    return items


@router.post("/connections/{connection_id}/accept", response_model=ConnectionPublic)
def accept_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can accept a connection")

    client = _require_client_profile(db, user)
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    req = db.get(BuildRequest, conn.request_id)
    if not req or req.client_id != client.id:
        raise HTTPException(status_code=403, detail="Not your request")

    conn.status = ConnectionStatus.accepted
    req.status = RequestStatus.in_progress
    db.commit()
    db.refresh(conn)
    return conn


@router.post("/connections/{connection_id}/reject", response_model=ConnectionPublic)
def reject_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can reject a connection")

    client = _require_client_profile(db, user)
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    req = db.get(BuildRequest, conn.request_id)
    if not req or req.client_id != client.id:
        raise HTTPException(status_code=403, detail="Not your request")

    conn.status = ConnectionStatus.rejected
    db.commit()
    db.refresh(conn)
    return conn


@router.post("/connections/{connection_id}/company-accept", response_model=ConnectionPublic)
def company_accept_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can accept a connection")

    company = _require_company_profile(db, user)
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.company_id != company.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    conn.status = ConnectionStatus.accepted
    req = db.get(BuildRequest, conn.request_id)
    if req:
        req.status = RequestStatus.in_progress
    db.commit()
    db.refresh(conn)
    return conn


@router.post("/connections/{connection_id}/company-reject", response_model=ConnectionPublic)
def company_reject_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.company:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only companies can reject a connection")

    company = _require_company_profile(db, user)
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.company_id != company.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    conn.status = ConnectionStatus.rejected
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/connections/{connection_id}", status_code=204)
def delete_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    # Authorization: company on this connection, or owner client of the request.
    if user.role == UserRole.company:
        company = _require_company_profile(db, user)
        if conn.company_id != company.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        client = _require_client_profile(db, user)
        req = db.get(BuildRequest, conn.request_id)
        if not req or req.client_id != client.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(conn)
    db.commit()
    return None


@router.get("/connections/{connection_id}/messages", response_model=list[MessagePublic])
def list_messages(
    connection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    # Authorization: company on this connection, or owner client of the request.
    if user.role == UserRole.company:
        company = _require_company_profile(db, user)
        if conn.company_id != company.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        client = _require_client_profile(db, user)
        req = db.get(BuildRequest, conn.request_id)
        if not req or req.client_id != client.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    q = select(Message).where(Message.connection_id == conn.id).order_by(Message.created_at.asc())
    msgs = db.execute(q).scalars().all()

    # Mark as read when user views messages.
    now = datetime.utcnow()
    read = db.execute(
        select(ConnectionRead).where(ConnectionRead.connection_id == conn.id, ConnectionRead.user_id == user.id)
    ).scalar_one_or_none()
    if read is None:
        read = ConnectionRead(connection_id=conn.id, user_id=user.id, last_read_at=now)
        db.add(read)
    else:
        read.last_read_at = now
    db.commit()

    return msgs


@router.post("/connections/{connection_id}/messages", response_model=MessagePublic)
def send_message(
    connection_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.status != ConnectionStatus.accepted:
        raise HTTPException(status_code=400, detail="Connection is not accepted")

    # Authorization: same rules as list_messages.
    if user.role == UserRole.company:
        company = _require_company_profile(db, user)
        if conn.company_id != company.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        client = _require_client_profile(db, user)
        req = db.get(BuildRequest, conn.request_id)
        if not req or req.client_id != client.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    msg = Message(connection_id=conn.id, sender_user_id=user.id, body=payload.body)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Sender has effectively "read" up to this message.
    now = datetime.utcnow()
    read = db.execute(
        select(ConnectionRead).where(ConnectionRead.connection_id == conn.id, ConnectionRead.user_id == user.id)
    ).scalar_one_or_none()
    if read is None:
        read = ConnectionRead(connection_id=conn.id, user_id=user.id, last_read_at=now)
        db.add(read)
    else:
        read.last_read_at = now
    db.commit()

    return msg


@router.post("/connections/{connection_id}/attachments", response_model=list[MessagePublic])
async def send_attachments(
    connection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    files: list[UploadFile] = File(...),
    body: str = Form(default=""),
):
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.status != ConnectionStatus.accepted:
        raise HTTPException(status_code=400, detail="Connection is not accepted")

    if user.role == UserRole.company:
        company = _require_company_profile(db, user)
        if conn.company_id != company.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        client = _require_client_profile(db, user)
        req = db.get(BuildRequest, conn.request_id)
        if not req or req.client_id != client.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    created: list[Message] = []
    safe_body = body.strip()
    for index, upload in enumerate(files):
        original_name = upload.filename or f"file-{index + 1}"
        ext = Path(original_name).suffix
        stored_name = f"{uuid4().hex}{ext}"
        target = uploads_dir / stored_name
        data = await upload.read()
        target.write_bytes(data)
        content_type = (upload.content_type or "").lower()
        kind = "image" if content_type.startswith("image/") else "file"

        msg = Message(
            connection_id=conn.id,
            sender_user_id=user.id,
            body=safe_body if index == 0 else "",
            attachment_name=original_name,
            attachment_url=f"/uploads/{stored_name}",
            attachment_kind=kind,
        )
        db.add(msg)
        created.append(msg)

    db.commit()
    for msg in created:
        db.refresh(msg)

    now = datetime.utcnow()
    read = db.execute(
        select(ConnectionRead).where(ConnectionRead.connection_id == conn.id, ConnectionRead.user_id == user.id)
    ).scalar_one_or_none()
    if read is None:
        read = ConnectionRead(connection_id=conn.id, user_id=user.id, last_read_at=now)
        db.add(read)
    else:
        read.last_read_at = now
    db.commit()

    return created


@router.delete("/messages/{message_id}", status_code=204)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    conn = db.get(Connection, msg.connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    # Authorization: company on this connection, or owner client of the request.
    if user.role == UserRole.company:
        company = _require_company_profile(db, user)
        if conn.company_id != company.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        client = _require_client_profile(db, user)
        req = db.get(BuildRequest, conn.request_id)
        if not req or req.client_id != client.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    # Only the sender can delete their own message.
    if msg.sender_user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    db.delete(msg)
    db.commit()
    return None


@router.get("/notifications", response_model=NotificationsResponse)
def get_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Figure out which connections belong to this user (same logic as /connections).
    if user.role == UserRole.company:
        company = _require_company_profile(db, user)
        conn_q = select(Connection.id).where(Connection.company_id == company.id)
        pending_q = select(func.count()).select_from(Connection).where(
            Connection.company_id == company.id, Connection.status == ConnectionStatus.pending
        )
        pending_connections = int(db.execute(pending_q).scalar_one())
    else:
        client = _require_client_profile(db, user)
        conn_q = (
            select(Connection.id)
            .join(BuildRequest, BuildRequest.id == Connection.request_id)
            .where(BuildRequest.client_id == client.id)
        )
        pending_connections = 0

    conn_ids = [row[0] for row in db.execute(conn_q).all()]
    if not conn_ids:
        return NotificationsResponse(pending_connections=pending_connections, unread_by_connection={})

    # For each connection, compare message timestamps to last_read_at for this user.
    reads = {
        r.connection_id: r.last_read_at
        for r in db.execute(
            select(ConnectionRead).where(ConnectionRead.user_id == user.id, ConnectionRead.connection_id.in_(conn_ids))
        )
        .scalars()
        .all()
    }

    unread_by_connection: dict[int, int] = {}
    for cid in conn_ids:
        if user.role == UserRole.client:
            conn = db.get(Connection, cid)
            last_read_at = reads.get(cid)
            if conn:
                if conn.status == ConnectionStatus.pending:
                    pending_connections += 1
                # Surface accepted connections as "new" until the client opens that chat.
                elif conn.status == ConnectionStatus.accepted and last_read_at is None:
                    pending_connections += 1

        last_read_at = reads.get(cid)
        msg_q = select(func.count()).select_from(Message).where(Message.connection_id == cid)
        if last_read_at:
            msg_q = msg_q.where(Message.created_at > last_read_at)
        msg_q = msg_q.where(Message.sender_user_id != user.id)
        unread = int(db.execute(msg_q).scalar_one())
        if unread:
            unread_by_connection[cid] = unread

    return NotificationsResponse(pending_connections=pending_connections, unread_by_connection=unread_by_connection)


@router.get("/inbox", response_model=list[InboxItem])
def get_inbox(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Load all connections for this user.
    conns = list_connections(db=db, user=user)

    if not conns:
        return []

    # Preload lookup data.
    company_ids = sorted({c.company_id for c in conns})
    request_ids = sorted({c.request_id for c in conns})

    companies = {
        c.id: c
        for c in db.execute(select(CompanyProfile).where(CompanyProfile.id.in_(company_ids))).scalars().all()
    }
    requests = {
        r.id: r for r in db.execute(select(BuildRequest).where(BuildRequest.id.in_(request_ids))).scalars().all()
    }
    client_ids = sorted({r.client_id for r in requests.values()})
    clients = {
        c.id: c for c in db.execute(select(ClientProfile).where(ClientProfile.id.in_(client_ids))).scalars().all()
    }

    reads = {
        r.connection_id: r.last_read_at
        for r in db.execute(
            select(ConnectionRead).where(ConnectionRead.user_id == user.id, ConnectionRead.connection_id.in_([c.id for c in conns]))
        )
        .scalars()
        .all()
    }

    items: list[InboxItem] = []
    for c in conns:
        last_msg = (
            db.execute(
                select(Message).where(Message.connection_id == c.id).order_by(Message.created_at.desc()).limit(1)
            )
            .scalars()
            .first()
        )

        last_read_at = reads.get(c.id)
        unread_q = select(func.count()).select_from(Message).where(
            Message.connection_id == c.id, Message.sender_user_id != user.id
        )
        if last_read_at:
            unread_q = unread_q.where(Message.created_at > last_read_at)
        unread = int(db.execute(unread_q).scalar_one())

        company = companies.get(c.company_id)
        req = requests.get(c.request_id)
        client = clients.get(req.client_id) if req else None

        if user.role == UserRole.client:
            counterpart_name = company.name if company else f"Company #{c.company_id}"
        else:
            counterpart_name = client.name if client else (req.title if req else f"Request #{c.request_id}")

        items.append(
            InboxItem(
                connection_id=c.id,
                status=c.status.value,
                request_id=c.request_id,
                company_id=c.company_id,
                counterpart_name=counterpart_name,
                request_title=req.title if req else None,
                client_name=client.name if client else None,
                company_name=company.name if company else None,
                last_message_body=last_msg.body if last_msg else None,
                last_message_at=last_msg.created_at if last_msg else None,
                unread_count=unread,
            )
        )

    # Sort: newest message first, fallback to connection created_at
    items.sort(
        key=lambda x: next(
            (
                (x.last_message_at or conn.created_at)
                for conn in conns
                if conn.id == x.connection_id
            ),
            datetime.min,
        ),
        reverse=True,
    )
    return items
