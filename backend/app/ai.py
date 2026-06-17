from __future__ import annotations

import base64
import hashlib
import io
import math
import json
import re
from dataclasses import dataclass

from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings


@dataclass(frozen=True)
class AiResult:
    title: str
    description: str
    suggestions: list[str]
    images_base64_png: list[str]
    provider: str = "offline"
    note: str | None = None


@dataclass(frozen=True)
class DesignAiResult:
    title: str
    interior_suggestion: str
    exterior_suggestion: str
    color_palette: str
    material_suggestion: str
    lighting_suggestion: str
    images_base64_png: dict[str, str]
    provider: str = "offline"
    note: str | None = None


def _palette(seed: str) -> tuple[tuple[int, int, int], tuple[int, int, int], tuple[int, int, int]]:
    h = hashlib.sha256(seed.encode("utf-8")).digest()
    a = (h[0], h[1], h[2])
    b = (h[3], h[4], h[5])
    c = (h[6], h[7], h[8])

    def brighten(rgb: tuple[int, int, int], k: float) -> tuple[int, int, int]:
        return tuple(min(255, int(x + (255 - x) * k)) for x in rgb)  # type: ignore[return-value]

    return brighten(a, 0.35), brighten(b, 0.25), brighten(c, 0.15)


def _gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, (h - 1))
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return img


def _draw_building(draw: ImageDraw.ImageDraw, w: int, h: int, accent: tuple[int, int, int]) -> None:
    base_y = int(h * 0.82)
    left = int(w * 0.18)
    right = int(w * 0.82)
    mid = int(w * 0.52)

    # Main block
    draw.rounded_rectangle([left, int(h * 0.28), right, base_y], radius=18, outline=(255, 255, 255), width=4)

    # Roof / top cut
    draw.polygon(
        [(left + 10, int(h * 0.28)), (mid, int(h * 0.18)), (right - 10, int(h * 0.28))],
        outline=(255, 255, 255),
        width=4,
    )

    # Door
    door_w = int(w * 0.10)
    door_h = int(h * 0.18)
    door_x0 = mid - door_w // 2
    door_y0 = base_y - door_h
    draw.rounded_rectangle([door_x0, door_y0, door_x0 + door_w, base_y], radius=10, fill=accent)

    # Windows grid
    cols = 5
    rows = 4
    x0 = left + int(w * 0.06)
    x1 = right - int(w * 0.06)
    y0 = int(h * 0.33)
    y1 = base_y - int(h * 0.22)
    for r in range(rows):
        for c in range(cols):
            tx = c / max(1, cols - 1)
            ty = r / max(1, rows - 1)
            cx = int(x0 * (1 - tx) + x1 * tx)
            cy = int(y0 * (1 - ty) + y1 * ty)
            ww = int(w * 0.045)
            hh = int(h * 0.06)
            draw.rounded_rectangle([cx - ww, cy - hh, cx + ww, cy + hh], radius=6, outline=(255, 255, 255), width=3)

    # Ground
    draw.line([(int(w * 0.08), base_y), (int(w * 0.92), base_y)], fill=(255, 255, 255), width=3)


