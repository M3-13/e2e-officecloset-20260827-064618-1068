VERDICT: CHANGES_REQUESTED

Das Produkt ist in der aktuellen Form grundsätzlich tragfähig: Registrierung/Login mit JWT, kurze Token-Lebensdauer, bcrypt-Hashing, Rate-Limiting, konsequente Eigentümerprüfungen sowie Impressum und Datenschutzerklärung sind vorhanden. Es bestehen jedoch behebbare Lücken bei der DSGVO-Transparenz, der Datenminimierung, der Umsetzbarkeit von Betroffenenrechten, der CRA-Dokumentation und der Barrierefreiheit. Diese sind ohne Architekturumbau behebbar, rechtfertigen aber nicht direkt eine Freigabe.

---

## 1. DSGVO

### Befund G1 — Verarbeitung von IP-Adressen fehlt in der Datenschutzerklärung  
**Schweregrad:** hoch  
**Datei:** `frontend/src/pages/PrivacyPage.tsx`

Die API erhebt und verarbeitet für das Rate-Limiting die IP-Adresse des Clients (`_client_ip`, `_failures` in `backend/app/routers/auth.py`). Die Datenschutzerklärung nennt IP-Adressen und deren Speicherdauer bislang nicht. Damit fehlt die nach Art. 13 DSGVO erforderliche Information.

**Konkrete Abhilfe:**  
In `PrivacyPage.tsx` in Abschnitt „3. Welche Daten wir speichern“ folgende Kategorie ergänzen:

> **IP-Adresse:** Ihre IP-Adresse wird bei Anmeldung und Registrierung kurzzeitig im Arbeitsspeicher verarbeitet, um wiederholte fehlgeschlagene Versuche zu erkennen (Missbrauchsprävention). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Die IP-Adresse wird höchstens 15 Minuten gespeichert.

Abschnitt „5. Speicherdauer“ ebenfalls um einen Satz zur IP-Adresse ergänzen.

---

### Befund G2 — Automatische Speicherbegrenzung der Rate-Limit-Daten nicht erzwungen  
**Schweregrad:** mittel  
**Datei:** `backend/app/routers/auth.py`

`_failures` speichert IP-Adressen als `dict[str, list[float]]`. Einträge werden nur bereinigt, wenn dieselbe IP erneut anfragt (`_prune_failures`). Ohne Folgezugriff können IP-Adressen länger als 15 Minuten im Prozessspeicher verbleiben. Das widerspricht dem Grundsatz der Speicherbegrenzung (Art. 5 Abs. 1 lit. e DSGVO).

**Konkrete Abhilfe:**  
Beim Schreiben in `_record_failure` oder über eine periodische Hintergrundbereinigung veraltete Einträge global entfernen, z. B.:

```python
def _prune_all_failures_locked(now: float) -> None:
    for ip in list(_failures.keys()):
        _failures[ip] = [t for t in _failures[ip] if now - t <= _RATE_WINDOW_SECONDS]
        if not _failures[ip]:
            del _failures[ip]
```

Zusätzlich die maximale Speicherdauer im Codekommentar und in der Datenschutzerklärung klar dokumentieren.

---

### Befund G3 — Fehlende Längengrenzen bei personenbezogenen Eingaben  
**Schweregrad:** mittel  
**Dateien:** `backend/app/schemas.py`, `backend/app/models.py`

E-Mail, Passwort, Kleidungsstückname, Farbe, Bild-URL und Outfit-Name werden ohne `max_length` angenommen und in SQLite als unbegrenzte `String`-Spalten gespeichert. Das verstößt gegen den Grundsatz der Datenminimierung und eröffnet unnötig große Eingaben.

**Konkrete Abhilfe:**  
In `backend/app/schemas.py` Pydantic-Felder begrenzen, z. B.:

```python
email: str = Field(max_length=320)
password: str = Field(min_length=8, max_length=72)
name: str = Field(min_length=1, max_length=100)
category: str = Field(max_length=50)
color: str = Field(max_length=50)
image_url: str = Field(max_length=2048)
name: str = Field(min_length=1, max_length=100)  # OutfitCreate
```

