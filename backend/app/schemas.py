from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import UserRole


Role = Literal["company", "client"]


class SchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class TokenResponse(SchemaBase):
    access_token: str
    token_type: str = "bearer"


class UserPublic(SchemaBase):
    id: int
    email: EmailStr
    name: str
    phone: str
    role: UserRole
    created_at: datetime


class RegisterRequest(SchemaBase):
    name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=7, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role


class LoginRequest(SchemaBase):
    email: EmailStr
    password: str


class CompanyProfileUpsert(SchemaBase):
    name: str = Field(min_length=2, max_length=200)
    phone: str = ""
    location: str = ""
    description: str = ""
    website: str = ""
    services: str = ""
    logo_url: str = ""
    completed_projects: int = 0
    project_price_range: str = ""


class CompanyProfilePublic(CompanyProfileUpsert):
    id: int
    user_id: int


class CompanyProjectPublic(SchemaBase):
    id: int
    company_id: int
    client_name: str
    title: str
    summary: str
    project_price: str
    image_url: str
    created_at: datetime


class ClientProfileUpsert(SchemaBase):
    name: str = Field(min_length=2, max_length=200)
    location: str = ""
    phone: str = ""


class ClientProfilePublic(ClientProfileUpsert):
    id: int
    user_id: int


class BuildRequestCreate(SchemaBase):
    title: str = Field(min_length=4, max_length=200)
    description: str = ""
    city: str = ""
    budget_min: int = 0
    budget_max: int = 0


class BuildRequestPublic(BuildRequestCreate):
    id: int
    client_id: int
    status: str
    created_at: datetime


class ConnectionCreate(SchemaBase):
    request_id: int


class ConnectionPublic(SchemaBase):
    id: int
    request_id: int
    company_id: int
    status: str
    created_at: datetime


class ClientConnectToCompanyCreate(SchemaBase):
    company_id: int
    request_id: int


class MessageCreate(SchemaBase):
    body: str = Field(min_length=1, max_length=4000)


class MessagePublic(SchemaBase):
    id: int
    connection_id: int
    sender_user_id: int
    body: str
    attachment_name: str = ""
    attachment_url: str = ""
    attachment_kind: str = ""
    created_at: datetime


class AiSuggestRequest(SchemaBase):
    prompt: str = Field(min_length=5, max_length=2000)
    style: str = "modern"


class AiSuggestResponse(SchemaBase):
    title: str
    description: str
    suggestions: list[str]
    images_base64_png: list[str]
    provider: str = "offline"
    note: str | None = None


class DesignRequestCreate(SchemaBase):
    house_type: str = Field(min_length=2, max_length=120)
    budget: str = Field(min_length=2, max_length=120)
    style: str = Field(min_length=2, max_length=120)
    room_type: str = Field(min_length=2, max_length=120)
    plot_size: str = Field(min_length=2, max_length=120)
    location: str = Field(min_length=2, max_length=200)
    user_prompt: str = Field(default="", max_length=3000)


class DesignRequestPublic(DesignRequestCreate):
    id: int
    user_id: int
    created_at: datetime


class AiSuggestionPublic(SchemaBase):
    id: int
    request_id: int
    interior_suggestion: str
    exterior_suggestion: str
    color_palette: str
    material_suggestion: str
    lighting_suggestion: str
    image_url: str
    image_urls: dict[str, str]
    provider: str = "offline"
    note: str = ""
    created_at: datetime


class SavedDesignPublic(SchemaBase):
    request: DesignRequestPublic
    suggestion: AiSuggestionPublic


class NotificationsResponse(SchemaBase):
    pending_connections: int
    unread_by_connection: dict[int, int]


#
# Password reset schemas removed by request.
#


class AdminUserRow(SchemaBase):
    id: int
    email: EmailStr
    role: UserRole
    created_at: datetime
    hashed_password: str


class InboxItem(SchemaBase):
    connection_id: int
    status: str
    request_id: int
    company_id: int
    counterpart_name: str
    request_title: str | None = None
    client_name: str | None = None
    company_name: str | None = None
    last_message_body: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0


class CompanyIncomingItem(SchemaBase):
    connection_id: int
    request_id: int
    company_id: int
    status: str
    client_name: str
    client_phone: str = ""
    request_title: str
    city: str = ""
    budget_min: int = 0
    budget_max: int = 0
    description: str = ""
    created_at: datetime