def _encode_png(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _extract(prompt: str) -> dict[str, str]:
    import re

    s = " ".join(prompt.strip().split())
    low = s.lower()

    def m(rx: str) -> str | None:
        mm = re.search(rx, low)
        if not mm:
            return None
        return mm.group(1).strip()

    project = "build"
    if any(k in low for k in ["renov", "remodel", "interior", "fit-out", "fit out", "makeover"]):
        project = "renovation"
    if any(k in low for k in ["office", "workspace", "cowork", "co-working"]):
        project = "office"
    if any(k in low for k in ["house", "villa", "bungalow", "home construction", "new build"]):
        project = "house"
    if any(k in low for k in ["shop", "retail", "showroom"]):
        project = "shop"

    rooms = None
    # Catch "2bhk", "3 bhk", etc.
    rm = re.search(r"\b(\d)\s*bhk\b", low)
    if rm:
        rooms = rm.group(1) + "BHK"

    budget = m(r"\bbudget\s*[:\-]?\s*([^\.;,]+)") or ""
    city = m(r"\b(in|at)\s+([a-z ]{3,30})\b")
    if city:
        # group(1) is "in/at" because of the regex; keep actual place from group(2).
        mm = re.search(r"\b(?:in|at)\s+([a-z ]{3,30})\b", low)
        city = (mm.group(1) if mm else "").strip().title()
    else:
        city = ""

    style_hint = ""
    for k in ["modern", "minimal", "industrial", "classic", "luxury", "scandinavian", "boho"]:
        if k in low:
            style_hint = k
            break

    return {
        "clean": s,
        "project": project,
        "rooms": rooms or "",
        "budget": budget,
        "city": city,
        "style_hint": style_hint,
    }


def _title(meta: dict[str, str], style: str) -> str:
    bits: list[str] = []
    if meta.get("rooms"):
        bits.append(meta["rooms"])
    p = meta.get("project") or "project"
    if p == "office":
        bits.append("Office Fit-out")
    elif p == "house":
        bits.append("House Build")
    elif p == "shop":
        bits.append("Shop / Showroom")
    elif p == "renovation":
        bits.append("Renovation")
    else:
        bits.append("Project")
    bits.append(style.title())
    if meta.get("city"):
        bits.append(meta["city"])
    return " - ".join([b for b in bits if b])


def _describe(meta: dict[str, str], style: str) -> str:
    clean = meta["clean"]
    project = meta.get("project") or "build"
    rooms = meta.get("rooms") or ""
    city = meta.get("city") or ""
    budget = meta.get("budget") or ""

    lead = "Here is a concept you can take to a contractor:"
    header = f"{_title(meta, style)}"

    # A friendly, "lovable AI" style without being too long.
    lines: list[str] = [header, "", lead, ""]

    who = "space"
    if project == "office":
        who = "office"
    elif project == "house":
        who = "home"
    elif project == "shop":
        who = "store"
    elif project == "renovation":
        who = "renovation"

    scope = []
    if rooms:
        scope.append(rooms)
    scope.append(who)
    scope_txt = " ".join([x for x in scope if x]).strip()

    lines.append(f"- Goal: {style} look with practical, buildable choices for your {scope_txt or 'project'}.")
    if city:
        lines.append(f"- Location: {city}")
    if budget:
        lines.append(f"- Budget note: {budget}")
    lines.append("")
    lines.append("What you'll get:")
    lines.append("- A clear layout direction")
    lines.append("- Materials + lighting suggestions")
    lines.append("- A simple execution plan (what to do first)")
    lines.append("")
    lines.append("Prompt received:")
    lines.append(clean[:300] + ("..." if len(clean) > 300 else ""))

    return "\n".join(lines)


def _scene_kind(meta: dict[str, str]) -> str:
    p = (meta.get("project") or "").lower()
    if p == "office":
        return "office"
    if p == "house":
        return "house"
    if p == "shop":
        return "shop"
    if p == "renovation":
        return "interior"
    return "building"


def _draw_scene(draw: ImageDraw.ImageDraw, w: int, h: int, kind: str, accent: tuple[int, int, int]) -> None:
    if kind == "interior":
        # Simple room: floor, wall, window, sofa.
        floor_y = int(h * 0.70)
        draw.rectangle([0, floor_y, w, h], outline=(255, 255, 255), width=3)
        draw.line([(0, floor_y), (w, floor_y)], fill=(255, 255, 255), width=3)

        # Window
        wx0, wy0 = int(w * 0.08), int(h * 0.18)
        wx1, wy1 = int(w * 0.36), int(h * 0.44)
        draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=10, outline=(255, 255, 255), width=3)
        draw.line([(int((wx0 + wx1) / 2), wy0), (int((wx0 + wx1) / 2), wy1)], fill=(255, 255, 255), width=2)
        draw.line([(wx0, int((wy0 + wy1) / 2)), (wx1, int((wy0 + wy1) / 2))], fill=(255, 255, 255), width=2)

        # Sofa
        sx0, sy0 = int(w * 0.48), int(h * 0.50)
        sx1, sy1 = int(w * 0.86), int(h * 0.66)
        draw.rounded_rectangle([sx0, sy0, sx1, sy1], radius=18, outline=(255, 255, 255), width=3)
        draw.rounded_rectangle([sx0 + 10, sy0 - 22, sx0 + 120, sy0 + 20], radius=12, fill=accent)
        return

    if kind == "office":
        # Office block: tall rectangle + desk lines.
        base_y = int(h * 0.82)
        left = int(w * 0.20)
        right = int(w * 0.80)
        top = int(h * 0.18)
        draw.rounded_rectangle([left, top, right, base_y], radius=16, outline=(255, 255, 255), width=4)
        # Windows
        cols = 6
        rows = 6
        for r in range(rows):
            for c in range(cols):
                cx = int(left + (right - left) * ((c + 0.5) / cols))
                cy = int(top + (base_y - top) * ((r + 0.5) / rows))
                ww = int(w * 0.028)
                hh = int(h * 0.032)
                draw.rounded_rectangle([cx - ww, cy - hh, cx + ww, cy + hh], radius=6, outline=(255, 255, 255), width=2)
        draw.line([(int(w * 0.10), base_y), (int(w * 0.90), base_y)], fill=(255, 255, 255), width=3)
        return

    if kind == "house":
        # House: main block + roof + windows.
        base_y = int(h * 0.82)
        left = int(w * 0.20)
        right = int(w * 0.80)
        mid = int(w * 0.50)
        draw.rounded_rectangle([left, int(h * 0.30), right, base_y], radius=18, outline=(255, 255, 255), width=4)
        draw.polygon([(left + 14, int(h * 0.30)), (mid, int(h * 0.16)), (right - 14, int(h * 0.30))], outline=(255, 255, 255), width=4)
        # Door + windows
        draw.rounded_rectangle([mid - int(w * 0.05), base_y - int(h * 0.18), mid + int(w * 0.05), base_y], radius=10, fill=accent)
        draw.rounded_rectangle([left + 34, int(h * 0.42), left + 170, int(h * 0.56)], radius=10, outline=(255, 255, 255), width=3)
        draw.rounded_rectangle([right - 170, int(h * 0.42), right - 34, int(h * 0.56)], radius=10, outline=(255, 255, 255), width=3)
        draw.line([(int(w * 0.10), base_y), (int(w * 0.90), base_y)], fill=(255, 255, 255), width=3)
        return

    if kind == "shop":
        # Shop: wide facade + signage strip.
        base_y = int(h * 0.82)
        left = int(w * 0.14)
        right = int(w * 0.86)
        top = int(h * 0.30)
        draw.rounded_rectangle([left, top, right, base_y], radius=14, outline=(255, 255, 255), width=4)
        draw.rectangle([left, top, right, top + 54], fill=accent)
        # Display windows
        draw.rounded_rectangle([left + 26, top + 80, mid := int(w * 0.50) - 20, base_y - 40], radius=12, outline=(255, 255, 255), width=3)
        draw.rounded_rectangle([mid + 40, top + 80, right - 26, base_y - 40], radius=12, outline=(255, 255, 255), width=3)
        draw.line([(int(w * 0.08), base_y), (int(w * 0.92), base_y)], fill=(255, 255, 255), width=3)
        return

    _draw_building(draw, w, h, accent=accent)


def suggest(prompt: str, style: str) -> AiResult:
    # Default: offline mode (always available).
    offline = _suggest_offline(prompt=prompt, style=style)

    # Optional: real AI text+images via OpenAI.
    provider = (settings.ai_provider or "offline").strip().lower()
    if provider != "openai":
        return offline

    try:
        return _suggest_openai(prompt=prompt, style=style, fallback=offline)
    except Exception as e:
        # Never hard-fail the UI for college demos; fall back gracefully.
        return AiResult(
            title=offline.title,
            description=offline.description,
            suggestions=offline.suggestions,
            images_base64_png=offline.images_base64_png,
            provider="offline",
            note=f"OpenAI unavailable, showing offline demo instead. ({type(e).__name__})",
        )


def _suggest_offline(prompt: str, style: str) -> AiResult:
    meta = _extract(prompt)
    clean = meta["clean"]
    primary, secondary, accent = _palette(clean + "|" + style)
    title = _title(meta, style)
    description = _describe(meta, style)
    kind = _scene_kind(meta)

    # Simple heuristic suggestions (offline-friendly, no external calls).
    base = []
    if meta.get("project") == "office":
        base = [
            "Start with a seating plan and circulation (keep aisles clear and logical).",
            "Treat acoustics early: rugs, acoustic panels, and ceiling baffles where needed.",
            "Use layered lighting: ambient + task + accent for meeting rooms and focus areas.",
            "Pick durable finishes for high-touch zones (reception, pantry, corridors).",
        ]
    elif meta.get("project") == "house":
        base = [
            "Lock the floor plan first: room sizes, storage, and ventilation paths.",
            "Place wet areas (kitchen/toilets) to simplify plumbing and reduce cost.",
            "Decide structure early (RCC/steel) and keep spans practical.",
            "Plan water, power backup, and rainwater harvesting from day one.",
        ]
    elif meta.get("project") == "shop":
        base = [
            "Design the storefront: sign, lighting, and visibility from the road.",
            "Plan product zoning (new arrivals, best sellers, checkout) for smooth flow.",
            "Use lighting to guide attention: track spots + warm accent at featured areas.",
            "Keep storage and staff circulation hidden but easy to access.",
        ]
    else:
        base = [
            "Start with a layout: furniture positions and clear walking paths.",
            "Use layered lighting: cove/ambient + task + highlight lighting.",
            "Choose easy-maintenance materials for kitchens, baths, and entry areas.",
            "Make storage intentional (wardrobes, lofts, and concealed utility zones).",
        ]

    suggestions = [
        f"Scope check: {clean[:120] + ('...' if len(clean) > 120 else '')}",
        *base,
        "Define a materials palette (2 main + 1 accent) to keep decisions and costs predictable.",
        "Plan services routing (plumbing/electrical) before finalizing ceilings and finishes.",
        "Add 10-15% contingency and phase work into milestones to avoid delays.",
    ]

    images: list[str] = []
    for i in range(3):
        w, h = 768, 480
        t = i / 2 if i else 0.0
        top = tuple(int(primary[j] * (1 - t) + secondary[j] * t) for j in range(3))
        bottom = tuple(int(secondary[j] * (1 - t) + accent[j] * t) for j in range(3))
        img = _gradient((w, h), top, bottom)
        draw = ImageDraw.Draw(img)

        # Subtle diagonal “mesh” lines.
        for k in range(-h, w, 26):
            alpha = 20 + int(30 * (0.5 + 0.5 * math.sin((k + i * 40) / 90)))
            draw.line([(k, 0), (k + h, h)], fill=(255, 255, 255, alpha), width=2)

        _draw_scene(draw, w, h, kind=kind, accent=accent)

        # Title strip
        strip_h = 64
        draw.rectangle([0, h - strip_h, w, h], fill=(0, 0, 0))
        title_txt = f"Concept {i + 1}: {style.title()}"
        subtitle = clean[:72] + ("…" if len(clean) > 72 else "")
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None
        draw.text((24, h - strip_h + 10), title_txt, fill=(255, 255, 255), font=font)
        draw.text((24, h - strip_h + 34), subtitle, fill=(220, 220, 220), font=font)

        images.append(_encode_png(img))

    return AiResult(title=title, description=description, suggestions=suggestions, images_base64_png=images, provider="offline")