In `backend/app/models.py` die Spalten entsprechend als `String(100)`, `String(50)`, `String(2048)` usw. definieren.

---

### Befund G4 — Betroffenenrechte nicht technisch umsetzbar  
**Schweregrad:** hoch  
**Dateien:** `backend/app/routers/users.py`, `frontend/src/pages/AccountPage.tsx`, `frontend/src/pages/PrivacyPage.tsx`

Die Datenschutzerklärung verspricht Auskunft, Berichtigung und Datenübertragbarkeit (Art. 15, 16, 20 DSGVO). Technisch existiert aber nur `DELETE /api/users/me`. Es gibt keinen Endpunkt, um die eigenen Stammdaten einzusehen oder zu ändern.

**Konkrete Abhilfe:**  
Mindestens folgende Endpunkte ergänzen:

- `GET /api/users/me` → liefert `id`, `email`
- `PATCH /api/users/me` → erlaubt Änderung von E-Mail und Passwort

`AccountPage.tsx` um einen Bereich „E-Mail ändern / Passwort ändern“ erweitern. Alternativ in der Datenschutzerklärung klarstellen, dass diese Rechte nur per E-Mail an den genannten Datenschutzkontakt ausgeübt werden können — vorzugswürdig ist jedoch die technische Umsetzung.

---

### Befund G5 — Speicherung des JWT im `localStorage` nicht in der Datenschutzerklärung offengelegt  
**Schweregrad:** mittel  
**Dateien:** `frontend/src/api/client.ts`, `frontend/src/pages/PrivacyPage.tsx`

Das Zugriffstoken wird als `auth_token` im `localStorage` gespeichert. Das ist ein Zugriff auf den Endgerätespeicher im Sinne des ePrivacy-Rechts, auch wenn es technisch erforderlich ist. Die Datenschutzerklärung erwähnt diese Speicherung nicht.

**Konkrete Abhilfe:**  
In `PrivacyPage.tsx` einen Abschnitt „9. Speicherung im Endgerät“ ergänzen:

> Die Anwendung speichert ein technisch erforderliches Zugriffstoken (JWT) im lokalen Speicher Ihres Browsers (localStorage). Es dient ausschließlich der Anmeldung während der Nutzung und wird beim Abmelden gelöscht.

Langfristig sollte geprüft werden, ob das Token in einem `HttpOnly`-Cookie mit CSRF-Schutz gespeichert werden kann.

---

### Befund G6 — Benutzergenerierte externe Bild-URLs erzeugen nicht offengelegte Datenflüsse  
**Schweregrad:** hoch  
**Dateien:** `frontend/src/pages/PrivacyPage.tsx`, `frontend/src/components/ItemCard.tsx`, `frontend/src/components/ItemForm.tsx`

Die Anwendung lädt benutzergenerierte Bild-URLs direkt im Browser (`<img src={item.image_url}>`). Zeigt der Nutzer ein Bild von einer externen Domain, werden beim Laden personenbeziehbare technische Daten wie IP-Adresse, User-Agent und Referrer an den jeweiligen Host übertragen. Die Datenschutzerklärung enthält die Aussage, es würden keine Drittanbieter-Ressourcen geladen; das ist in dieser Pauschalität ungenau.

**Konkrete Abhilfe:**  
In `PrivacyPage.tsx` in Abschnitt „3. Welche Daten wir speichern“ sowie „6. Hosting und Datenübermittlung“ ergänzen:

> Wenn Sie für ein Kleidungsstück eine externe Bild-URL angeben, wird dieses Bild beim Anzeigen direkt von dem angegebenen Server in Ihrem Browser geladen. Dabei werden technische Daten wie Ihre IP-Adresse und Ihr Browser-Typ an den Betreiber dieses Servers übermittelt. Die Auswahl der Bild-URL liegt in Ihrer Verantwortung; Vestiaire lädt keine eigenen Tracking- oder Werberessourcen.

Zusätzlich im Bild-URL-Eingabefeld (`ItemForm.tsx`) einen kurzen Hinweis ergänzen, z. B. „Beim Anzeigen externer Bilder können Daten an den Bildanbieter übermittelt werden.“

