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