def _openai_client():
    # Lazy import so offline mode doesn't require the dependency.
    from openai import OpenAI  # type: ignore

    key = (settings.openai_api_key or "").strip()
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=key)


def _openai_plan(client, prompt: str, style: str) -> dict:
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "title": {"type": "string"},
            "description": {"type": "string"},
            "suggestions": {"type": "array", "items": {"type": "string"}, "minItems": 6, "maxItems": 10},
            "image_prompts": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
        },
        "required": ["title", "description", "suggestions", "image_prompts"],
    }

    system = (
        "You are a lovable, practical architecture and construction assistant.\n"
        "Write clear, buildable guidance. Avoid unsafe/legal claims.\n"
        "Return JSON only, matching the provided schema.\n"
        "The image_prompts must describe realistic, high-quality renders (not cartoons) and must match the user's ask."
    )

    resp = client.responses.create(
        model=settings.openai_text_model,
        input=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": f"User request: {prompt}\nStyle: {style}\n\nCreate title, description, suggestions, and 3 image prompts.",
            },
        ],
        text={"format": {"type": "json_schema", "name": "constructhub_ai_plan", "schema": schema}},
    )

    if getattr(resp, "status", None) != "completed":
        raise RuntimeError("OpenAI response incomplete")

    raw = getattr(resp, "output_text", None)
    if not raw or not isinstance(raw, str):
        raise RuntimeError("OpenAI missing output_text")

    return json.loads(raw)


def _openai_images(client, prompts: list[str]) -> list[str]:
    images: list[str] = []
    for p in prompts:
        resp = client.responses.create(
            model=settings.openai_image_call_model,
            input=p,
            tools=[
                {
                    "type": "image_generation",
                    "model": settings.openai_image_model,
                    "size": settings.openai_image_size,
                    "quality": settings.openai_image_quality,
                    "background": "opaque",
                }
            ],
            tool_choice={"type": "image_generation"},
        )

        image_data: list[str] = []
        for output in getattr(resp, "output", []) or []:
            o_type = getattr(output, "type", None) if not isinstance(output, dict) else output.get("type")
            if o_type != "image_generation_call":
                continue
            res = getattr(output, "result", None) if not isinstance(output, dict) else output.get("result")
            if isinstance(res, str) and res:
                image_data.append(res)

        if not image_data:
            raise RuntimeError("OpenAI returned no image_generation_call output")
        images.append(image_data[0])
    return images


def _suggest_openai(prompt: str, style: str, fallback: AiResult) -> AiResult:
    client = _openai_client()
    plan = _openai_plan(client, prompt=prompt, style=style)
    imgs = _openai_images(client, prompts=list(plan.get("image_prompts") or []))

    return AiResult(
        title=str(plan["title"])[:140],
        description=str(plan["description"])[:6000],
        suggestions=[str(x)[:400] for x in list(plan["suggestions"])][:10],
        images_base64_png=imgs,
        provider="openai",
        note=None,
    )


IMAGE_SLOTS = [
    ("living_room_image", "Living Room"),
    ("bedroom_image", "Bedroom"),
    ("kitchen_image", "Kitchen"),
    ("front_elevation_image", "Front Elevation"),
    ("blueprint_image", "Blueprint View"),
]


def _design_summary(payload: dict[str, str]) -> str:
    return (
        f"{payload['house_type']} | {payload['budget']} | {payload['style']} | "
        f"{payload['room_type']} | {payload['plot_size']} | {payload['location']}"
    )


def _design_title(payload: dict[str, str]) -> str:
    return f"{payload['style']} {payload['house_type']} Design Plan"


def _smart_phrase(value: str, fallback: str) -> str:
    text = " ".join(value.strip().split())
    return text if text else fallback


def _pick_color_options(payload: dict[str, str]) -> str:
    text = " ".join(
        [
            payload.get("house_type", ""),
            payload.get("budget", ""),
            payload.get("style", ""),
            payload.get("room_type", ""),
            payload.get("plot_size", ""),
            payload.get("location", ""),
            payload.get("user_prompt", ""),
        ]
    ).lower()

    style = payload.get("style", "").lower()
    budget = payload.get("budget", "").lower()
    room = payload.get("room_type", "").lower()
    location = payload.get("location", "").lower()

    if "luxury" in style or "premium" in budget:
        options = [
            "Option 1 - Premium Neutral: Ivory + Taupe + Walnut Brown + Matte Gold",
            "Option 2 - Rich Contrast: Warm Beige + Espresso Brown + Charcoal + Soft Brass",
            "Option 3 - Modern Luxe: Pearl White + Greige + Smoked Oak + Champagne Metal",
        ]
    elif "traditional" in style or "indian" in style:
        options = [
            "Option 1 - Traditional Warmth: Cream + Sandalwood + Teak Brown + Terracotta",
            "Option 2 - Heritage Tone: Off White + Maroon Accent + Honey Wood + Brass",
            "Option 3 - Earthy Indian: Light Beige + Clay + Dark Wood + Olive Accent",
        ]
    elif "minimal" in style or "modern" in style:
        options = [
            "Option 1 - Modern Neutral: Warm White + Dove Grey + Walnut Brown + Charcoal",
            "Option 2 - Soft Minimal: Ivory + Ash Grey + Natural Oak + Matte Black",
            "Option 3 - Clean Contemporary: Pearl White + Greige + Sand Beige + Graphite",
        ]
    elif "industrial" in style:
        options = [
            "Option 1 - Industrial Loft: Concrete Grey + Black + Walnut Brown + Rust Accent",
            "Option 2 - Urban Dark: Smoke Grey + Steel + Deep Brown + Warm White",
            "Option 3 - Raw Modern: Cement + Charcoal + Oak + Burnt Copper",
        ]
    elif "scandinavian" in style:
        options = [
            "Option 1 - Nordic Soft: Snow White + Pale Grey + Blonde Oak + Sage",
            "Option 2 - Airy Calm: Warm White + Mist Blue + Ash Wood + Stone Grey",
            "Option 3 - Light Natural: Cream + Sand + Light Oak + Dusty Green",
        ]
    else:
        options = [
            "Option 1 - Balanced Neutral: Cream + Warm White + Walnut Brown + Charcoal",
            "Option 2 - Soft Earthy: Beige + Taupe + Wood Brown + Olive Accent",
            "Option 3 - Fresh Contemporary: Ivory + Stone Grey + Oak + Muted Blue",
        ]

    if "low" in budget or "budget" in budget:
        options = [
            "Option 1 - Budget Friendly: Off White + Light Grey + Teak Finish + Charcoal",
            "Option 2 - Affordable Warmth: Cream + Beige + Walnut Laminate + Coffee Brown",
            "Option 3 - Simple Clean: White + Sand + Oak Finish + Soft Graphite",
        ]

    if "karnataka" in location or "bangalore" in location or "bengaluru" in location or "mysore" in location:
        options.append("Option 4 - Karnataka Climate Fit: Warm White + Clay Beige + Natural Teak + Moss Green")
    elif "hyderabad" in location or "chennai" in location:
        options.append("Option 4 - Heat-Friendly Exterior Match: Ivory + Sandstone + Walnut + Deep Grey")
    elif "mumbai" in location or "pune" in location:
        options.append("Option 4 - Urban Premium: Soft White + Concrete Grey + Oak + Matte Black")

    if "kitchen" in room:
        options.append("Option 5 - Kitchen Focus: White + Sage Green + Light Oak + Black Handles")
    elif "bedroom" in room:
        options.append("Option 5 - Bedroom Calm: Beige + Dusty Olive + Walnut + Warm White")
    elif "living" in room:
        options.append("Option 5 - Living Room Blend: Cream + Greige + Wooden Brown + Charcoal")

    if "garden" in text or "nature" in text or "vasthu" in text or "vastu" in text:
        options.append("Option 6 - Nature Accent: Soft White + Olive + Mud Beige + Teak Brown")

    # Keep it concise and varied.
    unique: list[str] = []
    for item in options:
        if item not in unique:
            unique.append(item)
    return "\n".join(unique[:5])


