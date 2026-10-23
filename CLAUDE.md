# TwoGuys competition tracker

Google Sheet + Google Apps Script (V8) that tracks our own shops and competitors on Glovo / Wolt / Bolt / own sites.
Daily competitor email, own-shops consistency report, CompMap price comparison. UI text and emails are Romanian.

## How code reaches the sheet
- The `.gs.txt` files here are the source of truth. The user copy-pastes each changed file into the Apps Script editor
  (file `Code` ← `Code.gs.txt`, etc., replacing the whole content). There is no clasp / automatic deploy.
- After every change: run `node tools/check.js` (syntax of each file + all files joined in one scope; catches a top-level
  `const` declared in two files). Then tell the user which files to paste, as links, and which functions to run and in which file.
- Top-level code runs on every execution; `Code.gs` merges the Competitors tab into `COMPETITORS` at load (in try/catch).
  `const` at top level of a file is not visible before its declaration runs: keep shared constants in `Code.gs` above first use.
- Files: Code (config, COMPETITORS, registry, dailyCheck, buildMatrix, platform readers), Sources (site readers, Bolt API),
  Matching (CompMap fuzzy/AI fill), OwnShops (own-shops report + master tabs), Email (daily/weekly emails), Listings
  (Listings tab, hide/order tabs, annotateCompMap), Highlight (colours, guide tab, tab notes), Guard (access control + the
  Acces menu in onOpen), Style (MASTER Twoguys), Telegram.

## Conventions
- Match the surrounding style: terse comments, `const`/arrow functions, Romanian user-facing strings.
- Highlight.gs uses `var` on purpose (tolerates a duplicate file in the project).
- Never overwrite hand-edited cells: master tabs A:B, CompMap cells, Settings column B, Competitors A:F.
- Tabs named `<Brand> - G|W|B|Site` are raw data written by the script; `Listings` is a derived view.
- New competitor = a row in the Competitors tab, not an edit of `COMPETITORS` (that list holds the legacy/own entries).
- Notes for the user: always name the file that holds each function to run; link every file they must paste.

## Sheet knowledge
- Triggers: dailyCheck 10:00, middayRefresh 12:00 (Bolt), ownShopsReport 13:00, weekly digests Monday 08:00 / 09:00.
- History tab = one row per item per day (used for discount days); `_Snapshot` = yesterday's state; `_Removed` = delisted
  competitor items kept 60 days.
- Tab-by-tab description: `docs/manual-tabs.md`. Own-shops rules: `docs/own-shops-consistency.md`.
- Git: commit only when asked; end commit messages with the Co-Authored-By line from the session reminder.
