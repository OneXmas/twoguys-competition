import puppeteer from '@cloudflare/puppeteer';

// Runs inside the page: collect every button that contains a RON price.
// First line = item name, prices = "73,00 RON" style lines (second one = original price if discounted).
function extract() {
  const out = {};
  for (const b of document.querySelectorAll('button')) {
    const t = b.innerText || ''; if (!/RON/.test(t)) continue;
    const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
    let oos = false;
    while (lines.length && /^(Popular|Populare|Recomandate|Stoc epuizat|Sold out|Indisponibil|Epuizat)$/i.test(lines[0])) {
      if (/epuizat|sold out|indisponibil/i.test(lines[0])) oos = true;
      lines.shift();
    }
    const prices = lines.filter(l => /^\d+([.,]\d+)?\s*RON$/.test(l));
    if (!prices.length || !lines[0]) continue;
    out[lines[0]] = { price: prices[0], orig: prices[1] || '', oos };
  }
  return out;
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.searchParams.get('key') !== env.API_KEY) return new Response('forbidden', { status: 403 });
    const target = u.searchParams.get('url');
    if (!target || !target.startsWith('https://food.bolt.eu/')) return new Response('bad url', { status: 400 });

    let browser;
    try {
      browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36');
      await page.setViewport({ width: 1280, height: 2000 });
      await browser.defaultBrowserContext().overridePermissions('https://food.bolt.eu', ['geolocation']);
      await page.setGeolocation({ latitude: 45.6579, longitude: 25.6012 });

      // probe mode: record the JSON the Bolt web app loads, so we can read the menu from its API instead of the screen
      const probe = !!u.searchParams.get('probe'), captured = [];
      if (probe) page.on('response', async res => {
        try {
          const url = res.url();
          if (!/bolt(svc)?\.(eu|net)$/.test(new URL(url).hostname)) return;
          if (!/json/.test(res.headers()['content-type'] || '')) return;
          const text = await res.text();
          captured.push({ url, status: res.status(), bytes: text.length, text });
        } catch (e) {}
      });

      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // dismiss the cookie banner if it shows up
      try {
        await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /Respinge tot|Reject all/i.test(b.innerText)), { timeout: 8000 });
        await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => /Respinge tot|Reject all/i.test(b.innerText)); if (b) b.click(); });
      } catch (e) {}

      // wait until at least one price is on screen
      await page.waitForFunction(() => /RON/.test(document.body.innerText), { timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      // the list only renders what's visible, so scroll down and collect as we go
      // the list only renders what's visible: wheel-scroll and collect until nothing new shows up
      // find the inner scrollable list and move it programmatically (wheel alone is unreliable here)
      const scrollList = (dy) => {
        const els = [...document.querySelectorAll('*')].filter(e => {
          const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 50;
        }).sort((a, b) => b.scrollHeight - a.scrollHeight);
        const el = els[0] || document.scrollingElement;
        if (dy === 0) el.scrollTop = 0; else el.scrollTop += dy;
        return el.scrollTop;
      };
      await page.evaluate(scrollList, 0);            // back to top
      await new Promise(r => setTimeout(r, 800));
      await page.mouse.move(640, 1000);

      const items = {};
      let stale = 0;
      for (let i = 0; i < 150 && stale < 15; i++) {
        const before = Object.keys(items).length;
        Object.assign(items, await page.evaluate(extract));
        stale = Object.keys(items).length > before ? 0 : stale + 1;
        await page.evaluate(scrollList, 500);
        await page.mouse.wheel({ deltaY: 500 });
        await new Promise(r => setTimeout(r, 600));
      }
      Object.assign(items, await page.evaluate(extract));

      if (probe) {
        const seen = Object.keys(items);
        // full bodies for menu / store responses only (menu = mentions a dish we saw on screen)
        const out = captured.map(c => {
          let keys = null; try { keys = Object.keys(JSON.parse(c.text)); } catch (e) {}
          const isMenu = seen.some(n => c.text.includes(JSON.stringify(n).slice(1, -1)));
          const keep = isMenu || /getMenu|getProvider(Details|AvailabilityStatus)/.test(c.url);
          return { url: c.url, status: c.status, bytes: c.bytes, keys, isMenu, body: keep ? c.text.slice(0, 800000) : undefined };
        });
        return new Response(JSON.stringify({ seenOnScreen: seen, responses: out }), { headers: { 'content-type': 'application/json' } });
      }
      const meta = await page.evaluate(() => {
        const t = document.body.innerText;
        const m = t.match(/\n(\d[.,]\d)\n\((\d+\+?)\)\n([\d,]+)\s*RON\nlivrare\n+([\d–-]+)\nmin/);
        return m ? { rating: parseFloat(m[1].replace(',', '.')), reviews: m[2], fee: parseFloat(m[3].replace(',', '.')), minutes: m[4] } : null;
      });
      const num = t => parseFloat(String(t).replace(/[^\d,]/g, '').replace(',', '.'));
      const rows = Object.entries(items).map(([name, v]) => ({ name, price: num(v.price), orig: v.orig ? num(v.orig) : null, oos: !!v.oos }));
      const debug = u.searchParams.get('debug') ? await page.evaluate(() => {
        const scrollers = [...document.querySelectorAll('*')].filter(e => {
          const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 50;
        }).map(e => e.tagName + ' ' + e.scrollHeight + '/' + e.clientHeight + ' top=' + e.scrollTop);
        return {
          url: location.href,
          buttons: document.querySelectorAll('button').length,
          ronButtons: [...document.querySelectorAll('button')].filter(b => /RON/.test(b.innerText)).length,
          scrollers: scrollers,
          text: document.body.innerText.slice(0, 4000)
        };
      }) : undefined;
      return new Response(JSON.stringify({ count: rows.length, items: rows, meta, debug }), { headers: { 'content-type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'content-type': 'application/json' } });
    } finally {
      if (browser) await browser.close();
    }
  }
};