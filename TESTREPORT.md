VERDICT: BUGS_FOUND

Kurzer Hinweis: Die beigefügten Screenshots kann ich nicht sehen; ich beurteile anhand des Text-Reports.

- **Title:** Authentifizierte Garderoben-/Outfit-Abrufe scheitern nach erfolgreicher Anmeldung mit HTTP 401
- **Symptom:** Nach erfolgreicher Registrierung/Anmeldung (Sitzung laut Harness etabliert) laden die Seiten `/outfits` und `/outfits/neu` ihre eigenen Daten nicht. Stattdessen antwortet die eigene API mit 401, sodass der angemeldete Benutzer nur Leerzustände statt seiner Garderobe/Outfits sieht. Damit funktionieren AC-02, AC-03 und AC-04 in der realen Browser-Anwendung nicht, obwohl die Backend-Unit-Tests grün sind.
- **Repro:** Browser-Smoke/Playwright: Registrieren bzw. Anmelden, dann zu `/outfits` bzw. `/outfits/neu` navigieren. Die Seiten rufen `GET /api/outfits` bzw. `GET /api/wardrobe/items` auf.
- **Evidence:**
  - `[net-fail] GET /api/outfits -> 401 (from http://localhost:5173/outfits)`
  - `[net-fail] GET /api/wardrobe/items -> 401 (from http://localhost:5173/outfits/neu)`
  - `[account-probe] summary: credential form found, session established`
  - `[route-probe auth] /outfits -> /outfits dom=f56ffd7c/1567 heading="Outfits" text="... Outfits Deine gespeicherten Looks Neues Outfit Noch keine"`
- **Suspected file(s):** Zwei unabhängige Endpunkte antworten identisch mit 401, daher liegt die Ursache nicht in den einzelnen Routern, sondern im gemeinsamen Anfrage-/Token-Pfad. Verdächtig: `frontend/src/api/client.ts` (Authorization-Header wird nicht bzw. mit ungültigem Token zusammengebaut) und ggf. `frontend/src/auth/AuthContext.tsx` (Token-Speicherung/Sitzungsübergabe nach Login).
- **Severity:** high