---

## 2. EU Cyber Resilience Act (CRA)

### Befund C1 — SBOM und dokumentierte Sicherheitseigenschaften fehlen  
**Schweregrad:** mittel  
**Dateien:** `README.md`, `DESIGN.md`, `backend/requirements.txt`, `frontend/package.json`

Die Anwendung besteht aus einem Backend mit Drittbibliotheken und einem Frontend mit npm-Abhängigkeiten. Eine Software Bill of Materials (SBOM) und eine dokumentierte Beschreibung der Sicherheitseigenschaften sind nicht erkennbar. Für ein Produkt mit digitalen Elementen verlangt der CRA einen dokumentierten Sicherheitsstand.

**Konkrete Abhilfe:**  
- In `DESIGN.md` einen Abschnitt „Security Properties“ ergänzen: Passwort-Hashing mit bcrypt, JWT mit maximal 15 Minuten Gültigkeit, Rate-Limit pro Client, Eigentümerprüfung auf jeder Ressource, Validierung von Bild-URL-Schemata, CORS-Whitelist.
- In der CI eine SBOM erzeugen, z. B. mit CycloneDX für Python und npm, und diese als Artefakt archivieren.
- `backend/requirements.txt` auf exakte Versionen oder Hashes pinnen; `frontend/package.json` in Verbindung mit `package-lock.json` exakt reproduzierbar halten.

---

### Befund C2 — JWT-Secret-Datei ohne restriktive Dateirechte  
**Schweregrad:** mittel  
**Datei:** `backend/app/config.py`

Das JWT-Secret wird in `.jwt_secret` geschrieben. Die Datei wird mit den Standardrechten des Prozesses/der umask erzeugt und ist möglicherweise für andere lokale Nutzer lesbar. Das gefährdet die Vertraulichkeit der Authentifizierung.

**Konkrete Abhilfe:**  
Nach dem Schreiben die Dateirechte auf `0o600` setzen:

```python
_SECRET_FILE.write_text(generated, encoding="utf-8")
os.chmod(_SECRET_FILE, 0o600)
```

Zusätzlich in der Produktionsdokumentation ausdrücklich `JWT_SECRET` als Env-Variable setzen und nicht auf die Datei verlassen.

---

### Befund C3 — Härtende Security-Header fehlen  
**Schweregrad:** mittel  
**Dateien:** `backend/app/main.py`, `frontend/index.html`

Die Anwendung setzt keine sichtbaren Security-Header wie `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` oder eine Content Security Policy. Für Security by design/default nach CRA ist das eine Lücke.

