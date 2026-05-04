// ============================================================
//  app.js — основна логіка застосунку
//  (довідники вбудовані сюди, окремий data.js не потрібен)
// ============================================================

// ── Довідники ────────────────────────────────────────────────
const STORES = [
  'Книгарня Є',
  'Наш Формат',
  'Кніга Біз (ФОП Лаппо Олена) 2713513120',
  'Книгарня на Федорова (ФОП Стасів Наталя) 2746111985',
  'Дім книги (ФОП Пелех Андрій) 3073401030',
  'Книгарня Стродо (ФОП Троянчук Сергій) 3001321709',
  'Книжковий Лев 45024531',
  'Книгарня Закапелок (ФОП Паромська Наталя) 3172712785',
  'Книгарня СЕНС на Хрещатику 45306741',
  'Книгарня СЕНС 45266196',
  'Книгарня Збірка ФОП Кузьменко Наталя) 3437810568',
  'Суперкнигарня Моя книжкова полиця 43843094',
  'Книгарня Ніша (Луценко Галина) 3189206863',
  'UA Comix (ФОП Кордоба Богдан) 3415715097',
  'Книгарня Сковорода (ТОВ Васту) 43263900',
  'Книгання "Культурні" (ФОП Білоус Анастісія)',
  'Лісова книгарня (ФОП Доманова Анастасія) 3449305328',
  'Книгарня "Тіра" (ФОП Абросимова Надія) 3206712964',
  'Інтернет магазин книг MeGoGo Books 38347009',
  'Femka Brand магазин одягу (ФОП Щербачова Олександра) 3674811942',
  'Книгарня "Герої" (Люлька Антоніна) 3266817809',
  'Свідомі собачники Todli.ua (ФОП Гончарук Анастасія) 3607105540',
  'Книгарня Yakaboo (ТОВ Якабу рітейл) 44987642',
  'Затишна книгарня (ФОП Новицька Вікторія) 3142815027',
];

const PRICES = {
  'Антологія "THE ARC" (№1)':                             [250, 300, 325, 375, 450],
  'Антологія "THE ARC" (№2)':                             [250, 300, 325, 375, 450],
  'Антологія "THE BLACK SEA WHALE" (№1)':                 [250, 300, 325, 375, 450],
  'Антологія "THE BLACK SEA WHALE" (№2)':                 [250, 300, 325],
  'Антологія "THE BLACK SEA WHALE" (№3)':                 [250, 300],
  'Антологія "ТРЕТЯ ДІЯ" (№3)':                           [250, 300, 325],
  'Книга "ЗДОРОВИЙ ГЛУЗД"':                               [189, 205, 221],
  'Книга "Кінець віри"':                                  [387, 417],
  'Книга "КЛЕПТОКРАТІЯ ПО-АМЕРИКАНСЬКИ"':                 [299, 322, 345],
  'Книга "КОРОТКА ІСТОРІЯ МІЗОГІНІЇ"':                    [296, 319, 341],
  'Книга "Куди подівся Коцик?"':                          [244, 263, 281],
  'Книга "МОЧИ МАНТУ"':                                   [227.5, 228, 245, 250],
  'Книга "НЕСПРОМОЖНА ДЕРЖАВА"':                          [256.75, 257, 277, 280, 300],
  'Українська ідентичність у графічному дизайні 1945–1989 років': [],
};

const PRODUCTS = Object.keys(PRICES);

const MONTHS = [
  '', 'Січень', 'Лютий', 'Березень', 'Квітень',
  'Травень', 'Червень', 'Липень', 'Серпень',
  'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];

// ── Google Sheets налаштування ──────────────────────────────
// Після розгортання Apps Script вставте URL сюди:
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzaUPUYo-VoyFlsIZ10XeW4Anmu4j29Zl3_88qv1vhLLLWF2yJresJyRtvZm5FZIP8v/exec';
// Приклад: 'https://script.google.com/macros/s/ABC.../exec'
// Якщо порожньо — дані зберігаються лише локально (localStorage)
// ────────────────────────────────────────────────────────────

// ── Локальне сховище ────────────────────────────────────────
const STORAGE_KEY = 'bookstore-v4';

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.sales)    db.sales     = parsed.sales;
      if (parsed.shipments) db.shipments = parsed.shipments;
    }
  } catch (e) { console.warn('loadDB error', e); }
}