def _build_design_image_prompts(payload: dict[str, str]) -> dict[str, str]:
    base = (
        f"Photorealistic architectural render for a {payload['style']} {payload['house_type']} home in {payload['location']}, "
        f"plot size {payload['plot_size']}, budget {payload['budget']}. "
        "Single scene only. No split screen. No collage. No text. No labels. No watermark. No poster layout. "
        "Natural lighting, realistic materials, polished presentation."
    )
    return {
        "living_room_image": (
            f"{base} Spacious living room interior with sofa set, TV wall, dining connection, warm wood finishes, "
            "soft ceiling lights, elegant decor, realistic camera view."
        ),
        "bedroom_image": (
            f"{base} Calm master bedroom interior with bed, side tables, wardrobe, layered lighting, cozy textures, "
            "realistic residential design render."
        ),
        "kitchen_image": (
            f"{base} Modern kitchen interior with storage cabinets, countertop, backsplash, task lighting, "
            "practical layout, realistic residential render."
        ),
        "front_elevation_image": (
            f"{base} Front exterior elevation of the house with entrance, balcony, windows, compound wall, "
            "landscaping, realistic residential facade render."
        ),
    }


def _mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def _draw_glow(draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, color: tuple[int, int, int]) -> None:
    for step in range(6, 0, -1):
        r = int(radius * (step / 6))
        fill = _mix(color, (255, 255, 255), 0.55 + (step * 0.03))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)


def _draw_window_scene(draw: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, sky: tuple[int, int, int]) -> None:
    draw.rounded_rectangle([x0, y0, x1, y1], radius=20, fill=sky, outline=(255, 255, 255), width=3)
    draw.line([(int((x0 + x1) / 2), y0), (int((x0 + x1) / 2), y1)], fill=(255, 255, 255), width=3)
    draw.line([(x0, int((y0 + y1) / 2)), (x1, int((y0 + y1) / 2))], fill=(255, 255, 255), width=3)
    draw.ellipse([x0 + 26, y0 + 26, x0 + 68, y0 + 68], fill=(255, 241, 176))


def _label_font_pair() -> tuple[ImageFont.ImageFont, ImageFont.ImageFont]:
    try:
        return (
            ImageFont.truetype("DejaVuSans-Bold.ttf", 18),
            ImageFont.truetype("DejaVuSans.ttf", 14),
        )
    except Exception:
        return ImageFont.load_default(), ImageFont.load_default()