**Konkrete Abhilfe:**  
In `backend/app/main.py` eine kleine Middleware ergänzen oder über einen vorgeschalteten Proxy setzen. Mindestens:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` bzw. `frame-ancestors 'none'`
- `Referrer-Policy: no-referrer`

Für eine CSP gilt die Rekonziliationsanforderung: Das Produkt muss benutzergenerierte Bild-URLs mit `http:`/`https:` weiter anzeigen können. Deshalb darf eine CSP nicht `img-src 'self'` erzwingen, sondern benötigt:

```
img-src https: http:;
script-src 'self';
style-src 'self';
font-src 'self';
object-src 'none';
base-uri 'self';
connect-src 'self' https://<api-origin>;
```

Damit bleiben die Bild-URL-Funktionen funktionsfähig, während unsichere Protokolle wie `javascript:` oder `data:` blockiert bleiben.

---

### Befund C4 — Update-/Patchfähigkeit und Supportkanal nicht dokumentiert  
**Schweregrad:** niedrig  
**Dateien:** `README.md`, `DESIGN.md`, `IMPLEMENTATION`-Dokumentation

Der CRA verlangt bei Produkten mit digitalen Elementen eine klare Beschreibung, wie Sicherheitsupdates bereitgestellt werden und wie Sicherheitsprobleme gemeldet werden können. Dies ist aus dem sichtbaren Stand nicht ersichtlich.

**Konkrete Abhilfe:**  
In `README.md` ergänzen: Release-/Updateprozess, Kontakt für Sicherheitsmeldungen (z. B. `security@vestiaire.example`) und ein Hinweis, dass die Anwendung zentral aktualisiert wird.

---

## 3. EU AI Act

Der sichtbare Code enthält keine KI-Funktion, kein maschinelles Lernen, keine automatisierte Entscheidungsfindung und keine generative Komponente. Daher bestehen keine AI-Act-Pflichten. Sollte später eine KI-Komponente ergänzt werden, muss die Risikoklasse geprüft und gegebenenfalls eine Transparenz-/Kennzeichnungspflicht umgesetzt werden.

---

## 4. Pflichttexte und UI

### Befund T1 — Impressum und Datenschutzerklärung vorhanden, aber Datenschutzerklärung unvollständig  
**Schweregrad:** mittel  
**Datei:** `frontend/src/pages/PrivacyPage.tsx`

Impressum (`ImpressumPage.tsx`) und Datenschutzerklärung (`PrivacyPage.tsx`) sind vorhanden und von jeder Seite über Navbar und Footer verlinkt. Die Datenschutzerklärung nennt Verantwortlichen, Datenkategorien, Rechtsgrundlagen, Speicherdauer und Betroffenenrechte. Sie verfehlt jedoch die oben genannten Punkte zu IP-Adressen, Bild-URL-Datenflüssen und localStorage.

**Konkrete Abhilfe:**  
Die unter G1, G5 und G6 genannten Ergänzungen in `PrivacyPage.tsx` einarbeiten. Standdatum nach der Änderung aktualisieren.

---

### Befund T2 — Kein Consent-Banner erforderlich; Rückbau muss aber beachtet werden  
**Schweregrad:** niedrig  
**Dateien:** `frontend/index.html`, `frontend/src/App.tsx`

Aktuell lädt die Anwendung keine einwilligungspflichtigen Drittanbieter-Schriften, -Skripte oder Trackingsysteme. Die einzige technisch erforderliche Speicherung ist das JWT im `localStorage`. Ein Consent-Banner ist daher derzeit nicht erforderlich.

**Konkrete Abhilfe:**  
Sobald ein Drittanbieterdienst oder nicht-technisch erforderliche Speicherung eingeführt wird, muss vor dem Laden eine Einwilligungsabfrage mit Opt-in, Dokumentation und Widerrufsmöglichkeit ergänzt werden. Dieser Zustand ist im Code derzeit nicht verletzt.

---

### Befund T3 — Registrierungsformular ohne unmittelbaren Datenschutzhinweis  
**Schweregrad:** niedrig  
**Datei:** `frontend/src/pages/RegisterPage.tsx`

Impression und Datenschutz sind über Navigation und Footer erreichbar. Direkt am Formular fehlt jedoch der übliche Hinweis „Mit der Registrierung stimmst du der Verarbeitung gemäß Datenschutzerklärung zu“ bzw. ein klarer Link in der Nähe des Absende-Buttons.

**Konkrete Abhilfe:**  
In `RegisterPage.tsx` vor dem Submit-Button ergänzen:

> Mit der Registrierung bestätigst du, dass du die <Link to="/datenschutz">Datenschutzerklärung</Link> gelesen hast.

Dabei handelt es sich nicht um eine Einwilligung in einwilligungspflichtige Verarbeitung, sondern um eine Transparenzmaßnahme; die Vertragserfüllung bleibt Rechtsgrundlage.

---

## 5. Barrierefreiheit

### Befund A1 — Filterzustand in der Garderobe nicht programmatisch erkennbar  
**Schweregrad:** mittel  
**Datei:** `frontend/src/pages/WardrobePage.tsx`

Die Filterbuttons „Alle“, „Oberteile“, „Unterteile“ usw. signalisieren den aktiven Zustand nur über die CSS-Klasse `filter-badge active`. Screenreader können nicht erkennen, welcher Filter gerade aktiv ist.

**Konkrete Abhilfe:**  
Für jeden Filterbutton `aria-pressed` setzen, z. B.:

```tsx
aria-pressed={categoryFilter === null}  // für „Alle“
aria-pressed={categoryFilter === k}     // für Kategorien
```

Alternativ `aria-current="true"` verwenden.

---

### Befund A2 — Modals ohne Fokusmanagement und Tastaturbedienung  
**Schweregrad:** mittel  
**Dateien:** `frontend/src/pages/OutfitsPage.tsx`, `frontend/src/pages/AccountPage.tsx`

Die Dialoge besitzen `role="dialog"` und `aria-modal`, aber es fehlt:

- Initialer Fokus auf das Dialogfeld oder den ersten fokussierbaren Inhalt
- Fokusfalle innerhalb des Dialogs
- Schließen mit `Escape`
- Rückgabe des Fokus an den auslösenden Button nach dem Schließen

**Konkrete Abhilfe:**  
In beiden Komponenten einen `ref` auf das Dialogelement setzen und in einem `useEffect` beim Öffnen den Fokus setzen. Einen `onKeyDown`-Handler für `Escape` ergänzen und die Fokusreihenfolge beim Schließen wiederherstellen. Falls möglich, eine erprobte Dialogkomponente mit Fokusfalle verwenden.

---

### Befund A3 — `window.confirm` für das Löschen von Kleidungsstücken  
**Schweregrad:** niedrig  
**Datei:** `frontend/src/pages/WardrobePage.tsx`

Die Löschbestätigung verwendet `window.confirm`. Native Browserdialoge sind in der Praxis nur eingeschränkt zugänglich und verhindern eine konsistente Tastatursteuerung.

**Konkrete Abhilfe:**  
Auch hier ein eigenes Dialogfeld wie in `AccountPage.tsx` verwenden, mit den unter A2 genannten Eigenschaften.

---

### Befund A4 — Farbkontraste nicht dokumentiert  
**Schweregrad:** niedrig  
**Dateien:** `frontend/src/styles/global.css`, `frontend/src/styles/outfits.css`, `frontend/src/pages/WardrobePage.css`

Die Farbpalette enthält dunkle Hintergründe und die helle Akzentfarbe `--color-accent: #d4af37`. Für Text auf dunklen Flächen sind ausreichende Kontraste nicht offensichtlich. Eine vollständige WCAG/BITV-Bewertung ist aus dem Code allein nicht möglich.