function saveDB() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) { console.warn('saveDB error', e); }
}

// ── Стан ────────────────────────────────────────────────────
const db = { sales: [], shipments: [] };

// ── Допоміжні ───────────────────────────────────────────────
function xp(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function tod() { return new Date().toISOString().slice(0, 10); }
function fmtD(d) {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return `${dd}.${m}.${y}`;
}

// ── Tabs ─────────────────────────────────────────────────────
function sw(t) {
  const ts = ['entry', 'ship', 'stock', 'sales', 'rep'];
  document.querySelectorAll('.tab').forEach((b, i) =>
    b.classList.toggle('active', ts[i] === t));
  document.querySelectorAll('.section').forEach(s =>
    s.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  if (t === 'sales') { popSF(); renderSales(); renderSalMet(); }
  if (t === 'stock') { popSTF(); renderStock(); renderStMet(); }
  if (t === 'rep')   renderRep();
}

// ── Ініціалізація селектів ───────────────────────────────────
function stOpts() {
  return STORES.map(s => `<option value="${xp(s)}">${xp(s)}</option>`).join('');
}
function prOpts() {
  return PRODUCTS.map(p => `<option value="${xp(p)}">${xp(p)}</option>`).join('');
}
function priceOpts(book) {
  const ps = PRICES[book] || [];
  if (!ps.length) return '<option value="">— введіть вручну —</option>';
  return '<option value="">— оберіть ціну —</option>' +
    ps.map(p => `<option value="${p}">${p} ₴</option>`).join('');
}

function initSelects() {
  const o = '<option value="">— оберіть книгарню —</option>' + stOpts();
  document.getElementById('e-store').innerHTML  = o;
  document.getElementById('sh-store').innerHTML = o;
  const fo = '<option value="">Всі книгарні</option>' + stOpts();
  document.getElementById('stfs').innerHTML = fo;
  document.getElementById('fss').innerHTML  = fo;
}

function initYears() {
  const cur = new Date().getFullYear();
  ['e-year', 'sh-year'].forEach(id => {
    const sel = document.getElementById(id);
    for (let y = cur; y >= cur - 5; y--)
      sel.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);
    sel.value = cur;
  });
  document.getElementById('e-month').value  = new Date().getMonth() + 1;
  document.getElementById('sh-month').value = new Date().getMonth() + 1;
}

function updBadge() {
  const n = db.sales.length + db.shipments.length;
  document.getElementById('tbadge').textContent =
    n ? `${n} записів у базі` : '';
}

// ── SALE ROWS ────────────────────────────────────────────────
let salIdx = 0;

function addSaleRow() {
  const i = salIdx++;
  document.getElementById('sale-rows').insertAdjacentHTML('beforeend', `
    <div class="row-sale" id="sal-row-${i}">
      <select id="sal-book-${i}" onchange="onSaleBookChange(${i})">
        <option value="">— товар —</option>${prOpts()}
      </select>
      <input type="number" id="sal-qty-${i}" placeholder="0" min="0"
        style="text-align:right">
      <select id="sal-price-${i}">
        <option value="">— спочатку товар —</option>
      </select>
      <button class="btn-danger" onclick="document.getElementById('sal-row-${i}').remove()">✕</button>
    </div>`);
}

function onSaleBookChange(i) {
  const book = document.getElementById('sal-book-' + i).value;
  const psel = document.getElementById('sal-price-' + i);
  if (!book) {
    psel.innerHTML = '<option value="">— спочатку товар —</option>';
    return;
  }
  psel.innerHTML = priceOpts(book);
  const ps = PRICES[book] || [];
  if (ps.length === 1) psel.value = ps[0];
}

function getSaleRows() {
  const rows = [];
  document.querySelectorAll('[id^="sal-row-"]').forEach(el => {
    const i = el.id.replace('sal-row-', '');
    const book  = document.getElementById('sal-book-'  + i)?.value?.trim();
    const qty   = parseFloat(document.getElementById('sal-qty-'  + i)?.value) || 0;
    const price = parseFloat(document.getElementById('sal-price-' + i)?.value) || 0;
    if (book) rows.push({ book, qty, price });
  });
  return rows;
}

async function saveSale() {
  const store = document.getElementById('e-store').value;
  const year  = parseInt(document.getElementById('e-year').value);
  const month = parseInt(document.getElementById('e-month').value);
  if (!store) { alert('Оберіть книгарню'); return; }
  const sales = getSaleRows();
  if (!sales.length || !sales[0].book) { alert('Додайте хоча б один товар'); return; }
  const noPrice = sales.find(s => s.book && !s.price);
  if (noPrice) { alert(`Оберіть ціну для: ${noPrice.book}`); return; }

  const rec = { id: Date.now(), store, year, month, sales };
  const ei = db.sales.findIndex(r =>
    r.store === store && r.year === year && r.month === month);
  if (ei >= 0) {
    if (!confirm('Звіт вже є. Замінити?')) return;
    db.sales.splice(ei, 1);
  }
  db.sales.push(rec);
  saveDB();

  // Відправка в Google Sheets (якщо URL налаштовано)
  await syncToSheets('sale', rec);

  showMsg('smsg', '✓ Збережено ' + new Date().toLocaleTimeString('uk'));
  updBadge();
}

function clrSale() {
  document.getElementById('e-store').value = '';
  document.getElementById('sale-rows').innerHTML = '';
  salIdx = 0;
  addSaleRow();
}

// ── SHIP ROWS ────────────────────────────────────────────────
let shpIdx = 0;

function addShipRow() {
  const i = shpIdx++;
  document.getElementById('ship-rows').insertAdjacentHTML('beforeend', `
    <div class="row-ship" id="shp-row-${i}">
      <select id="shp-book-${i}" onchange="onShipBookChange(${i})">
        <option value="">— товар —</option>${prOpts()}
      </select>
      <input type="date" id="shp-date-${i}" value="${tod()}">
      <input type="number" id="shp-disp-${i}" placeholder="0" min="0"
        style="text-align:right" oninput="calcShipRow(${i})">
      <select id="shp-price-${i}" onchange="calcShipRow(${i})">
        <option value="">— спочатку товар —</option>
      </select>
      <span id="shp-sum-${i}" class="net-span" style="color:#1a1a1a;font-weight:500">—</span>
      <input type="number" id="shp-ret-${i}" placeholder="0" min="0"
        style="text-align:right" oninput="calcShipRow(${i})">
      <span id="shp-net-${i}" class="net-span">—</span>
      <button class="btn-danger" onclick="removeShipRow(${i})">✕</button>
    </div>`);
}

function onShipBookChange(i) {
  const book = document.getElementById('shp-book-' + i).value;
  const psel = document.getElementById('shp-price-' + i);
  if (!book) {
    psel.innerHTML = '<option value="">— спочатку товар —</option>';
    calcShipRow(i);
    return;
  }
  psel.innerHTML = priceOpts(book);
  const ps = PRICES[book] || [];
  if (ps.length === 1) psel.value = ps[0];
  calcShipRow(i);
}

function removeShipRow(i) {
  const el = document.getElementById('shp-row-' + i);
  if (el) el.remove();
  updateShipTotal();
}

function calcShipRow(i) {
  const disp  = parseFloat(document.getElementById('shp-disp-'  + i)?.value) || 0;
  const price = parseFloat(document.getElementById('shp-price-' + i)?.value) || 0;
  const ret   = parseFloat(document.getElementById('shp-ret-'   + i)?.value) || 0;
  const net   = disp - ret;

  // Сума = відвантажено × ціна
  const sum = disp * price;
  const sumEl = document.getElementById('shp-sum-' + i);
  if (sumEl) sumEl.textContent = sum > 0 ? sum.toLocaleString('uk') + ' ₴' : '—';

  // Разом±
  const netEl = document.getElementById('shp-net-' + i);
  if (netEl) {
    netEl.textContent = (net >= 0 ? '+' : '') + net;
    netEl.style.color = net > 0 ? '#27ae60' : net < 0 ? '#c0392b' : '#888';
  }

  updateShipTotal();
}

function updateShipTotal() {
  let total = 0;
  document.querySelectorAll('[id^="shp-row-"]').forEach(el => {
    const i     = el.id.replace('shp-row-', '');
    const disp  = parseFloat(document.getElementById('shp-disp-'  + i)?.value) || 0;
    const price = parseFloat(document.getElementById('shp-price-' + i)?.value) || 0;
    total += disp * price;
  });
  const el = document.getElementById('ship-total-sum');
  if (el) el.textContent = total > 0 ? total.toLocaleString('uk') + ' ₴' : '0 ₴';
}

function getShipRows() {
  const rows = [];
  document.querySelectorAll('[id^="shp-row-"]').forEach(el => {
    const i = el.id.replace('shp-row-', '');
    const book       = document.getElementById('shp-book-'  + i)?.value?.trim();
    const date       = document.getElementById('shp-date-'  + i)?.value || '';
    const dispatched = parseFloat(document.getElementById('shp-disp-'  + i)?.value) || 0;
    const price      = parseFloat(document.getElementById('shp-price-' + i)?.value) || 0;
    const returned   = parseFloat(document.getElementById('shp-ret-'   + i)?.value) || 0;
    if (book) rows.push({ book, date, dispatched, price, total: dispatched * price, returned });
  });
  return rows;
}

async function saveShip() {
  const store   = document.getElementById('sh-store').value;
  const year    = parseInt(document.getElementById('sh-year').value);
  const month   = parseInt(document.getElementById('sh-month').value);
  const invoice = document.getElementById('sh-invoice').value.trim();
  if (!store) { alert('Оберіть книгарню'); return; }
  if (!invoice) { alert('Введіть номер видаткової'); return; }
  const rows = getShipRows();
  if (!rows.length || !rows[0].book) { alert('Додайте хоча б один рядок'); return; }

  // Якщо вже є запис з таким самим номером видаткової — замінюємо саме його
  // Якщо немає — просто додаємо новий (дозволяємо кілька відвантажень в один місяць)
  const existingIdx = db.shipments.findIndex(r =>
    r.store === store && r.invoice === invoice);

  if (existingIdx >= 0) {
    if (!confirm(`Видаткова "${invoice}" вже збережена. Замінити?`)) return;
    db.shipments.splice(existingIdx, 1);
  }

  const rec = { id: Date.now(), store, year, month, invoice, rows };
  db.shipments.push(rec);
  saveDB();

  await syncToSheets('shipment', rec);

  showMsg('shmsg', '✓ Збережено ' + new Date().toLocaleTimeString('uk'));
  updBadge();
}

function clrShip() {
  document.getElementById('sh-store').value   = '';
  document.getElementById('sh-invoice').value = '';
  document.getElementById('ship-rows').innerHTML = '';
  document.getElementById('ship-total-sum').textContent = '0 ₴';
  shpIdx = 0;
  addShipRow();
}

// ── STOCK ────────────────────────────────────────────────────
function calcStock() {
  const m = {};
  db.shipments.forEach(rec => rec.rows.forEach(r => {
    const k = rec.store + '||' + r.book;
    if (!m[k]) m[k] = { store: rec.store, book: r.book, dispatched: 0, returned: 0, sold: 0 };
    m[k].dispatched += r.dispatched;
    m[k].returned   += r.returned;
  }));
  db.sales.forEach(rep => rep.sales.forEach(s => {
    const k = rep.store + '||' + s.book;
    if (!m[k]) m[k] = { store: rep.store, book: s.book, dispatched: 0, returned: 0, sold: 0 };
    m[k].sold += s.qty;
  }));
  return Object.values(m).map(v => ({ ...v, balance: v.dispatched - v.returned - v.sold }));
}

function renderStMet() {
  const d = calcStock();
  document.getElementById('st-d').textContent = d.reduce((s, r) => s + r.dispatched, 0).toLocaleString('uk');
  document.getElementById('st-r').textContent = d.reduce((s, r) => s + r.returned,   0).toLocaleString('uk');
  document.getElementById('st-s').textContent = d.reduce((s, r) => s + r.sold,        0).toLocaleString('uk');
  document.getElementById('st-b').textContent = d.reduce((s, r) => s + r.balance,     0).toLocaleString('uk');
}

function popSTF() {
  const bf = document.getElementById('stfb'); const bv = bf.value;
  bf.innerHTML = '<option value="">Всі товари</option>' +
    PRODUCTS.map(p => `<option value="${xp(p)}">${xp(p)}</option>`).join('');
  bf.value = bv;
}

function renderStock() {
  let d = calcStock();
  const store = document.getElementById('stfs')?.value || '';
  const book  = document.getElementById('stfb')?.value || '';
  if (store) d = d.filter(r => r.store === store);
  if (book)  d = d.filter(r => r.book  === book);
  d.sort((a, b) => a.store.localeCompare(b.store) || a.book.localeCompare(b.book));
  const w = document.getElementById('stwrap');
  if (!d.length) { w.innerHTML = '<div class="empty">Немає даних. Додайте відвантаження.</div>'; return; }
  w.innerHTML = `<div class="overflow-x"><table>
    <thead><tr>
      <th>Книгарня</th><th>Товар</th>
      <th style="text-align:right">Відвантажено</th>
      <th style="text-align:right">Повернено</th>
      <th style="text-align:right">Продано</th>
      <th style="text-align:right">Залишок</th>
    </tr></thead>
    <tbody>${d.map(r => {
      const c = r.balance <= 0 ? 'stock-zero' : r.balance <= 3 ? 'stock-low' : 'stock-ok';
      return `<tr>
        <td style="font-size:12px">${xp(r.store)}</td>
        <td style="font-size:12px">${xp(r.book)}</td>
        <td style="text-align:right">${r.dispatched}</td>
        <td style="text-align:right">${r.returned || '—'}</td>
        <td style="text-align:right">${r.sold || '—'}</td>
        <td style="text-align:right"><span class="${c}">${r.balance}</span></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ── SALES TABLE ──────────────────────────────────────────────
function popSF() {
  const years = [...new Set(db.sales.map(r => r.year))].sort((a, b) => b - a);
  const fy = document.getElementById('fsy'); const fyv = fy.value;
  fy.innerHTML = '<option value="">Всі роки</option>' +
    years.map(y => `<option value="${y}">${y}</option>`).join('');
  fy.value = fyv;
  const fb = document.getElementById('fsb'); const fbv = fb.value;
  fb.innerHTML = '<option value="">Всі товари</option>' +
    PRODUCTS.map(p => `<option value="${xp(p)}">${xp(p)}</option>`).join('');
  fb.value = fbv;
}

function renderSalMet() {
  document.getElementById('ms').textContent  =
    db.sales.reduce((s, r) => s + r.sales.reduce((a, i) => a + i.qty, 0), 0).toLocaleString('uk');
  document.getElementById('mr').textContent  =
    Math.round(db.sales.reduce((s, r) => s + r.sales.reduce((a, i) => a + i.qty * i.price, 0), 0)).toLocaleString('uk');
  document.getElementById('mst').textContent =
    new Set(db.sales.map(r => r.store)).size;
  document.getElementById('mb').textContent  =
    new Set(db.sales.flatMap(r => r.sales.map(i => i.book))).size;
}

function renderSales() {
  const store = document.getElementById('fss')?.value || '';
  const year  = document.getElementById('fsy')?.value || '';
  const month = document.getElementById('fsm')?.value || '';
  const book  = document.getElementById('fsb')?.value || '';
  const rows  = [];
  db.sales.filter(r => {
    if (store && r.store !== store) return false;
    if (year  && r.year  !== parseInt(year))  return false;
    if (month && r.month !== parseInt(month)) return false;
    return true;
  }).forEach(r => r.sales.forEach(i => {
    if (!book || i.book === book)
      rows.push({ store: r.store, year: r.year, month: r.month,
                  book: i.book, qty: i.qty, price: i.price, total: i.qty * i.price });
  }));
  rows.sort((a, b) => b.year - a.year || b.month - a.month || a.store.localeCompare(b.store));
  const w = document.getElementById('salwrap');
  if (!rows.length) { w.innerHTML = '<div class="empty">Немає даних</div>'; return; }
  const tv = rows.reduce((s, r) => s + r.total, 0);
  w.innerHTML = `<div class="overflow-x"><table>
    <thead><tr>
      <th>Книгарня</th><th>Період</th><th>Товар</th>
      <th style="text-align:right">К-сть</th>
      <th style="text-align:right">Ціна ₴</th>
      <th style="text-align:right">Сума ₴</th>
    </tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td style="font-size:12px">${xp(r.store)}</td>
      <td style="font-size:12px;white-space:nowrap">${MONTHS[r.month]} ${r.year}</td>
      <td style="font-size:12px">${xp(r.book)}</td>
      <td style="text-align:right">${r.qty}</td>
      <td style="text-align:right">${r.price}</td>
      <td style="text-align:right;font-weight:600">${Math.round(r.total).toLocaleString('uk')}</td>
    </tr>`).join('')}</tbody>
    <tfoot><tr>
      <td colspan="5" style="color:#888;font-size:12px">${rows.length} позицій</td>
      <td style="text-align:right">${Math.round(tv).toLocaleString('uk')} ₴</td>
    </tr></tfoot>
  </table></div>`;
}

// ── REPORTS ──────────────────────────────────────────────────
function renderRep() {
  const w = document.getElementById('replist');
  if (!db.sales.length && !db.shipments.length) {
    w.innerHTML = '<div class="empty">Ще немає збережених даних</div>';
    return;
  }
  // Збираємо унікальні ключі рік|місяць|книгарня
  const keys = [...new Set([
    ...db.sales.map(r => r.year + '|' + r.month + '|' + r.store),
    ...db.shipments.map(r => r.year + '|' + r.month + '|' + r.store),
  ])];
  keys.sort((a, b) => {
    const [ay, am, as] = a.split('|');
    const [by, bm, bs] = b.split('|');
    return by - ay || bm - am || as.localeCompare(bs);
  });
  w.innerHTML = keys.map(k => {
    const [year, month, store] = k.split('|');
    const sr  = db.sales.find(r => r.store === store && r.year == year && r.month == month);
    // Всі відвантаження для цієї книгарні/місяця
    const shs = db.shipments.filter(r => r.store === store && r.year == year && r.month == month);

    const sSum = sr  ? sr.sales.reduce((s, i) => s + i.qty * i.price, 0) : 0;
    const sQty = sr  ? sr.sales.reduce((s, i) => s + i.qty, 0) : 0;
    const dQty = shs.reduce((s, sh) => s + sh.rows.reduce((a, r) => a + r.dispatched, 0), 0);
    const rQty = shs.reduce((s, sh) => s + sh.rows.reduce((a, r) => a + r.returned, 0), 0);
    const dSum = shs.reduce((s, sh) => s + sh.rows.reduce((a, r) => a + (r.total || 0), 0), 0);

    // Всі видаткові і дати
    const invoices = shs.filter(sh => sh.invoice).map(sh => sh.invoice);
    const dates = [...new Set(
      shs.flatMap(sh => sh.rows.filter(r => r.date).map(r => r.date))
    )].sort().map(d => fmtD(d));

    return `<div class="card">
      <div class="rep-header">
        <div>
          <div class="rep-store">${xp(store)}</div>
          <div class="rep-period">${MONTHS[month]} ${year}</div>
        </div>
        <div class="rep-actions">
          ${sr ? `<button class="btn-danger" onclick="delRec('sales','${xp(store)}',${year},${month})">Видалити продажі</button>` : ''}
          ${shs.length ? `<button class="btn-danger" onclick="delShipments('${xp(store)}',${year},${month})">Видалити відвантаження</button>` : ''}
        </div>
      </div>
      <div class="rep-grid">
        ${shs.length
          ? `<div class="rep-met">
               <div class="rep-met-l">Відвантажено (${shs.length} видатк.)</div>
               <div class="rep-met-v">${dQty} шт · ${Math.round(dSum).toLocaleString('uk')} ₴${rQty ? ` · −${rQty} пов.` : ''}</div>
               ${invoices.length ? `<div class="rep-met-sub">№ ${invoices.join(', ')}</div>` : ''}
               ${dates.length ? `<div class="rep-met-sub">${dates.join(', ')}</div>` : ''}
             </div>`
          : `<div class="rep-met dim"><div class="rep-met-l">Відвантаження</div><div class="rep-met-sub">не введено</div></div>`}
        ${sr
          ? `<div class="rep-met">
               <div class="rep-met-l">Продано</div>
               <div class="rep-met-v">${sQty} шт · ${Math.round(sSum).toLocaleString('uk')} ₴</div>
             </div>`
          : `<div class="rep-met dim"><div class="rep-met-l">Продажі</div><div class="rep-met-sub">не введено</div></div>`}
        <div class="rep-met">
          <div class="rep-met-l">Позицій</div>
          <div class="rep-met-v">${sr ? sr.sales.length : 0} книг</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function delRec(type, store, year, month) {
  if (!confirm('Видалити?')) return;
  db[type] = db[type].filter(r =>
    !(r.store === store && r.year == year && r.month == month));
  saveDB();
  updBadge();
  renderRep();
}

async function delShipments(store, year, month) {
  const count = db.shipments.filter(r =>
    r.store === store && r.year == year && r.month == month).length;
  if (!confirm(`Видалити всі ${count} відвантаження за цей місяць?`)) return;
  db.shipments = db.shipments.filter(r =>
    !(r.store === store && r.year == year && r.month == month));
  saveDB();
  updBadge();
  renderRep();
}

// ── GOOGLE SHEETS SYNC ───────────────────────────────────────
async function syncToSheets(type, rec) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('GOOGLE_SCRIPT_URL не налаштовано');
    return;
  }

  const payload = { type, ...rec };
  console.log('Відправляємо в Sheets:', JSON.stringify(payload));

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('Запит відправлено успішно');
  } catch (err) {
    console.error('Помилка відправки:', err);
  }
}

function showSyncStatus(state, msg) {
  // можна показати у будь-якому місці інтерфейсу
  console.log(`[Sync ${state}]`, msg);
}

// ── HELPERS ──────────────────────────────────────────────────
function showMsg(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'save-msg success';
  setTimeout(() => { el.textContent = ''; el.className = 'save-msg'; }, 3000);
}

// ── INIT ─────────────────────────────────────────────────────
function init() {
  loadDB();
  initYears();
  initSelects();
  updBadge();
  addSaleRow();
  addShipRow();
}

init();