def _draw_callout(
    draw: ImageDraw.ImageDraw,
    anchor: tuple[int, int],
    box_xy: tuple[int, int],
    title: str,
    subtitle: str = "",
) -> None:
    font_title, font_small = _label_font_pair()
    x, y = box_xy
    text_w = max(108, int(len(title) * 10 + 36), int(len(subtitle) * 7 + 28) if subtitle else 0)
    box_h = 52 if subtitle else 34
    draw.line([anchor, (x, y + box_h // 2)], fill=(255, 255, 255), width=3)
    draw.rounded_rectangle(
        [x, y, x + text_w, y + box_h],
        radius=12,
        fill=(244, 250, 255),
        outline=(255, 255, 255),
        width=2,
    )
    draw.text((x + 12, y + 7), title, fill=(27, 42, 66), font=font_title)
    if subtitle:
        draw.text((x + 12, y + 28), subtitle, fill=(78, 96, 121), font=font_small)


def _parse_bhk_count(payload: dict[str, str] | None) -> int:
    house_type = (payload or {}).get("house_type", "")
    match = re.search(r"(\d+)\s*bhk", house_type.lower())
    if match:
        return max(1, min(5, int(match.group(1))))
    return 2


def _plot_area(payload: dict[str, str] | None) -> int:
    plot = (payload or {}).get("plot_size", "")
    match = re.search(r"(\d+)\s*[xX]\s*(\d+)", plot)
    if match:
        return int(match.group(1)) * int(match.group(2))
    return 1200


def _has_keyword(payload: dict[str, str] | None, *words: str) -> bool:
    text = " ".join((payload or {}).values()).lower()
    return any(word.lower() in text for word in words)


def _design_flags(payload: dict[str, str] | None) -> dict[str, bool]:
    payload = payload or {}
    style = payload.get("style", "").lower()
    budget = payload.get("budget", "").lower()
    text = " ".join(payload.values()).lower()
    return {
        "modern": "modern" in style or "minimal" in style or "contemporary" in style,
        "traditional": "traditional" in style or "indian" in style or "heritage" in style,
        "luxury": "luxury" in style or "premium" in style or "high" in budget,
        "budget": "low" in budget or "budget" in budget or "affordable" in text,
        "garden": any(word in text for word in ["garden", "landscape", "lawn", "park"]),
        "parking": any(word in text for word in ["parking", "garage", "car", "driveway"]),
        "duplex": "duplex" in text or "villa" in text,
        "vastu": "vastu" in text or "vasthu" in text,
    }


def _draw_living_room_scene(
    draw: ImageDraw.ImageDraw,
    w: int,
    h: int,
    primary: tuple[int, int, int],
    accent: tuple[int, int, int],
    payload: dict[str, str] | None = None,
) -> None:
    flags = _design_flags(payload)
    wall = _mix(primary, (250, 246, 237), 0.7)
    floor = _mix(accent, (120, 88, 64), 0.55)
    if flags["modern"]:
        wall = _mix(primary, (241, 243, 246), 0.78)
        floor = _mix(accent, (96, 82, 72), 0.46)
    elif flags["traditional"]:
        wall = _mix(primary, (247, 233, 212), 0.72)
        floor = _mix(accent, (132, 88, 54), 0.62)
    if flags["luxury"]:
        floor = _mix(floor, (78, 64, 52), 0.38)

    draw.rectangle([0, 0, w, int(h * 0.68)], fill=wall)
    draw.polygon([(0, int(h * 0.68)), (w, int(h * 0.68)), (w, h), (0, h)], fill=floor)
    _draw_window_scene(draw, 72, 88, 332, 300, _mix(primary, (173, 216, 230), 0.6))
    sofa_fill = _mix(primary, (245, 239, 232), 0.62)
    chair_left = _mix(accent, (198, 129, 81), 0.35)
    chair_right = _mix(accent, (173, 112, 72), 0.25)
    if flags["modern"]:
        sofa_fill = _mix(primary, (233, 235, 240), 0.68)
        chair_left = _mix(accent, (118, 126, 142), 0.28)
        chair_right = _mix(accent, (88, 95, 108), 0.22)
    elif flags["traditional"]:
        sofa_fill = _mix(primary, (242, 226, 204), 0.56)
        chair_left = _mix(accent, (160, 100, 58), 0.38)
        chair_right = _mix(accent, (134, 76, 44), 0.28)
    draw.rounded_rectangle([430, 345, 830, 505], radius=34, fill=sofa_fill)
    draw.rounded_rectangle([452, 295, 585, 380], radius=24, fill=chair_left)
    draw.rounded_rectangle([612, 295, 790, 392], radius=24, fill=chair_right)
    draw.rounded_rectangle([500, 488, 762, 526], radius=18, fill=_mix(floor, (60, 40, 25), 0.25))
    draw.rounded_rectangle([280, 495, 438, 540], radius=18, fill=_mix(accent, (73, 55, 45), 0.42))
    draw.ellipse([205, 448, 425, 648], outline=(245, 232, 214), width=8)
    _draw_glow(draw, 760, 122, 42, (255, 226, 164))
    draw.rectangle([700, 148, 708, 344], fill=(238, 231, 218))
    draw.ellipse([672, 120, 736, 184], fill=(255, 226, 164))
    if flags["luxury"]:
        draw.rounded_rectangle([840, 252, 920, 520], radius=18, fill=_mix(accent, (78, 58, 42), 0.26))
        _draw_callout(draw, (872, 336), (784, 538), "Feature Panel")
    if flags["budget"]:
        draw.rounded_rectangle([120, 430, 204, 612], radius=18, fill=_mix(primary, (228, 235, 221), 0.22))
        _draw_callout(draw, (162, 506), (210, 586), "Indoor Plant")
    _draw_callout(draw, (506, 328), (118, 344), "Sofa", "Family seating")
    _draw_callout(draw, (356, 518), (86, 548), "Center Table")
    _draw_callout(draw, (704, 246), (774, 234), "Pendant Light")
    _draw_callout(draw, (232, 194), (350, 110), "Window", "Natural light")


def _draw_bedroom_scene(
    draw: ImageDraw.ImageDraw,
    w: int,
    h: int,
    primary: tuple[int, int, int],
    accent: tuple[int, int, int],
    payload: dict[str, str] | None = None,
) -> None:
    flags = _design_flags(payload)
    wall = _mix(primary, (236, 238, 244), 0.72)
    floor = _mix(accent, (132, 98, 71), 0.48)
    if flags["modern"]:
        wall = _mix(primary, (235, 238, 242), 0.8)
    elif flags["traditional"]:
        wall = _mix(primary, (243, 229, 210), 0.74)
        floor = _mix(accent, (122, 84, 58), 0.58)
    if flags["luxury"]:
        floor = _mix(floor, (82, 64, 48), 0.3)

    draw.rectangle([0, 0, w, int(h * 0.66)], fill=wall)
    draw.polygon([(0, int(h * 0.66)), (w, int(h * 0.66)), (w, h), (0, h)], fill=floor)
    bed_base = _mix(primary, (230, 228, 224), 0.5)
    headboard = _mix(accent, (132, 87, 66), 0.36)
    if flags["modern"]:
        bed_base = _mix(primary, (234, 236, 240), 0.52)
        headboard = _mix(accent, (98, 108, 122), 0.28)
    elif flags["traditional"]:
        bed_base = _mix(primary, (243, 229, 214), 0.54)
        headboard = _mix(accent, (145, 90, 56), 0.42)
    draw.rounded_rectangle([250, 248, 782, 510], radius=30, fill=bed_base)
    draw.rounded_rectangle([290, 210, 742, 306], radius=28, fill=headboard)
    draw.rounded_rectangle([290, 308, 742, 498], radius=28, fill=_mix(primary, (247, 244, 239), 0.78))
    draw.rounded_rectangle([304, 322, 488, 432], radius=22, fill=_mix(accent, (220, 194, 164), 0.32))
    draw.rounded_rectangle([542, 322, 726, 432], radius=22, fill=_mix(accent, (215, 189, 160), 0.28))
    draw.rounded_rectangle([146, 324, 232, 456], radius=16, fill=_mix(accent, (146, 115, 88), 0.22))
    draw.rounded_rectangle([812, 324, 900, 456], radius=16, fill=_mix(accent, (146, 115, 88), 0.22))
    _draw_glow(draw, 188, 280, 24, (255, 223, 158))
    _draw_glow(draw, 854, 280, 24, (255, 223, 158))
    _draw_window_scene(draw, 86, 96, 278, 250, _mix(primary, (177, 211, 228), 0.5))
    if flags["luxury"]:
        draw.rounded_rectangle([808, 190, 914, 500], radius=18, fill=_mix(primary, (216, 208, 196), 0.36))
    if flags["budget"]:
        draw.rounded_rectangle([84, 504, 222, 644], radius=24, fill=_mix(primary, (228, 230, 223), 0.28))
    _draw_callout(draw, (520, 394), (86, 530), "Bed", "Queen size")
    _draw_callout(draw, (190, 386), (42, 250), "Side Table")
    _draw_callout(draw, (854, 386), (786, 258), "Wardrobe")
    _draw_callout(draw, (184, 176), (304, 92), "Window", "Ventilation")


def _draw_kitchen_scene(
    draw: ImageDraw.ImageDraw,
    w: int,
    h: int,
    primary: tuple[int, int, int],
    accent: tuple[int, int, int],
    payload: dict[str, str] | None = None,
) -> None:
    flags = _design_flags(payload)
    wall = _mix(primary, (244, 245, 242), 0.76)
    counter = _mix(accent, (122, 109, 101), 0.28)
    cabinet = _mix(primary, (204, 197, 188), 0.44)
    if flags["modern"]:
        wall = _mix(primary, (239, 242, 245), 0.82)
        cabinet = _mix(primary, (218, 222, 226), 0.42)
    elif flags["traditional"]:
        wall = _mix(primary, (246, 235, 218), 0.78)
        cabinet = _mix(primary, (216, 194, 172), 0.46)
        counter = _mix(accent, (126, 92, 66), 0.38)
    if flags["luxury"]:
        counter = _mix(counter, (88, 82, 86), 0.36)

    draw.rectangle([0, 0, w, int(h * 0.62)], fill=wall)
    draw.rectangle([0, int(h * 0.62), w, h], fill=_mix(accent, (141, 106, 79), 0.5))
    draw.rounded_rectangle([82, 212, 872, 504], radius=22, fill=cabinet)
    draw.rectangle([82, 198, 872, 252], fill=counter)
    draw.rounded_rectangle([118, 104, 346, 220], radius=16, fill=_mix(primary, (226, 221, 214), 0.28))
    draw.rounded_rectangle([374, 104, 604, 220], radius=16, fill=_mix(primary, (226, 221, 214), 0.28))
    draw.rounded_rectangle([632, 104, 860, 220], radius=16, fill=_mix(primary, (226, 221, 214), 0.28))
    draw.rectangle([452, 250, 596, 344], fill=_mix(primary, (230, 236, 240), 0.12))
    draw.arc([438, 274, 582, 358], start=200, end=340, fill=(245, 245, 245), width=5)
    draw.rounded_rectangle([120, 532, 420, 650], radius=26, fill=_mix(accent, (93, 74, 63), 0.25))
    for x in [156, 240, 324]:
        draw.ellipse([x, 548, x + 34, 582], fill=(255, 224, 159))
    _draw_window_scene(draw, 714, 70, 930, 238, _mix(primary, (170, 209, 223), 0.56))
    if flags["modern"]:
        draw.rectangle([606, 256, 692, 344], fill=_mix(primary, (186, 194, 204), 0.3))
        _draw_callout(draw, (648, 300), (706, 332), "Tall Unit")
    if flags["budget"]:
        draw.rounded_rectangle([446, 534, 604, 640], radius=22, fill=_mix(primary, (226, 226, 220), 0.22))
    _draw_callout(draw, (478, 222), (84, 102), "Countertop")
    _draw_callout(draw, (242, 166), (86, 246), "Upper Cabinets")
    _draw_callout(draw, (772, 164), (792, 270), "Window")
    _draw_callout(draw, (266, 564), (448, 562), "Dining Counter")


def _draw_front_elevation_scene(
    draw: ImageDraw.ImageDraw,
    w: int,
    h: int,
    primary: tuple[int, int, int],
    accent: tuple[int, int, int],
    payload: dict[str, str] | None = None,
) -> None:
    flags = _design_flags(payload)
    sky_top = _mix(primary, (140, 198, 240), 0.62)
    sky_bottom = _mix(primary, (251, 222, 174), 0.45)
    if flags["modern"]:
        sky_top = _mix(primary, (152, 200, 236), 0.58)
        sky_bottom = _mix(primary, (232, 225, 214), 0.28)
    elif flags["traditional"]:
        sky_bottom = _mix(primary, (246, 206, 152), 0.52)
    for y in range(int(h * 0.68)):
        t = y / max(1, int(h * 0.68))
        draw.line([(0, y), (w, y)], fill=_mix(sky_top, sky_bottom, t), width=1)
    draw.rectangle([0, int(h * 0.68), w, h], fill=_mix(accent, (94, 132, 78), 0.42))
    facade_fill = _mix(primary, (242, 237, 228), 0.74)
    door_fill = _mix(accent, (122, 88, 64), 0.38)
    if flags["modern"]:
        facade_fill = _mix(primary, (238, 240, 242), 0.76)
        door_fill = _mix(accent, (82, 78, 74), 0.32)
    elif flags["traditional"]:
        facade_fill = _mix(primary, (243, 229, 210), 0.72)
        door_fill = _mix(accent, (132, 82, 48), 0.42)
    draw.rounded_rectangle([210, 230, 804, 616], radius=18, fill=facade_fill)
    draw.rectangle([478, 388, 610, 616], fill=door_fill)
    draw.rectangle([244, 288, 444, 448], fill=_mix(primary, (186, 205, 226), 0.34))
    draw.rectangle([624, 288, 772, 448], fill=_mix(primary, (186, 205, 226), 0.34))
    draw.rectangle([234, 246, 784, 284], fill=_mix(accent, (86, 67, 59), 0.25))
    draw.rectangle([154, 520, 870, 540], fill=_mix(accent, (88, 77, 70), 0.25))
    draw.line([(154, 520), (98, 680)], fill=_mix(accent, (96, 85, 78), 0.12), width=6)
    draw.line([(870, 520), (930, 680)], fill=_mix(accent, (96, 85, 78), 0.12), width=6)
    for x in [124, 920]:
        draw.rectangle([x, 506, x + 12, 630], fill=_mix(accent, (60, 80, 52), 0.1))
        draw.ellipse([x - 28, 458, x + 40, 530], fill=_mix(primary, (93, 143, 87), 0.1))
    if flags["parking"]:
        draw.rectangle([90, 560, 178, 630], fill=_mix(primary, (182, 188, 194), 0.28))
        draw.rounded_rectangle([92, 564, 176, 624], radius=18, outline=(245, 248, 252), width=3)
    if flags["garden"]:
        draw.ellipse([816, 552, 914, 638], fill=_mix(primary, (92, 148, 92), 0.14))
    _draw_glow(draw, 168, 120, 56, (255, 233, 176))
    _draw_callout(draw, (544, 470), (678, 394), "Main Entry")
    _draw_callout(draw, (686, 360), (794, 302), "Balcony")
    _draw_callout(draw, (236, 520), (46, 552), "Landscape Edge")
    _draw_callout(draw, (344, 340), (86, 272), "Front Window")


def _draw_blueprint_scene(
    draw: ImageDraw.ImageDraw,
    w: int,
    h: int,
    primary: tuple[int, int, int],
    accent: tuple[int, int, int],
    payload: dict[str, str] | None = None,
) -> None:
    bg = _mix(primary, (28, 76, 122), 0.46)
    draw.rectangle([0, 0, w, h], fill=bg)

    # Blueprint grid with minor/major lines
    minor = _mix((76, 146, 204), primary, 0.22)
    major = _mix((156, 214, 255), primary, 0.15)
    for x in range(0, w, 24):
        draw.line([(x, 0), (x, h)], fill=minor, width=1)
    for y in range(0, h, 24):
        draw.line([(0, y), (w, y)], fill=minor, width=1)
    for x in range(0, w, 120):
        draw.line([(x, 0), (x, h)], fill=major, width=2)
    for y in range(0, h, 120):
        draw.line([(0, y), (w, y)], fill=major, width=2)

    wall = (241, 248, 255)
    thin = (194, 228, 255)

    try:
        font_title = ImageFont.truetype("DejaVuSans-Bold.ttf", 28)
        font_big = ImageFont.truetype("DejaVuSans-Bold.ttf", 21)
        font_small = ImageFont.truetype("DejaVuSans.ttf", 16)
    except Exception:
        font_title = ImageFont.load_default()
        font_big = ImageFont.load_default()
        font_small = ImageFont.load_default()

    draw.text((120, 54), "Blueprint House Plan", fill=wall, font=font_title)

    # Compass arrow
    draw.line([(70, 112), (70, 48)], fill=wall, width=3)
    draw.polygon([(70, 34), (62, 56), (78, 56)], fill=wall)
    draw.text((50, 118), "N", fill=thin, font=font_small)

    bhk = _parse_bhk_count(payload)
    large_plot = _plot_area(payload) >= 1800
    include_parking = _has_keyword(payload, "parking", "garage", "car", "driveway") or large_plot
    include_garden = _has_keyword(payload, "garden", "landscape", "park") or large_plot

    # Outer boundary
    x0, y0, x1, y1 = 120, 140, 900, 650
    draw.rectangle([x0, y0, x1, y1], outline=wall, width=8)

    top_y = 332
    left_x = 330
    mid_x = 584

    draw.line([(left_x, y0), (left_x, y1)], fill=wall, width=6)
    draw.line([(mid_x, y0), (mid_x, y1)], fill=wall, width=6)
    draw.line([(x0, top_y), (x1, top_y)], fill=wall, width=6)
    draw.line([(462, y0), (462, top_y)], fill=wall, width=6)

    if bhk == 2:
        draw.line([(mid_x, 512), (x1, 512)], fill=wall, width=6)
    elif bhk == 3:
        draw.line([(left_x, 502), (x1, 502)], fill=wall, width=6)
        draw.line([(742, top_y), (742, y1)], fill=wall, width=6)
    else:
        draw.line([(x0, 500), (x1, 500)], fill=wall, width=6)
        draw.line([(440, top_y), (440, y1)], fill=wall, width=6)
        draw.line([(742, top_y), (742, y1)], fill=wall, width=6)

    # Doors with arcs
    door_specs = [
        ((left_x - 14, 224, left_x + 14, 296), (left_x - 54, 224, left_x + 18, 294), 270, 360),
        ((mid_x - 14, 388, mid_x + 14, 464), (mid_x - 54, 388, mid_x + 18, 460), 270, 360),
        ((458, 496, 534, 524), (458, 456, 530, 528), 180, 270),
        ((x0, 558, x0 + 28, 620), (x0, 548, x0 + 60, 620), 90, 180),
    ]
    for cutout, arc_box, start, end in door_specs:
        draw.rectangle(cutout, fill=bg)
        draw.arc(arc_box, start=start, end=end, fill=thin, width=3)

    windows = [
        (190, y0, 300, y0),
        (644, y0, 776, y0),
        (x1, 206, x1, 304),
        (x1, 548, x1, 626),
        (x0, 372, x0, 458),
    ]
    if bhk >= 3:
        windows.append((440, y1, 556, y1))
    for coords in windows:
        draw.line(coords, fill=thin, width=4)

    room_labels: list[tuple[str, tuple[int, int]]] = []
    if include_parking:
        room_labels.append(("Parking", (176, 214)))
    else:
        room_labels.append(("Bedroom 1", (150, 214)))
    room_labels.extend(
        [
            ("Bathroom", (366, 210)),
            ("Hall", (622, 210)),
            ("Kitchen", (760, 210)),
            ("Living Area", (612, 404)),
        ]
    )

    if bhk == 2:
        room_labels.append(("Bedroom 2", (700, 560)))
    elif bhk == 3:
        room_labels.append(("Bedroom 2", (390, 560)))
        room_labels.append(("Bedroom 3", (770, 560)))
    else:
        room_labels.append(("Bedroom 2", (170, 560)))
        room_labels.append(("Bedroom 3", (500, 560)))
        room_labels.append(("Bedroom 4", (786, 560)))

    for label, pos in room_labels:
        draw.text(pos, label, fill=wall, font=font_big)

    draw.text((632, 110), "Front Door", fill=thin, font=font_small)
    draw.text((118, 664), "Back Door", fill=thin, font=font_small)
    draw.text((522, 674), "Backyard" if include_garden else "Utility Yard", fill=thin, font=font_small)
    draw.text((726, 674), f"{(payload or {}).get('plot_size', 'Concept')} Plot", fill=thin, font=font_small)

    if include_parking:
        car = [170, 200, 292, 440]
        draw.rounded_rectangle(car, radius=28, outline=thin, width=4)
        draw.ellipse([194, 414, 224, 444], outline=thin, width=3)
        draw.ellipse([238, 414, 268, 444], outline=thin, width=3)
    else:
        draw.rounded_rectangle([154, 228, 290, 286], radius=16, outline=thin, width=3)
        draw.rounded_rectangle([178, 318, 274, 432], radius=14, outline=thin, width=3)

    draw.rounded_rectangle([620, 382, 748, 450], radius=18, outline=thin, width=3)
    draw.rounded_rectangle([660, 558, 844, 622], radius=18, outline=thin, width=3)
    draw.rectangle([782, 234, 864, 286], outline=thin, width=3)
    draw.ellipse([696, 374, 760, 438], outline=thin, width=3)
    if bhk >= 3:
        draw.rounded_rectangle([370, 558, 548, 622], radius=16, outline=thin, width=3)
    if bhk >= 4:
        draw.rounded_rectangle([158, 558, 338, 622], radius=16, outline=thin, width=3)

    # Light blueprint dimensions
    draw.line([(120, 102), (900, 102)], fill=thin, width=2)
    draw.line([(120, 94), (120, 110)], fill=thin, width=2)
    draw.line([(900, 94), (900, 110)], fill=thin, width=2)
    draw.line([(940, 140), (940, 650)], fill=thin, width=2)
    draw.line([(932, 140), (948, 140)], fill=thin, width=2)
    draw.line([(932, 650), (948, 650)], fill=thin, width=2)


def _offline_design_images(payload: dict[str, str]) -> dict[str, str]:
    clean = "|".join(payload.values())
    primary, secondary, accent = _palette(clean)
    outputs: dict[str, str] = {}

    scenes = {
        "living_room_image": _draw_living_room_scene,
        "bedroom_image": _draw_bedroom_scene,
        "kitchen_image": _draw_kitchen_scene,
        "front_elevation_image": _draw_front_elevation_scene,
        "blueprint_image": _draw_blueprint_scene,
    }

    for key, label in IMAGE_SLOTS:
        img = Image.new("RGB", (1024, 768), _mix(primary, secondary, 0.35))
        draw = ImageDraw.Draw(img)
        scenes[key](draw, 1024, 768, primary, accent, payload)
        outputs[key] = _encode_png(img)

    return outputs


def _generate_design_offline(payload: dict[str, str]) -> DesignAiResult:
    style = payload["style"]
    house_type = payload["house_type"]
    room_type = payload["room_type"]
    budget = payload["budget"]
    plot_size = payload["plot_size"]
    location = payload["location"]
    user_prompt = payload.get("user_prompt", "").strip()

    interior = (
        f"Use a {_smart_phrase(style.lower(), 'modern')} layout for the {room_type.lower()} with soft cream or warm white walls, "
        f"space-saving storage, clean-lined furniture, and layered textures that suit a {house_type} home within a {budget.lower()} budget."
    )
    if user_prompt:
        interior += f" Also include the user's requested direction: {user_prompt[:280]}."
    exterior = (
        f"Keep the front elevation balanced with light neutral walls, darker frame accents, a neat entry path, balcony detailing, "
        f"and a compact landscape edge that fits a {plot_size} plot in {location}."
    )
    color_palette = _pick_color_options(payload)
    material = (
        "Use wood-finish laminate, vitrified tiles, matte wall paint, powder-coated metal railings, "
        "and gypsum false ceiling details for a clean and durable finish."
    )
    lighting = (
        f"Layer warm ceiling lights, focused task lighting in the {room_type.lower()}, soft wall washers, "
        "and entry lighting outside to make the design feel bright, calm, and welcoming."
    )
    if user_prompt:
        lighting += " Match the mood and use-case described in the custom prompt."

    images = _offline_design_images(payload)

    return DesignAiResult(
        title=_design_title(payload),
        interior_suggestion=interior,
        exterior_suggestion=exterior,
        color_palette=color_palette,
        material_suggestion=material,
        lighting_suggestion=lighting,
        images_base64_png=images,
        provider="offline",
        note=None,
    )


def _openai_design_plan(client, payload: dict[str, str]) -> dict:
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "title": {"type": "string"},
            "interior_suggestion": {"type": "string"},
            "exterior_suggestion": {"type": "string"},
            "color_palette": {"type": "string"},
            "material_suggestion": {"type": "string"},
            "lighting_suggestion": {"type": "string"},
        },
        "required": [
            "title",
            "interior_suggestion",
            "exterior_suggestion",
            "color_palette",
            "material_suggestion",
            "lighting_suggestion",
        ],
    }

    system = (
        "You are an expert interior and exterior design assistant for residential construction in India. "
        "Give practical, attractive, realistic suggestions that can be shown in a college project demo. "
        "Keep every suggestion specific to the user's house type, room type, plot size, budget, and location. "
        "Return valid JSON only."
    )
    user = (
        f"Generate a design plan for:\n"
        f"House Type: {payload['house_type']}\n"
        f"Budget: {payload['budget']}\n"
        f"Style: {payload['style']}\n"
        f"Room Type: {payload['room_type']}\n"
        f"Plot Size: {payload['plot_size']}\n"
        f"Location: {payload['location']}\n\n"
        f"Custom Prompt: {payload.get('user_prompt', '')}\n\n"
        "Create interior suggestion, exterior suggestion, color palette, material suggestion, and lighting suggestion. "
        "Do not include image prompts in the response."
    )

    resp = client.responses.create(
        model=settings.openai_text_model,
        input=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        text={"format": {"type": "json_schema", "name": "constructhub_design_ai", "schema": schema}},
    )
    if getattr(resp, "status", None) != "completed":
        raise RuntimeError("OpenAI response incomplete")

    raw = getattr(resp, "output_text", None)
    if not raw or not isinstance(raw, str):
        raise RuntimeError("OpenAI missing output_text")
    return json.loads(raw)


def _generate_design_openai(payload: dict[str, str], fallback: DesignAiResult) -> DesignAiResult:
    client = _openai_client()
    plan = _openai_design_plan(client, payload)
    return DesignAiResult(
        title=str(plan["title"])[:160],
        interior_suggestion=str(plan["interior_suggestion"])[:3000],
        exterior_suggestion=str(plan["exterior_suggestion"])[:3000],
        color_palette=str(plan["color_palette"])[:500],
        material_suggestion=str(plan["material_suggestion"])[:3000],
        lighting_suggestion=str(plan["lighting_suggestion"])[:3000],
        images_base64_png=_offline_design_images(payload),
        provider="openai",
        note=None,
    )


def _gemini_client():
    from google import genai  # type: ignore

    key = (settings.gemini_api_key or "").strip()
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    return genai.Client(api_key=key)


def _gemini_extract_text(response) -> str:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text
    raise RuntimeError("Gemini missing text response")


def _generate_design_gemini(payload: dict[str, str], fallback: DesignAiResult) -> DesignAiResult:
    from google.genai import types  # type: ignore

    client = _gemini_client()
    schema_hint = {
        "title": "string",
        "interior_suggestion": "string",
        "exterior_suggestion": "string",
        "color_palette": "string",
        "material_suggestion": "string",
        "lighting_suggestion": "string",
    }
    prompt = (
        "Return valid JSON only for this design request.\n"
        f"{json.dumps(payload, ensure_ascii=True)}\n"
        f"Schema: {json.dumps(schema_hint, ensure_ascii=True)}\n"
        "Do not include image prompts."
    )
    response = client.models.generate_content(
        model=settings.gemini_text_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.8,
            response_mime_type="application/json",
        ),
    )
    plan = json.loads(_gemini_extract_text(response))

    return DesignAiResult(
        title=str(plan["title"])[:160],
        interior_suggestion=str(plan["interior_suggestion"])[:3000],
        exterior_suggestion=str(plan["exterior_suggestion"])[:3000],
        color_palette=str(plan["color_palette"])[:500],
        material_suggestion=str(plan["material_suggestion"])[:3000],
        lighting_suggestion=str(plan["lighting_suggestion"])[:3000],
        images_base64_png=_offline_design_images(payload),
        provider="gemini",
        note=None,
    )


