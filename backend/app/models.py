from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    company = "company"
    client = "client"


class ConnectionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class RequestStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(200), default="", index=True)
    phone: Mapped[str] = mapped_column(String(50), default="")
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow)

    company_profile: Mapped["CompanyProfile | None"] = relationship(back_populates="user")
    client_profile: Mapped["ClientProfile | None"] = relationship(back_populates="user")
    design_requests: Mapped[list["DesignRequest"]] = relationship(back_populates="user")


class CompanyProfile(Base):
    __tablename__ = "company_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_company_profile_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(200), index=True)
    phone: Mapped[str] = mapped_column(String(50), default="")
    location: Mapped[str] = mapped_column(String(200), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    website: Mapped[str] = mapped_column(String(300), default="")
    services: Mapped[str] = mapped_column(Text, default="")
    logo_url: Mapped[str] = mapped_column(String(500), default="")
    completed_projects: Mapped[int] = mapped_column(Integer, default=0)
    project_price_range: Mapped[str] = mapped_column(String(200), default="")

    user: Mapped[User] = relationship(back_populates="company_profile")
    connections: Mapped[list["Connection"]] = relationship(back_populates="company")
    projects: Mapped[list["CompanyProject"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class ClientProfile(Base):
    __tablename__ = "client_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_client_profile_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(200), index=True)
    location: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")

    user: Mapped[User] = relationship(back_populates="client_profile")
    requests: Mapped[list["BuildRequest"]] = relationship(back_populates="client")


class BuildRequest(Base):
    __tablename__ = "build_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("client_profiles.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    city: Mapped[str] = mapped_column(String(120), default="")
    budget_min: Mapped[int] = mapped_column(Integer, default=0)
    budget_max: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[RequestStatus] = mapped_column(Enum(RequestStatus), default=RequestStatus.open, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, index=True)

    client: Mapped[ClientProfile] = relationship(back_populates="requests")
    connections: Mapped[list["Connection"]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Connection(Base):
    __tablename__ = "connections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("build_requests.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company_profiles.id", ondelete="CASCADE"), index=True)
    status: Mapped[ConnectionStatus] = mapped_column(Enum(ConnectionStatus), default=ConnectionStatus.pending, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, index=True)

    request: Mapped[BuildRequest] = relationship(back_populates="connections")
    company: Mapped[CompanyProfile] = relationship(back_populates="connections")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="connection",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reads: Mapped[list["ConnectionRead"]] = relationship(
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    connection_id: Mapped[int] = mapped_column(ForeignKey("connections.id", ondelete="CASCADE"), index=True)
    sender_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    body: Mapped[str] = mapped_column(Text, default="")
    attachment_name: Mapped[str] = mapped_column(String(255), default="")
    attachment_url: Mapped[str] = mapped_column(String(1000), default="")
    attachment_kind: Mapped[str] = mapped_column(String(50), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, index=True)

    connection: Mapped[Connection] = relationship(back_populates="messages")


class ConnectionRead(Base):
    __tablename__ = "connection_reads"
    __table_args__ = (UniqueConstraint("connection_id", "user_id", name="uq_connection_read_conn_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    connection_id: Mapped[int] = mapped_column(ForeignKey("connections.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    last_read_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, index=True)


class DesignRequest(Base):
    __tablename__ = "design_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    house_type: Mapped[str] = mapped_column(String(120), default="")
    budget: Mapped[str] = mapped_column(String(120), default="")
    style: Mapped[str] = mapped_column(String(120), default="")
    room_type: Mapped[str] = mapped_column(String(120), default="")
    plot_size: Mapped[str] = mapped_column(String(120), default="")
    location: Mapped[str] = mapped_column(String(200), default="")
    user_prompt: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, index=True)

    user: Mapped[User] = relationship(back_populates="design_requests")
    suggestion: Mapped["AiSuggestion | None"] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
        passive_deletes=True,
        single_parent=True,
        uselist=False,
    )


class AiSuggestion(Base):
    __tablename__ = "ai_suggestions"
    __table_args__ = (UniqueConstraint("request_id", name="uq_ai_suggestions_request"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("design_requests.id", ondelete="CASCADE"), index=True)
    interior_suggestion: Mapped[str] = mapped_column(Text, default="")
    exterior_suggestion: Mapped[str] = mapped_column(Text, default="")
    color_palette: Mapped[str] = mapped_column(Text, default="")
    material_suggestion: Mapped[str] = mapped_column(Text, default="")
    lighting_suggestion: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(Text, default="")
    provider: Mapped[str] = mapped_column(String(50), default="offline")
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, index=True)

    request: Mapped[DesignRequest] = relationship(back_populates="suggestion")


class CompanyProject(Base):
    __tablename__ = "company_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company_profiles.id", ondelete="CASCADE"), index=True)
    client_name: Mapped[str] = mapped_column(String(200), default="")
    title: Mapped[str] = mapped_column(String(200), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    project_price: Mapped[str] = mapped_column(String(120), default="")
    image_url: Mapped[str] = mapped_column(String(1000), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, index=True)

    company: Mapped[CompanyProfile] = relationship(back_populates="projects")
