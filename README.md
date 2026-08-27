# Vestiaire — Glamouröser Kleiderschrank-Manager

Ein Full-Stack-Web-GUI im Hollywood-Stil, in dem Benutzer sich registrieren,
ihre Garderobe mit Kleidungsstücken (Bild-URL, Kategorie) verwalten, sie nach
Kategorie durchstöbern und im Outfit-Creator einzelne Teile zu gespeicherten
Outfits kombinieren — in eleganter Red-Carpet-Optik mit tiefem Samtschwarz und
warmem Gold-Akzent.

## Tech-Stack

- **Backend**: Python (FastAPI)
- **Frontend**: React + Vite
- **Authentifizierung**: JWT (HS256, Ablauf ≤ 15 Minuten)
- **Datenbank**: SQLite
- **API**: REST

## Installation

Voraussetzung: Python 3.13 (oder neuer).

```bash
cd backend
py -m pip install -r requirements.txt
```

## Start (Entwicklung)

```bash
cd backend
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Die API ist danach unter `http://localhost:8000` erreichbar, der Health-Check
unter `http://localhost:8000/api/health`. Beim Start werden die Tabellen
automatisch angelegt. Ohne gesetztes `JWT_SECRET` erzeugt die Anwendung pro
Prozess ein Zufalls-Secret — zum Ausprobieren genügt also der Befehl oben.

Für ein **stabiles** `JWT_SECRET` (damit Tokens einen Neustart überleben) den
Wert vor dem Start exportieren:

```powershell
# Windows (PowerShell)
$env:JWT_SECRET = py -c "import secrets; print(secrets.token_hex(32))"
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

```bash
# Linux / macOS
export JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Alle Werte sind in `.env.example` im Repo-Root aufgelistet. Der Start wird
maschinenlesbar durch `RUN.json` im Repo-Root beschrieben.

## Umgebungsvariablen

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./dev.db` | Datenbank-Verbindungs-URL |
| `JWT_SECRET` | pro Prozess generiert | Signatur-Geheimnis für JWTs |
| `JWT_EXPIRES_MINUTES` | `15` | Gültigkeitsdauer der Tokens |
| `CORS_ORIGIN` | `http://localhost:5173` | Erlaubte Frontend-Origin |
| `PORT` | `8000` | Port des Servers |

## API-Endpunkte

Alle Antworten sind JSON. Fehler haben einheitlich die Form
`{"error": {"code": str, "message": str}}` mit den Statuscodes
`400/401/403/404/409/422/429`. Geschützte Endpunkte erwarten den Header
`Authorization: Bearer <JWT>`.

### Öffentlich

- `GET /api/health` → `200 {"status": "ok"}`

### Auth

- `POST /api/auth/register` — Body `{"email": str, "password": str}` → `201 {"access_token": str, "token_type": str}` (400, 409)
- `POST /api/auth/login` — Body `{"email": str, "password": str}` → `200 {"access_token": str, "token_type": str}` (401)

### Garderobe

- `GET /api/wardrobe/items?category=<str>` → `200 [Item]` (401)
- `POST /api/wardrobe/items` — Body `{"name", "category", "color", "image_url"}` → `201 Item` (400, 422)
- `PUT /api/wardrobe/items/{id}` → `200 Item` (404)
- `DELETE /api/wardrobe/items/{id}` → `204` (404)

### Outfits

- `GET /api/outfits` → `200 [Outfit]` (401)
- `POST /api/outfits` — Body `{"name": str, "item_ids": [int]}` → `201 Outfit` (400, 404)
- `GET /api/outfits/{id}` → `200 Outfit` (404)
- `DELETE /api/outfits/{id}` → `204` (404)

### Konto

- `DELETE /api/users/me` → `204` (401; löscht das Konto kaskadierend)

### Datenformen

```
Item   = { id: int, name: str, category: str, color: str, image_url: str, owner_id: int }
Outfit = { id: int, name: str, items: [Item], owner_id: int }
```

Kategorien: `["Oberteile", "Unterteile", "Kleider", "Schuhe", "Accessoires"]`

## Features

- Registrierung und Login mit sofortiger Anmeldung (JWT)
- Garderobe: Kleidungsstücke mit Bild-URL anlegen, durchsuchen, nach Kategorie filtern
- Outfit-Creator: Einzelteile zu benannten Outfits kombinieren und speichern
- Vorschaukacheln für gespeicherte Outfits
- Jeder Benutzer sieht ausschließlich seine eigenen Daten
- Konto-Löschung inklusive kaskadierender Entfernung aller Daten
