# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Dunkle Red-Carpet-Ästhetik mit tiefem Samtschwarz, warmem Gold-Akzent und filmplakathafter Serifen-Typografie – glamourös, aber klar und ruhig wie eine Premium-App.

## Colors

- `--color-bg`: **#0E0B10**
- `--color-surface`: **#17121A**
- `--color-surface_raised`: **#201A24**
- `--color-fg`: **#F5EDE4**
- `--color-muted`: **#A697A8**
- `--color-border`: **#3A2E3C**
- `--color-accent`: **#D4AF37**
- `--color-accent_hover`: **#E6C65C**
- `--color-accent_active`: **#C9A227**
- `--color-on_accent`: **#17121A**
- `--color-danger`: **#C94F4F**
- `--color-success`: **#4F9D6B**
- `--color-overlay`: **rgba(14, 11, 16, 0.72)**

## Typography

- `font_family`: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
- `heading_font_family`: 'Georgia', 'Cambria', 'Times New Roman', serif
- `heading_weight`: 600
- `body_weight`: 400
- `size_scale`: xs: 12px; sm: 14px; md: 16px; lg: 20px; xl: 28px; xxl: 36px

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px
- `--space-7`: 64px

## Border-Radii

- `--radius-sm`: 6px
- `--radius-md`: 10px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button

Primär: min-height 44px, padding 12px 24px, radius pill, bg=accent, text=on_accent, font-weight 600, font-size 16px; hover=accent_hover; active=accent_active; disabled=opacity 0.45 + cursor not-allowed. Sekundär: bg=transparent, border 1px solid border, text=fg, hover=surface_raised, active=surface. Gefahren-Button: bg=transparent, border 1px solid danger, text=danger, hover=danger bei 12% Deckkraft.

### Card

bg=surface, border 1px solid border, radius lg (16px), padding 16px, Schatten 0 8px 24px rgba(0,0,0,0.35); bei Hover border=accent und leichte Anhebung (transform translateY(-2px)) nur wenn klickbar.

### Input

bg=surface_raised, border 1px solid border, radius md (10px), padding 12px 14px, min-height 44px, color=fg, font-size 16px, placeholder=muted; focus=border-accent + 2px Ring rgba(212,175,55,0.25); invalid=border-danger + Hinweistext danger.

### FormField

Label oberhalb, font-size 14px, color=fg, margin-bottom 8px; Hilfetext und Fehlertext font-size 12px, color=muted bzw. danger, margin-top 6px.

### Topbar

Höhe 64px, bg=bg mit 90% Deckkraft + backdrop-blur 8px, border-bottom 1px solid border; links Markenwort 'Vestiaire' in heading_font_family, rechts Nav-Links und Avatar; sticky top, z-index 20.

### Badge

Kategorie-Tag: padding 4px 10px, radius pill, bg=surface_raised, border 1px solid border, color=muted, font-size 12px; aktiv/gewählt: bg=accent, text=on_accent, border=accent.

### ImagePreview

Container mit aspect-ratio 3/4, bg=surface_raised, border 1px solid border, radius md; Bild object-fit=cover, width 100%, height 100%; Fehler-/Leerzustand zeigt zentriertes Kleiderbügel-Icon in muted auf surface_raised.

### OutfitTile

Vorschaukachel 160px breit, radius md, bg=surface, border 1px solid border; inneres 2x2-Raster mit je 50% Breite/Höhe, Bilder object-fit=cover, 1px Gap in bg; darunter Outfit-Name font-size 14px, abgeschnitten mit Ellipsis; Kachel klickbar mit hover border=accent.

### Modal

Overlay bg=overlay, zentriert, padding 24px; Dialog bg=surface, border 1px solid border, radius lg, max-width 480px, padding 24px; Titel in heading_font_family, font-size 20px; Schließen-Button als Icon-Button 44x44px oben rechts.

### EmptyState

Zentrierter Block, padding 48px 24px, border 1px dashed border, radius lg; Icon 32px in muted, Überschrift font-size 18px in fg, Beschreibung font-size 14px in muted, primärer Button darunter.

### FilterBar

Horizontale, auf mobilen Geräten umbrechende Reihe aus Badges, Abstand 8px, padding 8px 0 16px 0; Sticky unter Topbar optional.

## Layout Principles

- Inhalts-Container max-width 1120px, zentriert, horizontales Seiten-Padding 16px auf mobil, 24px ab 900px.
- Breakpoints: 640px (Mobil), 900px (Tablet), 1200px (Desktop); Navigation kollabiert unter 640px auf ein Menü.
- Garderoben-Grid: 2 Spalten mobil, 3 Spalten ab 900px, 4 Spalten ab 1200px; Gap 16px.
- Outfit-Creator zweispaltig ab 900px: links Auswahl/Filter (320–380px), rechts Vorschau/Canvas flexibel; unter 900px gestapelt.
- Vertikaler Abstand zwischen Sektionen 32px, zwischen Formularfeldern 16px.
- Dunkler Hintergrund durchgehend, Oberflächen maximal eine Ebene abheben (surface → surface_raised), Gold nur für primäre Aktionen und aktive Zustände einsetzen.
