# Which tabs are edited by hand

## You edit
- **Settings** — column B (Valoare) only. Recipients, Telegram, thresholds, scheduled items/tabs/categories, muted/priority tabs.
- **Master tabs**: `TwoGuys Delivery`, `Smash Delivery`, `TwoGuys Home`, `Breakfast`
  - **A – Produs**: reference name every platform should use → change here when you rename a product.
  - **B – Preț**: reference price every platform should have → change here when you change a price.
  - **C… – one column per platform**: the exact name on that platform. Filled/followed by the script; you correct it, put `-` when a product is intentionally not sold there, remove `≈` after checking an AI match.
  - New product: add a row (A, B; platform names optional). Script never deletes rows.
- **CompMap** (competitor equivalents for the weekly digest): AI-filled, reviewed by hand like the master tabs.

## Script-owned — do not edit
Platform tabs (`… - G/W/B`, `Mypassage`, `Burgerbrasov`, …), `_Snapshot`, `_Removed`, `Reports`, `History`, `RunLog`, `Meta`, `Map`, `Channels`, `MatchMatrix`.

## When something changes in the business
| Event | What to do |
|---|---|
| New product on the platforms | add a row in the right master tab (A + B); next 13:00 report shows where it is still missing |
| Price change | update column B in the master tab, then the platforms; report flags any platform still on the old price |
| Product renamed | update column A; platforms that still use the old name show "nume: …" |
| Product dropped on purpose from one platform | put `-` in that platform's cell |
| Product with a day/hour schedule | add it to `scheduled_items` (or its category to `scheduled_categories`) in Settings |
| New venue/tab | add it to `COMPETITORS` in Code.gs (and `OWN_CHANNELS` / `OWN_REPORTS` if ours), then run `syncMasterColumns` |

## Access control (Settings E:I, Guard.gs)
- Table in **Settings, columns E:I**: Email | Tab | Coloane | Mod | Culoare. `Mod`: `admin` (anything), empty/`gol` (fill empty cells only), `complet` (may also change filled cells). One tab per row.
- Tabs with no row for a user are admin-only. Row 1 of every tab is admin-only.
- After editing the table: menu **Acces → Aplica accesul** (or run `applyAccess()`). It sets the real protections and invites the emails as editors.
- Users cannot insert/delete rows or columns (admin only). If a script writes into a tab that has user rows: **Acces → Reimprospateaza snapshot-urile**.
- Users with file access can still *see* every tab, including Settings; only editing is restricted.
- Hiding tabs is global, not per user (Google has no per-user tab visibility): **Acces → Ascunde taburile de admin** hides every tab no user row grants; **Acces → Arata toate taburile** brings them back. Cosmetic only, not a secret.

## Market comparison tabs (2026-10-18)
- **CompMap** = one column per *competitor* tab only (our own shops are never in it). New competitor tab in `COMPETITORS` → run `prefillCompMapNew`, optionally `llmFillCompMapNew`, then `buildMatrix`.
- `~` = fuzzy suggestion, `≈` = AI suggestion: remove the marker after checking. MatchMatrix only shows a price for names without a marker.
- **Burgerbrasov** has columns A–B only; **Mypassage** A–E only (no Disc % column).
- **CompMap column A** = all our products: Burgerbrasov tab + masters in `COMPMAP_OWN_SOURCES` (TwoGuys Home, TwoGuys Delivery, Smash Delivery; add `Breakfast` there if wanted). `syncCompMapProducts` adds missing ones (never deletes/edits), then `prefillCompMap`, optionally `llmFillCompMap` (re-run until the log shows no tabs left), then `buildMatrix`. MatchMatrix "Pret" = site price, else master reference price.
- Sources of CompMap column A are listed in `COMPMAP_OWN_SOURCES` (Matching.gs): Burgerbrasov, **MASTER Twoguys** (rows "Produs din lista", price column C), TwoGuys Home, TwoGuys Delivery, Smash Delivery (never merged into TwoGuys products). Spelling variants of the same product ("Two Guys" / "Two Guys Burger") are folded into one row. `compMapStatus` (read-only) shows which steps are still to do.
- `llmFillCompMap` works in batches of 80 products per AI call and writes `-` where the AI finds no equivalent (so it is not asked again). Run it repeatedly until `compMapStatus` shows no "still empty" cells (or the log has no "not done yet" line); each run picks up where the last stopped.
