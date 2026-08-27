VERDICT: CHANGES_REQUESTED

## Sicherheitsbericht

### Scanner-Auswertung
Die konfigurierten Scanner sind nicht gelaufen (`bandit`: `[skipped]`, `semgrep`: `[skipped]`). Ein Audit der Python-/npm-Abhängigkeiten ist im gezeigten Stand ebenfalls nicht enthalten. Das Fehlen von Scanner-Ausgabe wird nicht als Schwachstelle gewertet; die Abhängigkeiten konnten dadurch aber nicht automatisiert geprüft werden.

### Positive Befunde
- **Secrets:** Keine hartkodierten Passwörter, Token oder Schlüssel im Quellcode gefunden. Das JWT-Secret wird aus der Umgebung gelesen oder bei Bedarf erzeugt und in eine gitignored Datei geschrieben.
- **Injektion:** SQL-Zugriffe erfolgen über SQLAlchemy mit parametrisierten Queries, keine sichtbare SQL-Injection. Bild-URLs werden serverseitig auf `http://`/`https://` beschränkt; `javascript:` und `data:` werden abgelehnt.
- **AuthN/AuthZ:** JWT mit HS256, begrenzter Ablaufzeit (maximal 15 Minuten). Alle Kleidungsstück- und Outfit-Endpunkte prüfen die Eigentümerschaft; fremde IDs liefern 404. Das Konto-Löschen kaskadiert über die ORM-Beziehungen.
- **CORS:** `allow_origins` ist explizit auf die konfigurierte Frontend-Origin gesetzt, nicht auf `*`; `allow_credentials=True` ist deklariert.
- **Frontend:** React escaped Textausgaben, sodass im gezeigten Stand keine direkte XSS-Lücke erkennbar ist. Es werden keine Drittanbieter-Ressourcen geladen.

### Findings

#### 1. JWT-Secret-Datei wird mit Standardrechten erstellt
**Schweregrad:** medium  
**Betroffene Stelle:** `backend/app/config.py::_load_or_create_jwt_secret`  
**Problem:**  
Das erzeugte JWT-Secret wird mit `_SECRET_FILE.write_text(generated, ...)` in `backend/.jwt_secret` geschrieben. Die Datei übernimmt die Standard-Dateirechte des Prozesses (üblicherweise `0644`). Ein lokaler Angreifer mit Lesezugriff auf das Verzeichnis kann das Secret auslesen und damit gültige JWTs für beliebige Benutzer erzeugen.  
**Fix:**  
Die Datei mit restriktiven Rechten anlegen, z. B.:
```python
_SECRET_FILE.touch(mode=0o600, exist_ok=True)
_SECRET_FILE.write_text(generated, encoding="utf-8")
os.chmod(_SECRET_FILE, 0o600)
```

#### 2. Rate-Limiting ist rein in-memory und nicht verteilt
**Schweregrad:** low  
**Betroffene Stelle:** `backend/app/routers/auth.py::_client_ip`, `_failures`, `_is_rate_limited`  
**Problem:**  
Die Fehlversuche werden in einem Prozess-lokalen `defaultdict` gespeichert. Bei mehreren Uvicorn-Workern oder mehreren Prozessinstanzen greift das Limit pro Prozess und kann umgangen werden. Außerdem verwendet `_client_ip` direkt `request.client.host`. Läuft die Anwendung hinter einem Reverse Proxy, sehen alle Clients aus Sicht der Anwendung wie dieselbe IP aus, wodurch ein einzelner Angreifer alle Benutzer blockieren kann.  
**Fix:**  
Für den Produktionsbetrieb einen zentralen Store (z. B. Redis oder Datenbank) verwenden. Wenn ein Reverse Proxy eingesetzt wird, die echte Client-IP nur aus vertrauenswürdigen Proxy-Headern (z. B. `X-Forwarded-For`) übernehmen und den Proxy-Adressbereich explizit als vertrauenswürdig konfigurieren.

#### 3. Fehlende Längenbegrenzungen auf Benutzereingaben
**Schweregrad:** low  
**Betroffene Stelle:** `backend/app/schemas.py`, `backend/app/routers/outfits.py::create_outfit`, `backend/app/routers/items.py::_validate_payload`  
**Problem:**  
Mehrere Textfelder (Name, Farbe, Bild-URL, Outfit-Name) haben keine maximale Länge. Sehr große Eingaben können Datenbank, Logs oder Speicher belasten. Der Outfit-Name wird außerdem nicht auf Leerstring geprüft.  
**Fix:**  
In den Pydantic-Schemas `max_length` setzen, z. B.:
- `email`: 254 Zeichen
- `password`: 72 Zeichen
- `name` bei Kleidungsstücken: 100 Zeichen
- `color`: 50 Zeichen
- `image_url`: 2048 Zeichen
- `OutfitCreate.name`: 80 Zeichen und Leerstring ablehnen

#### 4. JWT im localStorage — Härtungshinweis
**Schweregrad:** low  
**Betroffene Stelle:** `frontend/src/auth/AuthContext.tsx`, `frontend/src/api/client.ts`  
**Problem:**  
Das Bearer-Token wird im `localStorage` gespeichert. Sollte künftig eine XSS-Lücke entstehen, kann ein Angreifer das Token auslesen. Im aktuell sichtbaren Code ist keine XSS-Lücke erkennbar; dennoch ist `localStorage` für hochsensible Token nicht die robusteste Ablage.  
**Fix:**  
Für Produktionshärtung: Token in einem `HttpOnly`-Cookie ablegen und CSRF-Schutz ergänzen. Falls das nicht gewünscht ist, mindestens eine strikte Content-Security-Policy und `Trusted Types` im Frontend setzen.

### Fazit
Es wurden keine hochkritischen oder kritischen Lücken wie hartkodierte Secrets, Injection/RCE, Auth-Bypass oder PII-Leaks identifiziert. Die umgesetzten Sicherheitsanforderungen (AC-08 bis AC-15) sind weitgehend erfüllt. Aufgrund der genannten Härtungspunkte sind vor einem Produktiv-Betrieb Änderungen empfohlen.