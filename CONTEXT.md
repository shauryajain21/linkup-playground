# Linkup Labs Playground — Build Context

This document captures the full design and development context from the conversation that built this project.

## What is this?

An interactive playground/demo tool for the **Linkup API** — a web search API built for AI systems. It lets users (and customers) try Linkup's Search and Fetch endpoints with beautifully formatted results.

**Live:** https://linkup-playground-production.up.railway.app
**Admin:** https://linkup-playground-production.up.railway.app/admin.html
**Repo:** https://github.com/shauryajain21/linkup-playground

---

## Architecture

Single-page static app — no backend, no database. Everything is HTML + CSS + JS in one file.

- `index.html` — The playground itself (split-panel UI)
- `admin.html` — Back office to create branded demo links for customers
- `Dockerfile` + `nginx.conf` — Railway deployment (nginx serving static files with dynamic PORT)
- `vercel.json` — Vercel deployment option

### How the admin/config system works

Configs (customer logo, API key, pre-built queries) are **base64-encoded into the URL** as a `?c=` parameter. No database needed — everything travels with the link. Admin panel generates these links, and `index.html` reads and applies the config on load.

---

## Design Decisions

### Theme & Inspiration
- Inspired by **linkup.so** website (screenshots from their pricing page, enterprise section, homepage)
- Clean, minimal aesthetic: white left panel, **dark terminal-style right panel** (#0D0D0D)
- **Linkup brand blue** (#0052CC) as accent
- **Inter** for UI, **JetBrains Mono** for code/terminal elements
- Blue accent line under the nav (matches linkup.so)
- Earth-tone mosaic art in depth cards (matching the abstract grid art on linkup.so)

### Layout Evolution
1. Started as single-page with hero + product cards + tabbed content
2. Evolved to **split-panel layout** (50/50): left = input, right = output
3. Dark right panel with syntax-colored output gives a "terminal" feel
4. Placeholder with wireframe globe SVG when no results yet

### Output Formatting
- **One Dark theme** inspired syntax colors for answers:
  - H1: sky blue (#7DD3FC), H2: violet (#C4B5FD), H3: gold (#FCD34D)
  - Body: light gray (#D1D5DB), bold: gold, italic: pink, links: cyan
  - List markers: mint green (#6EE7B7)
- **Numbered items** (like `1. Title: ...`) render as styled cards with blue left border and key:value highlighting
- **Sources** capped at top 5, shown as numbered list with title + domain
- **JSON output** uses VS Code dark syntax highlighting
- **Searching animation**: three orbital rings (cyan/violet/gold) with live timer

### Linkup API Integration
- **Search**: `POST https://api.linkup.so/v1/search` with `{q, depth, outputType, ...}`
- **Fetch**: `POST https://api.linkup.so/v1/fetch` with `{url, renderJs}`
- Three depth modes: **Fast** ($0.001, <1s), **Standard** ($0.005, 1-3s), **Deep** ($0.05, 5-30s)
- Three output types: `searchResults`, `sourcedAnswer`, `structured`
- API key stored in localStorage, or pre-filled via admin config
- Error handling extracts `e.message`, `e.error.message`, `e.detail` with fallbacks

### Admin / Back Office Features
- Set customer **company name** and **logo URL** (shown alongside Linkup logo in nav)
- Pre-fill **API key** for the customer
- Create **pre-built queries** with:
  - **Title** (shown as primary label in chips)
  - **Query body** (the actual search query)
  - **Depth** per query (Fast/Standard/Deep)
  - **{placeholder}** support — detected automatically, shows amber fill form
- Set **default depth** and **output type**
- **Generate shareable link** — base64-encoded config in URL
- **Save configs locally** (localStorage) for managing multiple customers

### Customer Experience (via admin-generated link)
1. Open link → see both logos (Linkup + customer) in nav, title says "CustomerName x Linkup"
2. Pre-built queries appear as prominent chips with titles in a labeled section ("Optimized queries for CustomerName")
3. **First query auto-runs on page load** (results appear immediately)
4. If first query has `{placeholders}` → fill form appears immediately asking customer to fill in
5. Clicking any query chip **auto-runs the search** (no need to click Run Search)
6. Queries with placeholders show fill form → "Apply & run search" button auto-executes
7. API key is pre-filled — customer doesn't need one

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main playground (~750 lines, self-contained HTML+CSS+JS) |
| `admin.html` | Back office for creating branded demo links |
| `Dockerfile` | nginx:alpine container for Railway deployment |
| `nginx.conf` | nginx template with dynamic $PORT for Railway |
| `vercel.json` | Alternative Vercel deployment config |

---

## Deployment

### Railway (current)
```bash
railway up --detach
```
Uses Dockerfile → nginx:alpine serving static files on dynamic PORT.

### Vercel (alternative)
Just push — `vercel.json` handles static routing.

### Local
```bash
open index.html
```
Works directly in browser (client-side only).

---

## Key Technical Details

- **Markdown renderer**: Custom ~60 line parser handling headings, lists, bold/italic, links, code blocks, and numbered item cards
- **Mosaic art**: Procedurally generated 4x3 CSS grids with earth-tone palettes and intentional white accent squares
- **Wireframe globe**: Inline SVG with ellipses and lines mimicking the linkup.so globe graphic
- **Logo**: Real Linkup SVG wordmark extracted from `/Users/shaurya/Newsletter-Content-Linkup/assets/`
- **No external dependencies** besides Google Fonts (Inter + JetBrains Mono)
- **Config encoding**: `btoa(unescape(encodeURIComponent(JSON.stringify(config))))` for Unicode-safe base64
