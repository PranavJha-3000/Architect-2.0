import React from 'react'

const shell = (body: string) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display",system-ui,sans-serif;background:#121214;color:#e4e4e7;padding:28px;-webkit-font-smoothing:antialiased}
  .wrap{transition:opacity .45s ease,transform .45s ease,filter .45s ease}
  h1{font-size:24px;font-weight:650;letter-spacing:-.02em}
  h2{font-size:15px;font-weight:600;margin-bottom:10px}
  .muted{color:#a1a1aa;font-size:13px}
  .row{display:flex;gap:8px;align-items:center}
  .card{background:#18181b;border:1px solid #2c2c32;border-radius:12px;padding:16px}
  .btn{background:#007aff;color:#fff;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:550;display:inline-block}
  .pill{display:inline-block;border:1px solid #7c3aed66;border-radius:999px;padding:4px 10px;font-size:11px;color:#a78bfa;background:#7c3aed26}
  .grid{display:grid;gap:12px}
  .bar{height:8px;background:#26262a;border-radius:999px;overflow:hidden}
  .bar>div{height:100%;background:#007aff;border-radius:999px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:11px 0;border-bottom:1px solid #2c2c32}
  .dot{width:7px;height:7px;border-radius:999px;background:#007aff;display:inline-block}
</style></head><body>${body}</body></html>`

const header = (title: string) => `<div class="row" style="justify-content:space-between;margin-bottom:22px">
    <div><h1>${title}</h1><p class="muted" style="margin-top:4px">Built with your team</p></div>
    <div class="row"><span class="pill">Live</span><span class="btn">New entry</span></div></div>`

const stat = (label: string, value: string) =>
  `<div class="card"><p class="muted">${label}</p><p style="font-size:26px;font-weight:650;margin-top:6px">${value}</p></div>`

const rows = (items: [string, string, string][]) =>
  `<table>${items.map(([a, b, c]) => `<tr><td>${a}</td><td class="muted">${b}</td><td>${c}</td></tr>`).join('')}</table>`

/** Canned app markup per template. Sections reveal as build tasks complete. */
export const buildDoc = (templateId: string, revealed: number, title: string): string => {
  const pct = Math.max(0, Math.min(100, revealed))
  const section = (i: number, html: string) =>
    pct >= i
      ? `<div style="opacity:1;transform:none">${html}</div>`
      : `<div style="opacity:.22;filter:blur(2px);transform:translateY(4px)">${html}</div>`
  const grid3 = (a: string, b: string, c: string) =>
    `<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">${stat(a, b)}${stat('Invoices', c)}${stat('Files', '23')}</div>`


  if (templateId === 'streaks') {
    return shell(header(title)
      + section(12, `<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">${stat('Current streak', '18 days')}${stat('Best streak', '41 days')}${stat('Completion', '86%')}</div>`)
      + section(40, `<div class="card" style="margin-bottom:18px"><h2>This week</h2>
        <div class="row" style="gap:6px;margin-top:14px">
        ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => `<div style="flex:1;text-align:center">
          <div style="height:44px;border-radius:6px;background:${[1, 1, 0, 1, 1, 0, 0][i] ? '#007aff' : '#26262a'}"></div>
          <p class="muted" style="margin-top:6px;font-size:10px">${d}</p></div>`).join('')}
        </div></div>`)
      + section(70, `<div class="card"><h2>Recent</h2>${rows([
        ['Morning run', 'Today', '<span class="dot"></span>'],
        ['Read 20 pages', 'Yesterday', '<span class="dot"></span>'],
        ['No screens after 10pm', 'Yesterday', '<span class="dot"></span>'],
        ['Stretch', '2 days ago', '<span class="dot"></span>'],
      ])}</div>`))
  }

  if (templateId === 'portal') {
    return shell(header(title)
      + section(12, `<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">${stat('Outstanding', '$4,200')}${stat('Invoices', '7')}${stat('Files', '23')}</div>`)
      + section(45, `<div class="card" style="margin-bottom:18px"><h2>Recent invoices</h2>${rows([
        ['INV-2041 · Brand refresh', 'Due 12 Mar', '$1,800'],
        ['INV-2039 · Retainer', 'Due 01 Mar', '$2,400'],
        ['INV-2034 · Landing page', 'Paid', '$1,200'],
      ])}</div>`)
      + section(75, `<div class="card"><h2>Shared files</h2>${rows([
        ['brand-guidelines.pdf', '2.4 MB', 'Yesterday'],
        ['homepage-v3.fig', '8.1 MB', '3 days ago'],
      ])}</div>`))
  }

  if (templateId === 'deals') {
    return shell(header(title)
      + section(12, `<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">${stat('Tracked', '48')}${stat('Best price', '$14.99')}${stat('Alerts', '3')}</div>`)
      + section(45, `<div class="card" style="margin-bottom:18px"><h2>Price history</h2>
        <div class="bar" style="margin:14px 0"><div style="width:${Math.max(12, pct)}%"></div></div>
        <p class="muted">Lowest in the last 30 days</p></div>`)
      + section(75, `<div class="card"><h2>Upcoming</h2>${rows([
        ['Hollow Knight Silksong', '$14.99', '<span class="pill">Tracked</span>'],
        ['Animal Well', '$12.50', '<span class="pill">Tracked</span>'],
        ['Sea of Stars', '$18.99', '<span class="pill">Alert</span>'],
      ])}</div>`))
  }

  return shell(header(title)
    + section(12, `<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">${stat('Meals planned', '14')}${stat('Shopping items', '23')}${stat('Prep time', '2h')}</div>`)
    + section(45, `<div class="card" style="margin-bottom:18px"><h2>Monday</h2>${rows([
      ['Breakfast', 'Overnight oats', '5 min'],
      ['Lunch', 'Chickpea salad', '15 min'],
      ['Dinner', 'Sheet-pan gnocchi', '35 min'],
    ])}</div>`)
    + section(75, `<div class="card"><h2>Shopping list</h2>${rows([
      ['Chickpeas', '2 cans', 'Needed'],
      ['Gnocchi', '1 pack', 'Needed'],
      ['Spinach', '1 bag', 'Have it'],
    ])}</div>`))
}