**Konkrete Abhilfe:**  
Die finale Produktionspalette mit einem automatisierten Kontrasttest (z. B. Lighthouse, Accessibility Insights) prüfen und die Ergebnisse in `UIREVIEW.md` oder `README.md` dokumentieren. Auffällig sind insbesondere `--color-danger: #c94f4f` auf `--color-bg: #0e0b10` sowie `--color-accent: #d4af37` auf `--color-bg`.

---

## 6. Bemerkungen zu positiv bewerteten Punkten

- Token-Lebensdauer ist auf 15 Minuten begrenzt (`backend/app/security.py`).
- Passwörter werden ausschließlich als bcrypt-Hash gespeichert (`backend/app/security.py`).
- Rate-Limiting für Login und Registrierung ist vorhanden (`backend/app/routers/auth.py`).
- Eigentümerprüfungen sind bei allen Garderoben- und Outfit-Operationen umgesetzt (`backend/app/routers/items.py`, `backend/app/routers/outfits.py`).
- Bild-URL-Schemata werden serverseitig auf `http://` und `https://` eingeschränkt (`backend/app/routers/items.py`).
- Impressum und Datenschutzerklärung sind verlinkt und grundsätzlich vorhanden.
- CORS-Origin ist explizit konfiguriert (`backend/app/main.py`).
- Die Konto-Löschung entfernt Benutzer, Kleidungsstücke und Outfits dauerhaft (`backend/app/routers/users.py`).

---

## Fazit

Es bestehen keine fundamentalen Rechtsverstöße, die eine sofortige Blockierung erfordern. Die genannten Punkte betreffen überwiegend Transparenzpflichten, Datenminimierung, technische Umsetzung von Betroffenenrechten, CRA-Dokumentationspflichten und Barrierefreiheitslücken. Diese sind mit klar benannten Änderungen behebbar. Daher: `CHANGES_REQUESTED`.