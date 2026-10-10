# Own-shops consistency tool — decisions (2026-10-09)

Status: agreed, not built yet. Work starts in a new session.

## Shops and channels

| Shop | Channels | Rule |
|---|---|---|
| TwoGuys Home (restaurant / pick-up) | Burgerbrasov.ro, Mypassage.ro | same products and same prices everywhere (to confirm with colleagues) |
| TwoGuys Delivery | Glovo, Wolt, Bolt | same products and same list prices on all three |
| TheSmash Delivery | Glovo, Wolt, Bolt | same products and same list prices on all three |
| Smash Home | (not built yet) | separate menu and prices, will be added later |

Delivery prices are intentionally higher than home/pick-up prices (platform commission). Never compare delivery vs home.

## Price policy

- Source of truth: the master tabs (`TwoGuys Delivery`, `Smash Delivery`, `TwoGuys Home`), **self-maintaining**: a product seen on any platform but absent from the master is added automatically as "NEW – confirm price" and reported as missing on the other platforms until it is listed everywhere.
- Compare **list prices**, never promo prices (platform promos such as Glovo -25% are intentional).
- **Exact match**, no tolerance.
- Drinks: Bolt list price excludes the 0.50 RON SGR deposit, so the **total** paid must match across platforms (keep the existing SGR rule, confirm after switching Bolt to the API which now returns list prices).

## Checks wanted

1. Price differs between platforms of the same shop.
2. Product listed on one platform but missing on another.
3. Product **out of stock on one platform but active on the others** (Bolt has stock status; check Wolt and Glovo).
4. Near-identical names across platforms (typos, e.g. "Pepsi Max Dza 330ml").
5. Per-product status line in the report: `Glovo ✓ 76 · Wolt ✓ 76 · Bolt ✗`.

## Notifications

- Daily email at 13:00 stays (already triggered: `ownShopsReport`).
- Telegram set up 2026-10-10: bot TwoGuyss_bot, group "TwoGuys Alerte", token in Script properties (TELEGRAM_TOKEN), chat id in Settings. Own-shops issues go to Telegram at 13:00; daily competitor summary optional (Settings → telegram_daily). WhatsApp rejected: needs Business API, templates, per-message cost.
- Possible hourly own-shops check during opening hours (7 small fetches; Bolt rate limit OK).
