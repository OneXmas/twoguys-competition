# Which tabs are edited by hand

## You edit
- **Settings** — column B (Valoare) only. Recipients, Telegram, thresholds, scheduled items/tabs/categories, muted/priority tabs.
- **Master tabs**: `TwoGuys Delivery`, `Smash Delivery`, `TwoGuys Home`, `Breakfast`
  - **A – Produs**: reference name every platform should use → change here when you rename a product.
  - **B – Preț**: reference price every platform should have → change here when you change a price.
  - **C… – one column per platform**: the exact name on that platform. Filled/followed by the script; you correct it, put `-` when a product is intentionally not sold there, remove `≈` after checking an AI match.
  - New product: add a row (A, B; platform names optional). Script never deletes rows.
- **CompMap** (competitor equivalents for the weekly digest): AI-filled, reviewed by hand like the master tabs. Marked cells are coloured by `annotateCompMap` (green = probably right: delete only the `~`/`≈`; amber = check; red = probably wrong: clear the cell or write `-`). Hover a cell for the reason. Red from a big price gap alone does not mean wrong: judge by the product.
- **Competitors** — one row per brand: Glovo / Wolt / Bolt links, website, Activ checkbox. Orange rows = our own shops (cannot be switched off here), light green = competitors. Column G (Status) is written by the script; the steps for a new competitor are written to the right (I:J).

## Script-owned — do not edit
Platform tabs (`… - G/W/B/Site`, `Mypassage`, `Burgerbrasov`, …; hidden by default, **Acces → Ascunde taburile de date**), **`Listings`** (every item of every shop in one filterable tab, rebuilt after each `dailyCheck`), `_Snapshot`, `_Removed`, `Reports`, `History`, `RunLog`, `Meta`, `Map`, `Channels`, `MatchMatrix`.

Every tab has a note on cell A1 saying what it is, which function writes it, what you do in it and what to run after a change (**Acces → Adauga notite pe taburi** / `addTabNotes`).

## When something changes in the business
| Event | What to do |
|---|---|
| New product on the platforms | add a row in the right master tab (A + B); next 13:00 report shows where it is still missing |
| Price change | update column B in the master tab, then the platforms; report flags any platform still on the old price |
| Product renamed | update column A; platforms that still use the old name show "nume: …" |
| Product dropped on purpose from one platform | put `-` in that platform's cell |
| Product with a day/hour schedule | add it to `scheduled_items` (or its category to `scheduled_categories`) in Settings |
| New competitor | add a row in **Competitors** (brand, store links, tick Activ), then **Acces → Completeaza lista Competitors**. The tab, CompMap column and MatchMatrix are created automatically; review the coloured CompMap cells. First day is a baseline (no alerts). Steps are also written in Competitors I:J |
| New venue of ours | needs code: add it to `OWN_CHANNELS` and `OWN_REPORTS` (OwnShops.gs), create/extend a master tab, then run `syncMasterColumns`; list it in Competitors for the overview |
| Stop tracking a competitor | untick Activ in Competitors (its tabs stay) |

## Access control (Settings E:I, Guard.gs)
- Table in **Settings, columns E:I**: Email | Tab | Coloane | Mod | Culoare. `Mod`: `admin` (anything), empty/`gol` (fill empty cells only), `complet` (may also change filled cells). One tab per row.
- Tabs with no row for a user are admin-only. Row 1 of every tab is admin-only.
- After editing the table: menu **Acces → Aplica accesul** (or run `applyAccess()`). It sets the real protections and invites the emails as editors.
- Users cannot insert/delete rows or columns (admin only). If a script writes into a tab that has user rows: **Acces → Reimprospateaza snapshot-urile**.
- Users with file access can still *see* every tab, including Settings; only editing is restricted.
- Hiding tabs is global, not per user (Google has no per-user tab visibility): **Acces → Ascunde taburile de admin** hides every tab no user row grants; **Acces → Arata toate taburile** brings them back. Cosmetic only, not a secret.

## Market comparison tabs (2026-10-18)
- **CompMap** = one column per *competitor* tab only (our own shops are never in it). A new competitor added in the Competitors tab gets its column automatically (`prefillCompMapNew` + `annotateCompMap` + `buildMatrix` run from `syncCompetitors`); optionally run `llmFillCompMap` for the cells the fuzzy match left empty, then **Acces → Marcheaza CompMap** and `buildMatrix` after your review.
- `~` = fuzzy suggestion, `≈` = AI suggestion: remove the marker after checking. MatchMatrix only shows a price for names without a marker.
- **Platform and website data tabs** (`- G`, `- W`, `- B`, Burgerbrasov, Mypassage, competitor sites) all have the same columns, written by the script: A Item | B Original price (before discount) | C Price (what the client pays) | D Discount % | E Category | F Stoc | G ID. Wolt and Bolt prices include the cheapest choice of every required option (the can in a combo), as the app shows them; the Wolt discount comes from the venue campaign. Only Buffaloeat and Egg&Smash (IMPORTXML) keep their own layout.
- **CompMap column A** = all our products: Burgerbrasov tab + masters in `COMPMAP_OWN_SOURCES` (TwoGuys Home, TwoGuys Delivery, Smash Delivery; add `Breakfast` there if wanted). `syncCompMapProducts` adds missing ones (never deletes/edits), then `prefillCompMap`, optionally `llmFillCompMap` (re-run until the log shows no tabs left), then `buildMatrix`. MatchMatrix "Pret" = site price, else master reference price.
- Sources of CompMap column A are listed in `COMPMAP_OWN_SOURCES` (Matching.gs): Burgerbrasov, **MASTER Twoguys** (rows "Produs din lista", price column C), TwoGuys Home, TwoGuys Delivery, Smash Delivery (never merged into TwoGuys products). Spelling variants of the same product ("Two Guys" / "Two Guys Burger") are folded into one row. `compMapStatus` (read-only) shows which steps are still to do.
- `llmFillCompMap` works in batches of 80 products per AI call and writes `-` where the AI finds no equivalent (so it is not asked again). Run it repeatedly until `compMapStatus` shows no "still empty" cells (or the log has no "not done yet" line); each run picks up where the last stopped.

## Own-shops report (OwnShops.gs, daily 13:00)
- A row appears only for a price difference, a name difference, a missing product (X) or a product sold out on one platform and orderable on another. Scheduled products (breakfast, weekend-only) leave an empty cell and never trigger a row.
- Discounts on a listed row show the percentage and how many days it has run (`−10% · 5 zile`, from the `History` tab; `30+ zile` = at least that long, History holds about a month).
- Venues that share a platform are labelled by venue in the header, e.g. `Wolt (Passage by TwoGuys)`.

## Helper tabs
- `_Snapshot`: yesterday's state, compared with today by `dailyCheck`. `_Removed`: competitor products that left a menu, kept 60 days so a comeback is reported as RETURNED. `_snap_*` / `_orig_*`: used by the access guard (Guard.gs); `_orig_*` stays empty until a limited user edits a cell.