def generate_design_suggestions(
    *,
    house_type: str,
    budget: str,
    style: str,
    room_type: str,
    plot_size: str,
    location: str,
    user_prompt: str = "",
) -> DesignAiResult:
    payload = {
        "house_type": house_type.strip(),
        "budget": budget.strip(),
        "style": style.strip(),
        "room_type": room_type.strip(),
        "plot_size": plot_size.strip(),
        "location": location.strip(),
        "user_prompt": user_prompt.strip(),
    }

    def with_images(result: DesignAiResult) -> DesignAiResult:
        if result.images_base64_png:
            return result
        return DesignAiResult(
            title=result.title,
            interior_suggestion=result.interior_suggestion,
            exterior_suggestion=result.exterior_suggestion,
            color_palette=result.color_palette,
            material_suggestion=result.material_suggestion,
            lighting_suggestion=result.lighting_suggestion,
            images_base64_png=_offline_design_images(payload),
            provider=result.provider,
            note=result.note,
        )

    offline = _generate_design_offline(payload)
    provider = (settings.ai_provider or "offline").strip().lower()
    if provider == "openai":
        try:
            return with_images(_generate_design_openai(payload, offline))
        except Exception as exc:
            return with_images(DesignAiResult(
                title=offline.title,
                interior_suggestion=offline.interior_suggestion,
                exterior_suggestion=offline.exterior_suggestion,
                color_palette=offline.color_palette,
                material_suggestion=offline.material_suggestion,
                lighting_suggestion=offline.lighting_suggestion,
                images_base64_png={},
                provider="offline",
                note=f"OpenAI suggestions are unavailable right now. ({type(exc).__name__})",
            ))
    if provider == "gemini":
        try:
            return with_images(_generate_design_gemini(payload, offline))
        except Exception as exc:
            return with_images(DesignAiResult(
                title=offline.title,
                interior_suggestion=offline.interior_suggestion,
                exterior_suggestion=offline.exterior_suggestion,
                color_palette=offline.color_palette,
                material_suggestion=offline.material_suggestion,
                lighting_suggestion=offline.lighting_suggestion,
                images_base64_png={},
                provider="offline",
                note=f"Gemini suggestions are unavailable right now. ({type(exc).__name__})",
            ))
    return with_images(offline)
