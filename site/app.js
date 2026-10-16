// 避雷針 / Lightning Rod — app
(() => {
  const { DIMS, build } = window.BLZ_DATA;
  const { L, EN, switchLang } = window.BLZ_I18N;
  const Leaflet = window.L; // the map library; L here is the language helper
  const DIM_KEYS = Object.keys(DIMS);
  const DAY = 864e5;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const CALM_TIP = L('對事不對人。店家也會看到，寫得具體，他們才知道怎麼改。', "About what happened, not who. The owner will read it too — be specific so they know what to fix.");

  // Real Taipei data is in Chinese (from OpenStreetMap): cuisine and district in English. Shop names stay as they are.
  const AREA_EN = { '中正區': 'Zhongzheng', '大同區': 'Datong', '中山區': 'Zhongshan', '松山區': 'Songshan', '大安區': 'Daan', '萬華區': 'Wanhua',
    '信義區': 'Xinyi', '士林區': 'Shilin', '內湖區': 'Neihu', '南港區': 'Nangang', '文山區': 'Wenshan', '北投區': 'Beitou' };
  const CUISINE_EN = { 咖啡: 'Coffee', 咖啡廳: 'Café', 餐廳: 'Restaurant', 速食: 'Fast food', 漢堡: 'Burgers', 日式: 'Japanese', 中式: 'Chinese',
    麵食: 'Noodles', 拉麵: 'Ramen', 披薩: 'Pizza', 義式: 'Italian', 韓式: 'Korean', 泰式: 'Thai', 壽司: 'Sushi', 蔬食: 'Vegetarian', 純素: 'Vegan',
    台菜: 'Taiwanese', 甜點: 'Desserts', 早餐: 'Breakfast', 火鍋: 'Hot pot', 燒烤: 'BBQ', 茶飲: 'Tea', 手搖飲: 'Bubble tea', 海鮮: 'Seafood',
    三明治: 'Sandwiches', 炸雞: 'Fried chicken', 水餃: 'Dumplings', 越式: 'Vietnamese', 印度: 'Indian', 美式: 'American', 法式: 'French',
    牛排: 'Steak', 咖哩: 'Curry', 烘焙: 'Bakery', 冰品: 'Ice cream', 牛肉麵: 'Beef noodles', 港式: 'Hong Kong', 川菜: 'Sichuan', 江浙: 'Shanghainese',
    早午餐: 'Brunch', 果汁: 'Juice', 甜甜圈: 'Donuts', 烏龍麵: 'Udon', 燒肉: 'Yakiniku', 居酒屋: 'Izakaya', 西式: 'Western', 亞洲: 'Asian',
    墨西哥: 'Mexican', 西班牙: 'Spanish', 德式: 'German', 馬來西亞: 'Malaysian', 新加坡: 'Singaporean', 飯食: 'Rice dishes' };
  const cuisineEN = (c) => CUISINE_EN[c] || c;

  // ── Persistence ────────────────────────────────────────────────
  const KEY = EN ? 'blz.v1.en' : 'blz.v1'; // each language keeps its own reports (tags are in that language)
  const fresh = () => ({
    me: { name: '', points: 0, log: [] },
    reports: [], agreed: {}, confirms: {}, imported: [], replies: {}, googleKey: '',
  });
  let store;
  try { store = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || 'null') }; } catch { store = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ } };

  const demo = build();
  // Real Taipei restaurants (OpenStreetMap). No reviews are attached to real shops in the demo.
  const taipei = (window.BLZ_TAIPEI || []).map(([osm, name, lat, lng, cuisine, area]) => ({
    id: 'osm' + osm, source: 'osm', name, lat, lng, cuisine: EN ? cuisineEN(cuisine) : cuisine, area: EN ? AREA_EN[area] || area : area,
    reviews: [], improvements: [],
  }));
  const taipeiIds = new Set(taipei.map((p) => p.id));
  // 真實台北: real shops + ones you added. 功能示範: fictional shops with sample reports. Never mixed.
  const allPlaces = () => ui.mode === 'demo' ? demo
    : taipei.concat(store.imported.filter((p) => !taipeiIds.has(p.id) && p.source !== 'osm'));
  const byId = (id) => allPlaces().find((p) => p.id === id);

  // ── Icons & 阿雷 (Lei the cloud) ─────────────────────────────────
  const DIM_ICON = {
    food: '<path d="M4 10h12a6 6 0 0 1-12 0zM7 6.5c0-1 1-1 1-2M10 6.5c0-1 1-1 1-2M13 6.5c0-1 1-1 1-2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    service: '<path d="M4 14h12M5.5 14a4.5 4.5 0 0 1 9 0M10 7.5V6M8.5 6h3" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    space: '<path d="M6 4v12M6 10h8v6M14 10V7M6 7h8" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    access: '<rect x="5" y="3.5" width="10" height="10" rx="2.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M5 9h10M7.5 16.5 6 18M12.5 16.5 14 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.3" r=".9" fill="currentColor"/><circle cx="12" cy="11.3" r=".9" fill="currentColor"/>',
    price: '<circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 7.6c-.6-.6-1.3-.8-2-.8-1.2 0-2 .6-2 1.5 0 2 4 1 4 3.1 0 .9-.9 1.6-2.1 1.6-.8 0-1.6-.3-2.1-.9M10 5.6v1.2M10 13v1.3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  };
  const dimIcon = (d, s = 16) => `<svg class="di" viewBox="0 0 20 20" width="${s}" height="${s}" aria-hidden="true">${DIM_ICON[d]}</svg>`;
  const bolt = (on = true) => `<svg class="bolt ${on ? 'on' : ''}" viewBox="0 0 12 16" width="10" height="13" aria-hidden="true"><path d="M7 1 1.5 9H6l-1 6 5.5-8H6z"/></svg>`;

  // mood: calm | happy | grumpy | worried
  function mascot(mood = 'calm', size = 56) {
    const ink = '#2A2640';
    const face = {
      calm: `<circle cx="39" cy="37" r="2.4" fill="${ink}"/><circle cx="53" cy="37" r="2.4" fill="${ink}"/><path d="M42.5 43q3.5 3 7 0" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      happy: `<path d="M36.5 38q2.5-3.5 5 0M50.5 38q2.5-3.5 5 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M41.5 42.5q4.5 5 9 0z" fill="${ink}"/><circle cx="34" cy="43" r="3" fill="#FF9DB0" opacity=".6"/><circle cx="58" cy="43" r="3" fill="#FF9DB0" opacity=".6"/>`,
      grumpy: `<path d="M35.5 33.5l6 2M56.5 33.5l-6 2" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><circle cx="39.5" cy="38.5" r="2.2" fill="${ink}"/><circle cx="52.5" cy="38.5" r="2.2" fill="${ink}"/><path d="M42 45h8" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
      worried: `<path d="M36 34l5-1.5M56 34l-5-1.5" stroke="${ink}" stroke-width="2" stroke-linecap="round"/><circle cx="39" cy="38" r="2.4" fill="${ink}"/><circle cx="53" cy="38" r="2.4" fill="${ink}"/><path d="M41 45q2.5-2 5 0t5 0" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M63 26q2.5 4 0 6q-2.5-2 0-6z" fill="#8EC5FF"/>`,
    }[mood];
    return `<svg class="mascot m-${mood}" viewBox="0 0 92 84" width="${size}" height="${size * 84 / 92}" aria-hidden="true">
<path d="M44 52l-8 14h7l-4 13 13-17h-7l4-10z" fill="#FFC53D" stroke="#E0A21B" stroke-width="1.2" stroke-linejoin="round"/>
<g fill="#E9E6FB"><circle cx="27" cy="38" r="13"/><circle cx="45" cy="29" r="18"/><circle cx="64" cy="36" r="14"/><rect x="16" y="34" width="60" height="20" rx="10"/></g>
<path d="M18 46q28 10 56 0" stroke="#D5D0F4" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
${face}
</svg>`;
  }

  // ── Scoring ───────────────────────────────────────────────────
  // Principles: per-dimension only · 3 different people before a problem counts ·
  // reports fade (half-life 6 months) and archive after a year · confirmed improvements wash old reports out.
  const isPublic = (r) => !r.privateUntil || Date.now() > r.privateUntil;
  const reviewsOf = (p) => (p.reviews || []).concat(store.reports.filter((r) => r.placeId === p.id && isPublic(r)));
  const myPrivate = (p) => store.reports.filter((r) => r.placeId === p.id && !isPublic(r));

  function improvement(p, dim) {
    const demoImp = (p.improvements || []).find((x) => x.dim === dim);
    const mine = store.confirms[p.id + ':' + dim];
    const reply = store.replies[p.id] || null;
    const claimed = !!demoImp || !!(reply && (reply.dims || []).includes(dim));
    const count = (demoImp ? demoImp.confirms : 0) + (mine ? 1 : 0);
    const at = demoImp ? demoImp.at : mine ? mine.at : Date.now();
    return { claimed, count, active: count >= 3, at, mine: !!mine };
  }

  function dimStats(p, dim, now = Date.now()) {
    const rs = reviewsOf(p).filter((r) => r.dim === dim);
    const imp = improvement(p, dim);
    let sum = 0;
    const users = new Set();
    const tags = {};
    let archived = 0;
    for (const r of rs) {
      const age = (now - r.at) / DAY;
      if (age > 365) { archived++; continue; }
      let w = r.severity * Math.pow(0.5, age / 180);
      if (imp.active && r.at < imp.at) w *= 0.15;
      sum += w;
      users.add(r.user);
      for (const t of r.tags) tags[t] = (tags[t] || 0) + 1;
    }
    const score = Math.round(50 * (1 - Math.exp(-sum / 7))) / 10;
    return {
      dim, n: rs.length - archived, users: users.size, confirmed: users.size >= 3, score, imp, archived,
      tags: Object.entries(tags).sort((a, b) => b[1] - a[1]),
    };
  }

  // Most of the 13,000 real shops have no reports at all: skip the math for them.
  const hasActivity = (p) => (p.reviews && p.reviews.length) || store.reports.some((r) => r.placeId === p.id)
    || store.replies[p.id] || Object.keys(store.confirms).some((k) => k.startsWith(p.id + ':'));
  let QUIET_STATS = null;

  function placeStats(p, focus = 'all') {
    if (!hasActivity(p)) {
      if (!QUIET_STATS) QUIET_STATS = fullStats({ id: '__quiet', reviews: [], improvements: [] }, 'all');
      return QUIET_STATS;
    }
    return fullStats(p, focus);
  }

  function fullStats(p, focus) {
    const dims = DIM_KEYS.map((d) => dimStats(p, d));
    const pool = focus === 'all' ? dims : dims.filter((d) => d.dim === focus);
    const confirmed = pool.filter((d) => d.confirmed && !d.imp.active).sort((a, b) => b.score - a.score);
    const top = confirmed[0] || null;
    const pending = pool.some((d) => d.n > 0 && !d.confirmed);
    const improved = dims.filter((d) => d.imp.active && d.n > 0);
    const total = dims.reduce((s, d) => s + d.n, 0);
    return { dims, top, score: top ? top.score : 0, pending, improved, total };
  }

  const level = (s) => (s <= 0 ? 0 : s < 2.4 ? 1 : s < 3.1 ? 2 : 3);
  const LEVEL_WORD = EN ? ['', 'Minor', 'Medium', 'Major'] : ['', '小雷', '中雷', '大雷'];
  const ago = (ts) => {
    const d = Math.floor((Date.now() - ts) / DAY);
    if (d < 1) return L('今天', 'today');
    if (d < 30) return L(d + ' 天前', d + 'd ago');
    if (d < 365) return L(Math.floor(d / 30) + ' 個月前', Math.floor(d / 30) + ' mo ago');
    return L('一年多前', 'over a year ago');
  };
  const hue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) % 360; return h; };

  // ── Me: points & levels ────────────────────────────────────────
  const LEVELS = EN ? [
    { at: 0, name: 'Droplet', say: 'just starting to watch the weather' },
    { at: 50, name: 'Little cloud', say: 'warning friends now' },
    { at: 150, name: 'Storm cloud', say: 'everyone trusts your forecast' },
    { at: 400, name: 'Thunder god', say: 'fair and gentle keeper of warnings' },
  ] : [
    { at: 0, name: '小水滴', say: '剛開始觀察天氣' },
    { at: 50, name: '小雲朵', say: '開始會提醒朋友了' },
    { at: 150, name: '積雨雲', say: '大家都信任你的預報' },
    { at: 400, name: '雷神', say: '公正又溫柔的避雷之神' },
  ];
  function myLevel() {
    const p = store.me.points;
    let i = LEVELS.length - 1;
    while (LEVELS[i].at > p) i--;
    const next = LEVELS[i + 1];
    return { ...LEVELS[i], idx: i, next, pct: next ? (p - LEVELS[i].at) / (next.at - LEVELS[i].at) : 1 };
  }
  function addPoints(n, why) {
    store.me.points += n;
    store.me.log.unshift({ n, why, at: Date.now() });
    store.me.log = store.me.log.slice(0, 50);
    save();
    renderMeChip();
  }
  const BADGES = [
    { id: 'first', name: L('第一聲雷', 'First thunder'), desc: L('送出第一則回報', 'Send your first report'), ok: () => store.reports.length >= 1 },
    { id: 'gentle', name: L('溫柔的雷', 'Gentle thunder'), desc: L('送出 3 則附建議的回報', 'Send 3 reports with a suggestion'), ok: () => store.reports.length >= 3 },
    { id: 'fair', name: L('公道伯', 'Fair judge'), desc: L('幫店家確認改善 2 次', 'Confirm a shop improved, twice'), ok: () => Object.keys(store.confirms).length >= 2 },
    { id: 'access', name: L('交通情報員', 'Route scout'), desc: L('回報 2 則交通狀況', 'Report 2 getting-there issues'), ok: () => store.reports.filter((r) => r.dim === 'access').length >= 2 },
    { id: 'explorer', name: L('探路者', 'Explorer'), desc: L('新增一家地圖上沒有的店', 'Add a shop that isn\'t on the map'), ok: () => store.imported.some((p) => p.source !== 'osm') },
    { id: 'pro', name: L('避雷專家', 'Heads-up pro'), desc: L('送出 10 則回報', 'Send 10 reports'), ok: () => store.reports.length >= 10 },
  ];

  // ── UI state ───────────────────────────────────────────────────
  const ui = { view: 'list', id: null, dim: 'all', sort: 'hot', q: '', pending: true, mode: 'real' };

  // ── Map ────────────────────────────────────────────────────────
  const map = Leaflet.map('map', { zoomControl: false, attributionControl: true }).setView([25.0418, 121.5440], 16);
  Leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
  Leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, className: 'tiles',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const markers = new Map();
  const canvas = Leaflet.canvas({ padding: 0.5 });
  const QUIET = { radius: 4.5, color: '#fff', weight: 1.2, fillColor: '#8F8A99', fillOpacity: .85, renderer: canvas };
  // Zoomed out, 1,800 real shops would bury the pins: keep them small and faint until you zoom in.
  function quietStyle() {
    const z = map.getZoom();
    return z >= 16 ? { radius: 5, weight: 1.2, fillOpacity: .85 }
      : z >= 15 ? { radius: 4, weight: 1, fillOpacity: .7 }
      : z >= 14 ? { radius: 3, weight: .8, fillOpacity: .5 }
      : { radius: 2, weight: 0, fillOpacity: .35 };
  }
  map.on('zoomend', () => {
    const s = quietStyle();
    for (const m of markers.values()) if (m.quiet) { m.setStyle(s); m.setRadius(s.radius); }
  });

  function pinHtml(p, st, selected) {
    const lv = level(st.score);
    const imp = st.improved.length && !st.top;
    const cls = st.total === 0 ? 'none' : imp ? 'ok' : st.top ? 'lv' + lv : 'pending';
    const label = st.top ? st.score.toFixed(1) : st.total === 0 ? '' : imp ? '✓' : '?';
    return `<div class="pin ${cls} ${selected ? 'sel' : ''}"><span>${label}</span></div>${selected ? `<div class="pin-name">${esc(p.name)}</div>` : ''}`;
  }

  function drawMarkers(list) {
    const keep = new Set(list.map((p) => p.id));
    for (const [id, m] of markers) if (!keep.has(id)) { m.remove(); markers.delete(id); }
    for (const p of list) {
      const st = placeStats(p, ui.dim);
      const sel = ui.id === p.id;
      // Shops nobody has reported: cheap canvas dots, so 1,800 real shops stay fast.
      const quiet = st.total === 0 && !sel;
      let m = markers.get(p.id);
      if (m && m.quiet !== quiet) { m.remove(); markers.delete(p.id); m = null; }
      if (quiet) {
        if (!m) {
          m = Leaflet.circleMarker([p.lat, p.lng], { ...QUIET, ...quietStyle() }).addTo(map);
          m.once('mouseover', () => m.bindTooltip(esc(p.name), { direction: 'top', offset: [0, -4] }).openTooltip());
          m.on('click', () => openPlace(p.id));
          m.quiet = true;
          markers.set(p.id, m);
        }
        continue;
      }
      const icon = Leaflet.divIcon({ className: 'pin-wrap', html: pinHtml(p, st, sel), iconSize: [34, 34], iconAnchor: [17, 17] });
      if (!m) {
        m = Leaflet.marker([p.lat, p.lng], { icon, keyboard: true, title: p.name }).addTo(map);
        m.on('click', () => openPlace(p.id));
        m.quiet = false;
        markers.set(p.id, m);
      } else m.setIcon(icon);
      m.setZIndexOffset(sel ? 1000 : st.top ? level(st.score) * 100 : 0);
    }
  }

  // ── Filtering ──────────────────────────────────────────────────
  function visiblePlaces() {
    const q = ui.q.trim().toLowerCase();
    return allPlaces().filter((p) => {
      if (q) {
        const hay = [p.name, p.cuisine, p.area, ...reviewsOf(p).flatMap((r) => r.tags)].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (ui.dim !== 'all') {
        const d = dimStats(p, ui.dim);
        if (!d.n) return false;
        if (!ui.pending && !d.confirmed) return false;
      } else if (!ui.pending) {
        const st = placeStats(p);
        if (st.total && !st.top && !st.improved.length) return false;
      }
      return true;
    });
  }

  function sorted(list) {
    const withStats = list.map((p) => ({ p, st: placeStats(p, ui.dim) }));
    const latest = (p) => Math.max(0, ...reviewsOf(p).map((r) => r.at));
    const cmp = {
      hot: (a, b) => b.st.score - a.st.score || b.st.total - a.st.total,
      recent: (a, b) => latest(b.p) - latest(a.p),
      improved: (a, b) => b.st.improved.length - a.st.improved.length || b.st.score - a.st.score,
      calm: (a, b) => a.st.score - b.st.score || a.st.total - b.st.total,
    }[ui.sort];
    return withStats.sort(cmp);
  }

  // ── Panel: list ────────────────────────────────────────────────
  const panel = $('#panel');

  function renderList() {
    const all = sorted(visiblePlaces());
    drawMarkers(all.map((x) => x.p));
    const real = ui.mode === 'real';
    const reported = all.filter((x) => x.st.total > 0);
    let list = reported;
    let nearby = [];
    if (real) {
      // Real mode: shops with reports first, then real shops in the visible map area, nearest first.
      const b = map.getBounds();
      const c = map.getCenter();
      const quiet = all.filter((x) => x.st.total === 0 && (ui.q || b.contains([x.p.lat, x.p.lng])));
      const d2 = (p) => (p.lat - c.lat) ** 2 + (p.lng - c.lng) ** 2;
      nearby = quiet.sort((a, b2) => d2(a.p) - d2(b2.p)).slice(0, 40);
      list = ui.dim === 'all' ? reported.concat(nearby) : reported;
    } else if (ui.q) list = all;

    const hot = reported.filter((x) => x.st.top && level(x.st.score) === 3).length;
    const dimName = ui.dim === 'all' ? '' : DIMS[ui.dim].label;
    let topTag = null;
    if (ui.dim !== 'all') {
      const counts = {};
      for (const { p } of reported) for (const [t, n] of dimStats(p, ui.dim).tags) counts[t] = (counts[t] || 0) + n;
      topTag = Object.entries(counts).sort((a, b2) => b2[1] - a[1])[0];
    }
    const say = ui.q && !list.length ? L(`找不到「${esc(ui.q)}」。換個關鍵字試試？`, `Nothing for “${esc(ui.q)}”. Try another word?`)
      : ui.dim !== 'all' && topTag ? L(`只看「${dimName}」：大家最常遇到的是「${esc(topTag[0])}」。`, `Only “${dimName}”: the most common issue is “${esc(topTag[0])}”.`)
      : real && !reported.length ? L(`台北 ${taipei.length.toLocaleString()} 家真實店家都在地圖上了，還沒有人回報。去過哪家踩雷？點店家就能回報，你會是第一個。`,
        `All ${taipei.length.toLocaleString()} real Taipei places are on the map, and nobody has reported anything yet. Had a bad time somewhere? Tap the place to report — you'd be the first.`)
      : hot ? L(`這一帶有 ${hot} 家大雷要注意。不過記得，雷只是提醒，不是判決。`, `${hot} places around here have major warnings. Remember: a warning is a heads-up, not a verdict.`)
      : L('這一帶還算晴朗。去之前可以先看看大家的提醒。', 'Skies look clear around here. Check what others noticed before you go.');

    panel.innerHTML = `
      <div class="p-head">
        <div class="mode" role="tablist" aria-label="${L('資料模式', 'Data mode')}">
          <button class="${real ? 'on' : ''}" data-act="mode" data-v="real">${L('真實台北', 'Real Taipei')} <small>${taipei.length.toLocaleString()}${L(' 家', '')}</small></button>
          <button class="${real ? '' : 'on'}" data-act="mode" data-v="demo">${L('功能示範', 'Demo')} <small>${L('虛構店家', 'fictional')}</small></button>
        </div>
        ${real ? '' : `<div class="demo-note">${L('⚠️ 示範模式：以下店家和回報都是<b>虛構</b>的，只用來展示避雷功能怎麼運作。', '⚠️ Demo mode: these places and reports are all <b>made up</b>, just to show how it works.')}</div>`}
        <div class="say-row">${mascot(hot && ui.dim === 'all' ? 'grumpy' : 'calm', 52)}<p class="say">${say}</p></div>
        <div class="chips" role="tablist" aria-label="${L('向度', 'Aspect')}">
          <button class="chip ${ui.dim === 'all' ? 'on' : ''}" data-act="dim" data-v="all">${L('全部', 'All')}</button>
          ${DIM_KEYS.map((d) => `<button class="chip ${ui.dim === d ? 'on' : ''}" data-act="dim" data-v="${d}">${dimIcon(d, 15)}${DIMS[d].label}</button>`).join('')}
        </div>
        <div class="tools">
          <span class="count">${real && !ui.q ? (reported.length ? L(`有回報 <b>${reported.length}</b> 家`, `<b>${reported.length}</b> reported`) : L('還沒有人回報', 'No reports yet')) : L(`<b>${list.length}</b> 家`, `<b>${list.length}</b> places`)}</span>
          ${real && !reported.length ? '' : `<label class="tgl"><input type="checkbox" data-act="pending" ${ui.pending ? 'checked' : ''}><span></span>${L('含待確認', 'Include unconfirmed')}</label>
          <select data-act="sort" aria-label="${L('排序', 'Sort')}">
            <option value="hot" ${ui.sort === 'hot' ? 'selected' : ''}>${L('最需要注意', 'Most warnings')}</option>
            <option value="recent" ${ui.sort === 'recent' ? 'selected' : ''}>${L('最新回報', 'Newest')}</option>
            <option value="improved" ${ui.sort === 'improved' ? 'selected' : ''}>${L('有改善的', 'Improved')}</option>
            <option value="calm" ${ui.sort === 'calm' ? 'selected' : ''}>${L('最少雷', 'Fewest warnings')}</option>
          </select>`}
          <button class="add" data-act="add">${L('＋ 新增店家', '＋ Add a place')}</button>
        </div>
      </div>
      ${real ? `<div class="legend"><span><i class="dot-real"></i>${L(`資料：OpenStreetMap 臺北市 ${taipei.length.toLocaleString()} 家餐廳・雷只來自真實使用者回報`, `Data: ${taipei.length.toLocaleString()} Taipei City places from OpenStreetMap · warnings only come from real user reports`)}</span></div>` : ''}
      <ol class="places">
        ${reported.length || !real ? (real ? reported : list).map(({ p, st }) => card(p, st)).join('') : ''}
        ${real && nearby.length && ui.dim === 'all' ? `<li class="sub">${ui.q ? L('搜尋結果', 'Search results') : L('地圖範圍內的店家（拖動地圖看更多）', 'Places in view (drag the map for more)')}</li>${nearby.map(({ p, st }) => card(p, st)).join('')}` : ''}
        ${!list.length ? `<li class="empty">${L('沒有符合的店家', 'No matching places')}</li>` : ''}
      </ol>`;
  }

  function scoreBadge(st, focusDim) {
    if (st.total === 0) return `<div class="ring none"><b>—</b><small>${L('還沒有雷', 'No warnings')}</small></div>`;
    if (st.top) return `<div class="ring lv${level(st.score)}"><b>${st.score.toFixed(1)}</b><small>${L(DIMS[st.top.dim].label + LEVEL_WORD[level(st.score)], LEVEL_WORD[level(st.score)] + ' · ' + DIMS[st.top.dim].label)}</small></div>`;
    if (st.improved.length) return `<div class="ring ok"><b>✓</b><small>${L('已改善', 'Improved')}</small></div>`;
    return `<div class="ring pending"><b>?</b><small>${L('待確認', 'Unconfirmed')}</small></div>`;
  }

  function card(p, st) {
    const topTag = (st.top || st.dims.filter((d) => d.n).sort((a, b) => b.n - a.n)[0] || { tags: [] }).tags[0];
    return `
      <li class="place ${ui.id === p.id ? 'sel' : ''}" data-act="open" data-id="${p.id}" tabindex="0" role="button">
        <div class="pl-main">
          <div class="pl-name">${esc(p.name)}${st.improved.map((d) => `<span class="imp">${L(DIMS[d.dim].label + '已改善', DIMS[d.dim].label + ' improved')}</span>`).join('')}</div>
          <div class="pl-meta">${esc(p.cuisine || L('餐廳', 'Restaurant'))} · ${esc(p.area || '')}${p.price ? ' · ' + p.price : ''}${p.source === 'osm' ? ` <span class="real">${L('真實店家', 'Real place')}</span>` : p.demo ? ` <span class="fake">${L('示範', 'Demo')}</span>` : ''}</div>
          <div class="pl-dims">${st.dims.map((d) => `
            <span class="db ${d.n ? '' : 'zero'} ${d.imp.active ? 'ok' : d.confirmed ? 'lv' + level(d.score) : d.n ? 'pending' : ''}" title="${DIMS[d.dim].label}${L('：', ': ')}${d.n ? d.score.toFixed(1) + (d.confirmed ? '' : L('（待確認）', ' (unconfirmed)')) : L('沒有回報', 'no reports')}">
              ${dimIcon(d.dim, 13)}<i style="--w:${d.n ? Math.max(12, d.score * 20) : 0}%"></i></span>`).join('')}</div>
          ${topTag ? `<div class="pl-top">${L('最常見：', 'Most common: ')}<b>${esc(topTag[0])}</b> ×${topTag[1]}</div>` : p.source === 'osm' ? `<div class="pl-top">${L('真實店家・還沒有人回報', 'Real place · no reports yet')}</div>` : ''}
        </div>
        ${scoreBadge(st)}
      </li>`;
  }

  // ── Panel: place detail ───────────────────────────────────────
  function sayFor(p, st) {
    if (!st.total) return ['happy', L('還沒有人在這裡踩雷。第一個去的話，回來跟大家說說？', "Nobody has had a bad time here yet. If you go, come back and tell everyone?")];
    if (!st.top && st.improved.length) return ['happy', L(`店家把「${st.improved.map((d) => DIMS[d.dim].label).join('、')}」改善了，而且有客人確認過。好樣的！`, `The shop improved “${st.improved.map((d) => DIMS[d.dim].label).join(', ')}”, and customers confirmed it. Nice!`)];
    if (!st.top) return ['calm', L('有零星回報，但還不到 3 個人，先當作參考就好。', 'A few scattered reports, but fewer than 3 people — treat it as a hint.')];
    const t = st.top.tags[0] ? st.top.tags[0][0] : '';
    const tip = EN ? {
      access: "If you're not in a hurry or can go early, it barely matters.",
      space: 'If you mind noise or crowds, skip the peak hours.',
      price: 'Just check the menu and charges before you go.',
      service: 'Most of this happened at busy times — off-peak may be better.',
      food: 'Could be a matter of taste; mention it when you order.',
    }[st.top.dim] : {
      access: '如果你不趕時間、或能提早去，其實影響不大。',
      space: '怕吵、怕擠的人可以避開尖峰時段。',
      price: '去之前先看好菜單和收費方式就好。',
      service: '大家遇到的多半是忙的時候，離峰去可能會好一點。',
      food: '可能是口味問題，點餐時可以先跟店家溝通。',
    }[st.top.dim];
    return [level(st.score) === 3 ? 'grumpy' : 'calm', L(`大家最常提到「${t}」。${tip}`, `People mention “${t}” most. ${tip}`)];
  }

  function renderDetail() {
    const p = byId(ui.id);
    if (!p) { ui.view = 'list'; return renderList(); }
    drawMarkers(sorted(visiblePlaces()).map((x) => x.p).concat(visiblePlaces().some((x) => x.id === p.id) ? [] : [p]));
    const st = placeStats(p);
    const [mood, line] = sayFor(p, st);
    const reply = store.replies[p.id] || p.reply;
    const reviews = reviewsOf(p).filter((r) => (Date.now() - r.at) / DAY <= 365).sort((a, b) => b.at - a.at);
    const clean = st.dims.filter((d) => !d.n).map((d) => DIMS[d.dim].label);
    const mine = myPrivate(p);
    const src = (EN ? { osm: 'Real place (OpenStreetMap)', google: 'Imported from Google Maps', manual: 'Added by you' }
      : { osm: 'OpenStreetMap 真實店家', google: 'Google 地圖匯入', manual: '你新增的店家' })[p.source] || L('示範店家（虛構）', 'Demo place (fictional)');

    panel.innerHTML = `
      <div class="d">
        <button class="back" data-act="back">${L('← 返回列表', '← Back to list')}</button>
        <div class="d-head">
          <div>
            <h1>${esc(p.name)}</h1>
            <div class="pl-meta">${esc(p.cuisine || L('餐廳', 'Restaurant'))} · ${esc(p.area || '')}${p.price ? ' · ' + p.price : ''}</div>
            <span class="src">${src}</span>
          </div>
          ${scoreBadge(st)}
        </div>
        <div class="say-row boxed">${mascot(mood, 50)}<p class="say">${esc(line)}</p></div>

        <div class="d-actions">
          <button class="btn primary" data-act="report" data-id="${p.id}">${bolt()} ${L('我也踩雷了', 'I had a bad time too')}</button>
          <button class="btn ghost" data-act="owner" data-id="${p.id}">${L('我是店家', "I'm the owner")}</button>
        </div>

        ${mine.map((r) => `
          <div class="mine">${L(`你的「${DIMS[r.dim].label}」回報正在給店家優先處理，<b>${Math.ceil((r.privateUntil - Date.now()) / 36e5)} 小時</b>後公開。`, `Your “${DIMS[r.dim].label}” report is with the owner first; it goes public in <b>${Math.ceil((r.privateUntil - Date.now()) / 36e5)} hours</b>.`)}
          <button class="link" data-act="publish" data-rid="${r.id}">${L('現在就公開', 'Publish now')}</button></div>`).join('')}

        ${p.source === 'osm' ? `
          <a class="official" href="https://imap.health.gov.taipei/App_Prog/ListFood.aspx" target="_blank" rel="noopener" data-act="official" data-name="${esc(p.name)}">
            <span class="gov" aria-hidden="true">🏛️</span>
            <div><b>${L('官方衛生稽查紀錄', 'Official hygiene inspections')}</b><small>${L(`開啟臺北市衛生局 iMAP，搜尋「${esc(p.name)}」看稽查結果與餐飲分級（店名已幫你複製）`, `Open the Taipei Department of Health iMAP (in Chinese) and search “${esc(p.name)}” for inspection results and hygiene grades (the name is copied for you)`)}</small></div>
            <span class="go" aria-hidden="true">↗</span>
          </a>` : ''}

        <h3 class="sec">${L('各向度', 'By aspect')}</h3>
        <div class="dims">
          ${st.dims.filter((d) => d.n).sort((a, b) => b.score - a.score).map((d) => dimCard(p, d)).join('')}
          ${clean.length ? `<div class="clean">${L(`✓ 沒有人在「${clean.join('、')}」踩雷`, `✓ No complaints about ${clean.join(', ')}`)}</div>` : ''}
        </div>

        ${reply ? `
          <div class="reply">
            <div class="reply-h"><span class="owner">${L('店家回應', "Owner's reply")}</span><span>${ago(reply.at)}</span></div>
            <p>${esc(reply.text)}</p>
          </div>` : ''}

        <h3 class="sec">${L('大家的提醒', 'Heads-ups')} <small>${L(`${reviews.length} 則・超過一年的會自動封存`, `${reviews.length} · archived after a year`)}</small></h3>
        <ol class="reviews">${reviews.map(reviewCard).join('') || `<li class="empty">${L('還沒有公開的回報', 'No public reports yet')}</li>`}</ol>
      </div>`;
    panel.scrollTop = 0;
  }

  function dimCard(p, d) {
    const cls = d.imp.active ? 'ok' : d.confirmed ? 'lv' + level(d.score) : 'pending';
    const status = d.imp.active ? L('已改善', 'Improved') : d.confirmed ? L(`${d.users} 人回報`, `${d.users} people reported`) : L(`待確認 ${d.users}/3 人`, `Unconfirmed ${d.users}/3`);
    return `
      <div class="dim ${cls}">
        <div class="dim-h">${dimIcon(d.dim, 18)}<b>${DIMS[d.dim].label}</b><span class="st">${status}</span>
          <span class="num">${d.imp.active ? '✓' : d.score.toFixed(1)}</span></div>
        <div class="bar"><i style="--w:${d.imp.active ? 100 : d.score * 20}%"></i></div>
        <div class="tags">${d.tags.slice(0, 4).map(([t, n]) => `<span class="tag">${esc(t)}${n > 1 ? ` <em>×${n}</em>` : ''}</span>`).join('')}</div>
        ${d.imp.claimed && !d.imp.active ? `<div class="imp-claim">${L(`店家說已經改善了，還需要 ${3 - d.imp.count} 位客人確認。`, `The owner says it's fixed; ${3 - d.imp.count} more customers need to confirm.`)}</div>` : ''}
        <div class="dim-foot">
          ${d.imp.mine ? `<span class="thanks">${L('你確認過了，謝謝你的公道 ✓', 'You confirmed it — thanks for being fair ✓')}</span>`
            : `<button class="link" data-act="confirm" data-id="${p.id}" data-dim="${d.dim}">${L('最近去過，已經改善了', 'Went recently — it\'s better now')} <span class="pts">+8</span></button>`}
        </div>
      </div>`;
  }

  function reviewCard(r) {
    const agreed = store.agreed[r.id];
    return `
      <li class="rv">
        <div class="rv-h">
          <span class="av" style="--h:${hue(r.user)}">${esc(r.user.slice(0, 1))}</span>
          <b>${esc(r.user)}</b>${r.mine ? `<span class="you">${L('你', 'You')}</span>` : ''}${r.source === 'google' ? `<span class="gsrc">${L('Google 評論', 'Google review')}</span>` : ''}
          <span class="when">${ago(r.at)}</span>
        </div>
        <div class="rv-tags"><span class="dimchip">${dimIcon(r.dim, 13)}${DIMS[r.dim].label}</span>
          <span class="sev">${[1, 2, 3].map((i) => bolt(i <= r.severity)).join('')}</span>
          ${r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <p>${esc(r.text)}</p>
        ${r.suggest ? `<p class="suggest"><span>${L('給店家', 'For the owner')}</span>${esc(r.suggest)}</p>` : ''}
        <button class="agree ${agreed ? 'on' : ''}" data-act="agree" data-rid="${r.id}">${L('我也遇過', 'Me too')} · ${(r.agree || 0) + (agreed ? 1 : 0)}</button>
      </li>`;
  }

  // ── Panel: me ─────────────────────────────────────────────────
  function renderMe() {
    drawMarkers(sorted(visiblePlaces()).map((x) => x.p));
    const lv = myLevel();
    const confirms = Object.keys(store.confirms).length;
    panel.innerHTML = `
      <div class="d me">
        <button class="back" data-act="back">${L('← 返回列表', '← Back to list')}</button>
        <div class="me-card">
          <div class="me-av">${mascot(lv.idx >= 2 ? 'happy' : 'calm', 76)}</div>
          <div class="me-info">
            <input class="me-name" data-act="name" value="${esc(store.me.name)}" placeholder="${L('幫自己取個暱稱', 'Pick a nickname')}" maxlength="16" aria-label="${L('暱稱', 'Nickname')}">
            <div class="lv-name">${lv.name}<small>${L('・', ' · ')}${lv.say}</small></div>
            <div class="pts-big"><b>${store.me.points}</b> ${L('點', 'points')}</div>
            <div class="lv-bar"><i style="--w:${Math.round(lv.pct * 100)}%"></i></div>
            <div class="lv-next">${lv.next ? L(`再 ${lv.next.at - store.me.points} 點變成「${lv.next.name}」`, `${lv.next.at - store.me.points} more points to “${lv.next.name}”`) : L('你已經是最高等級了', "You're at the top level")}</div>
          </div>
        </div>
        <div class="me-stats">
          <div><b>${store.reports.length}</b><span>${L('則回報', 'reports')}</span></div>
          <div><b>${confirms}</b><span>${L('次確認改善', 'improvements confirmed')}</span></div>
          <div><b>${store.imported.filter((p) => p.source !== 'osm').length}</b><span>${L('家新店', 'places added')}</span></div>
        </div>

        <h3 class="sec">${L('徽章', 'Badges')}</h3>
        <div class="badges">${BADGES.map((b) => `
          <div class="badge ${b.ok() ? 'got' : ''}" title="${b.desc}">
            <span class="b-ic">${b.ok() ? bolt() : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>

        <h3 class="sec">${L('我的回報', 'My reports')}</h3>
        <ol class="my-reports">${store.reports.slice().reverse().map((r) => {
          const p = byId(r.placeId);
          return `<li data-act="open" data-id="${r.placeId}" role="button" tabindex="0">
            <b>${esc(p ? p.name : L('（已移除）', '(removed)'))}</b><span class="dimchip">${DIMS[r.dim].label}</span>
            <span class="${isPublic(r) ? 'pub' : 'priv'}">${isPublic(r) ? L('已公開', 'Public') : L('店家處理中', 'With the owner')}</span></li>`;
        }).join('') || `<li class="empty">${L('還沒有回報。下次踩雷，記得回來告訴大家。', 'No reports yet. Next time something goes wrong, come back and tell everyone.')}</li>`}</ol>

        <div class="how">
          <b>${L('點數怎麼來？', 'How do you earn points?')}</b>
          <ul>${EN ? '<li>Send a report <em>+10</em>, with a suggestion for the owner <em>+5</em></li><li>Confirm a shop really improved <em>+8</em></li><li>“Me too” gives no points, so nobody farms them by piling on</li><li>Add a place that isn\'t on the map <em>+5</em></li>'
            : '<li>送出回報 <em>+10</em>，附上給店家的建議 <em>+5</em></li><li>確認店家真的改善了 <em>+8</em></li><li>按「我也遇過」不給點，避免附和刷分</li><li>新增地圖上沒有的店 <em>+5</em></li>'}</ul>
          <p>${L('我們獎勵的是「有幫助」，不是「罵得兇」。', 'We reward being helpful, not being harsh.')}</p>
        </div>

        <h3 class="sec">${L('點數紀錄', 'Points history')}</h3>
        <ol class="plog">${store.me.log.map((x) => `<li><span>${esc(x.why)}</span><em>+${x.n}</em></li>`).join('') || `<li class="empty">${L('還沒有紀錄', 'Nothing yet')}</li>`}</ol>
        <button class="btn ghost lang-switch" data-act="lang">${L('Switch to English', '切換成中文')}</button>
      </div>`;
  }

  function render() {
    if (ui.view === 'detail') renderDetail();
    else if (ui.view === 'me') renderMe();
    else renderList();
  }

  function renderMeChip() {
    const lv = myLevel();
    $('#meChip').innerHTML = `${mascot('calm', 26)}<span><b>${store.me.points}</b> ${L('點', 'pts')}<small>${lv.name}</small></span>`;
  }

  function openPlace(id) {
    ui.view = 'detail'; ui.id = id;
    const p = byId(id);
    if (p) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 15), { duration: .6 });
    render();
    document.body.classList.add('show-panel');
  }

  // ── Toast ─────────────────────────────────────────────────────
  let toastT;
  function toast(text, mood = 'happy') {
    const t = $('#toast');
    t.innerHTML = `${mascot(mood, 36)}<span>${text}</span>`;
    t.classList.add('in');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('in'), 3200);
  }

  // ── Modal helpers ─────────────────────────────────────────────
  const modal = $('#modal');
  function openModal(html) {
    modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('in'));
    modal.querySelector('input,textarea,button')?.focus();
  }
  function closeModal() {
    modal.classList.remove('in');
    setTimeout(() => { modal.hidden = true; modal.innerHTML = ''; }, 200);
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // ── Report flow ───────────────────────────────────────────────
  // Words that turn a report into an attack. 阿雷 asks you to rephrase instead of blocking silently.
  const HARSH = ['幹', '垃圾', '爛店', '去死', '白癡', '智障', '腦殘', '噁爛', '騙子', '黑店', '倒一倒', '倒閉', '詐騙', '廢物', '賤', '滾',
    'fuck', 'shit', 'trash', 'garbage', 'scam', 'idiot', 'stupid', 'moron', 'disgusting', 'rip-off', 'ripoff', 'go die', 'shut down'];
  let draft = null;

  function startReport(placeId) {
    draft = { placeId, step: 1, dims: {}, text: '', suggest: '', private: true };
    drawReport();
  }

  function toneIssue(s) {
    const hit = HARSH.find((w) => s.toLowerCase().includes(w));
    if (hit) return L(`「${hit}」有點衝。換成發生了什麼事，店家比較聽得進去，也更能幫到下一個人。`, `“${hit}” is a bit harsh. Describe what happened instead — owners listen better, and it helps the next person more.`);
    if (/[!！]{3,}/.test(s)) return L('驚嘆號有點多，冷靜描述會更有說服力。', 'Lots of exclamation marks — a calm description is more convincing.');
    return null;
  }

  function drawReport() {
    const p = byId(draft.placeId);
    const steps = EN ? ['What went wrong', 'What happened', 'Tell us'] : ['哪裡踩雷', '什麼狀況', '說說看'];
    const tip = {
      1: ['calm', L('哪個部分讓你不舒服？可以選好幾個。', 'Which part bothered you? Pick as many as you like.')],
      2: ['calm', L('挑最接近的狀況。「大雷」留給真的很糟的時候。', 'Pick the closest issue. Save “Major” for when it was really bad.')],
      3: ['calm', CALM_TIP],
    }[draft.step];
    const issue = draft.step === 3 ? toneIssue(draft.text + draft.suggest) : null;
    const [mood, say] = issue ? ['worried', issue] : tip;
    const chosen = Object.keys(draft.dims);

    let body = '';
    if (draft.step === 1) {
      body = `<div class="pick-dims">${DIM_KEYS.map((d) => `
        <button class="pick ${draft.dims[d] ? 'on' : ''}" data-r="dim" data-v="${d}">${dimIcon(d, 26)}<b>${DIMS[d].label}</b></button>`).join('')}</div>`;
    } else if (draft.step === 2) {
      body = chosen.map((d) => `
        <div class="pick-block">
          <div class="pb-h">${dimIcon(d, 18)}<b>${DIMS[d].label}</b>
            <span class="sev-pick">${[1, 2, 3].map((i) => `<button class="${draft.dims[d].severity === i ? 'on' : ''}" data-r="sev" data-d="${d}" data-v="${i}">${LEVEL_WORD[i]}</button>`).join('')}</span></div>
          <div class="tags pick-tags">${DIMS[d].tags.map((t) => `<button class="tag ${draft.dims[d].tags.includes(t) ? 'on' : ''}" data-r="tag" data-d="${d}" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        </div>`).join('');
    } else {
      body = `
        <label class="field"><span>${L('發生了什麼事？', 'What happened?')}</span>
          <textarea data-r="text" rows="3" maxlength="200" placeholder="${L('例：平日晚上 7 點去，等了 40 分鐘才上主餐，隔壁晚來的先上。', 'e.g. Went at 7pm on a weekday, waited 40 minutes for the main course; the table after us got served first.')}">${esc(draft.text)}</textarea></label>
        <label class="field"><span>${L('給店家的一句建議', 'One suggestion for the owner')} <em>${L('必填', 'required')}</em></span>
          <input data-r="suggest" maxlength="${EN ? 100 : 60}" placeholder="${L('希望可以先告知大概要等多久', 'Let people know roughly how long the wait is')}" value="${esc(draft.suggest)}"></label>
        <label class="tgl big"><input type="checkbox" data-r="private" ${draft.private ? 'checked' : ''}><span></span>
          <div><b>${L('先讓店家看 72 小時', 'Show the owner first for 72 hours')}</b><small>${L('給店家一個先處理的機會，時間到才公開', 'Give them a chance to fix it before it goes public')}</small></div></label>`;
    }

    const can = draft.step === 1 ? chosen.length > 0
      : draft.step === 2 ? chosen.every((d) => draft.dims[d].tags.length)
      : draft.text.trim().length >= 6 && draft.suggest.trim().length >= 4 && !issue;

    openModal(`
      <div class="r-head">
        <div><small>${L('回報', 'Report')}</small><h2>${esc(p.name)}</h2></div>
        <button class="x" data-r="close" aria-label="${L('關閉', 'Close')}">✕</button>
      </div>
      <ol class="steps">${steps.map((s, i) => `<li class="${i + 1 === draft.step ? 'on' : i + 1 < draft.step ? 'done' : ''}">${s}</li>`).join('')}</ol>
      <div class="say-row boxed">${mascot(mood, 44)}<p class="say">${esc(say)}</p></div>
      <div class="r-body">${body}</div>
      <div class="r-foot">
        ${draft.step > 1 ? `<button class="btn ghost" data-r="prev">${L('上一步', 'Back')}</button>` : '<span></span>'}
        <button class="btn primary" data-r="next" ${can ? '' : 'disabled'}>${draft.step === 3 ? L('送出', 'Send') : L('下一步', 'Next')}</button>
      </div>`);
  }

  modal.addEventListener('click', (e) => {
    const el = e.target.closest('[data-r]');
    if (!el || !draft) return;
    const r = el.dataset.r;
    if (r === 'close') { closeModal(); draft = null; return; }
    if (r === 'dim') {
      const d = el.dataset.v;
      if (draft.dims[d]) delete draft.dims[d]; else draft.dims[d] = { tags: [], severity: 2 };
    } else if (r === 'sev') draft.dims[el.dataset.d].severity = Number(el.dataset.v);
    else if (r === 'tag') {
      const arr = draft.dims[el.dataset.d].tags;
      const i = arr.indexOf(el.dataset.v);
      if (i >= 0) arr.splice(i, 1); else arr.push(el.dataset.v);
    } else if (r === 'prev') draft.step--;
    else if (r === 'next') {
      if (draft.step < 3) draft.step++;
      else return submitReport();
    } else return;
    drawReport();
  });

  // Typing must not re-render (it would break Chinese IME composition) — just refresh the hint and button.
  modal.addEventListener('input', (e) => {
    const r = e.target.dataset.r;
    if (!draft || !['text', 'suggest'].includes(r)) return;
    draft[r] = e.target.value;
    const issue = toneIssue(draft.text + draft.suggest);
    const row = modal.querySelector('.say-row');
    row.innerHTML = `${mascot(issue ? 'worried' : 'calm', 44)}<p class="say">${esc(issue || CALM_TIP)}</p>`;
    row.classList.toggle('warn', !!issue);
    modal.querySelector('[data-r="next"]').disabled = !(draft.text.trim().length >= 6 && draft.suggest.trim().length >= 4 && !issue);
  });
  modal.addEventListener('change', (e) => {
    if (draft && e.target.dataset.r === 'private') draft.private = e.target.checked;
  });

  function submitReport() {
    const now = Date.now();
    const name = store.me.name || L('你', 'You');
    for (const [dim, v] of Object.entries(draft.dims)) {
      store.reports.push({
        id: 'm' + now.toString(36) + dim, placeId: draft.placeId, user: name, mine: true, dim, tags: v.tags,
        severity: v.severity, text: draft.text.trim(), suggest: draft.suggest.trim(), at: now, agree: 0,
        privateUntil: draft.private ? now + 72 * 36e5 : null,
      });
    }
    const p = byId(draft.placeId);
    addPoints(15, L(`回報「${p.name}」`, `Reported “${p.name}”`));
    draft = null;
    closeModal();
    render();
    toast(L('+15 點！謝謝你用溫柔的方式打雷 ⚡', '+15 points! Thanks for thundering gently ⚡'));
  }

  // ── Owner flow ────────────────────────────────────────────────
  function ownerModal(id) {
    const p = byId(id);
    const st = placeStats(p);
    const reply = store.replies[id] || { text: '', dims: [] };
    openModal(`
      <div class="r-head"><div><small>${L('店家模式（示範）', 'Owner mode (demo)')}</small><h2>${esc(p.name)}</h2></div><button class="x" data-r="o-close" aria-label="${L('關閉', 'Close')}">✕</button></div>
      <div class="say-row boxed">${mascot('happy', 44)}<p class="say">${L('謝謝你願意來看。回應會放在所有評論最上面；改善後 3 位客人確認，舊的雷就會消散。', 'Thanks for checking in. Your reply goes above every review; once 3 customers confirm an improvement, the old warnings fade.')}</p></div>
      <div class="r-body">
        <label class="field"><span>${L('公開回應', 'Public reply')}</span>
          <textarea id="oText" rows="3" maxlength="200" placeholder="${L('例：謝謝大家提醒！我們已經開放線上候位，現場也會告知等候時間。', 'e.g. Thanks for the heads-up! We now have an online waitlist and tell people the wait time at the door.')}">${esc(reply.text)}</textarea></label>
        <div class="field"><span>${L('已經改善的部分（會請客人確認）', "What you've improved (customers will be asked to confirm)")}</span>
          <div class="tags">${st.dims.filter((d) => d.n).map((d) => `
            <label class="tag chk"><input type="checkbox" value="${d.dim}" ${reply.dims.includes(d.dim) ? 'checked' : ''}>${DIMS[d.dim].label}</label>`).join('') || `<small>${L('目前沒有需要改善的地方 🎉', 'Nothing to improve right now 🎉')}</small>`}</div></div>
        <p class="fine">${L('正式版會驗證店家身分（營業登記＋電話驗證），這裡先開放給你試玩。', 'The real version would verify owners (business registration + phone). Here anyone can try it.')}</p>
      </div>
      <div class="r-foot"><span></span><button class="btn primary" data-r="o-save" data-id="${id}">${L('發布回應', 'Post reply')}</button></div>`);
  }

  modal.addEventListener('click', (e) => {
    const el = e.target.closest('[data-r^="o-"]');
    if (!el) return;
    if (el.dataset.r === 'o-close') return closeModal();
    const text = $('#oText').value.trim();
    const dims = [...modal.querySelectorAll('.chk input:checked')].map((x) => x.value);
    if (!text) return toast(L('寫一句回應再發布吧', 'Write a reply first'), 'worried');
    store.replies[el.dataset.id] = { text, dims, at: Date.now() };
    save(); closeModal(); render();
    toast(L('回應已發布，會顯示在評論最上面', 'Reply posted — it shows above all reviews'));
  });

  // ── Add / import ──────────────────────────────────────────────
  function addModal() {
    openModal(`
      <div class="r-head"><div><small>${L('新增店家', 'Add a place')}</small><h2>${L('地圖上沒有這家？', 'Not on the map?')}</h2></div><button class="x" data-r="i-close" aria-label="${L('關閉', 'Close')}">✕</button></div>
      <div class="r-body">
        <div class="imp-opt">
          <b>${L('1. 貼上 Google 地圖連結', '1. Paste a Google Maps link')}</b>
          <p>${L('在 Google 地圖打開那家店 →「分享」→ 複製連結貼上。短網址（maps.app.goo.gl）要先在瀏覽器打開一次，再複製網址列的長網址。', 'Open the place in Google Maps → Share → copy the link. Short links (maps.app.goo.gl) need opening in a browser first; then copy the long URL from the address bar.')}</p>
          <div class="row"><input id="gmLink" placeholder="https://www.google.com/maps/place/…/@25.04,121.54,…"><button class="btn primary" data-r="i-link">${L('加入', 'Add')}</button></div>
        </div>
        <div class="imp-opt">
          <b>${L('2. 手動新增（放在地圖目前中心）', '2. Add by hand (placed at the map center)')}</b>
          <div class="row"><input id="mName" placeholder="${L('店名', 'Name')}" maxlength="30"><input id="mCuisine" placeholder="${L('料理類型', 'Cuisine')}" maxlength="16" class="short"><button class="btn ghost" data-r="i-manual">${L('加入', 'Add')}</button></div>
        </div>
        <div class="imp-opt">
          <b>${L('3. 匯入 Google 負評（進階）', '3. Import bad Google reviews (advanced)')}</b>
          <p>${L('填 Google Places API 金鑰與店名，只抓 1–2 星的評論，自動分到五個向度。僅供測試，正式上線需遵守 Google 條款（標示來源、不長期儲存）。', 'Enter a Google Places API key and a place name; only 1–2 star reviews are fetched and sorted into the five aspects. For testing only — a real launch must follow Google\'s terms (attribution, no long-term storage).')}</p>
          <div class="row"><input id="gKey" type="password" placeholder="${L('Places API 金鑰', 'Places API key')}" value="${esc(store.googleKey)}" class="short"><input id="gQuery" placeholder="${L('例：台北 霧島拉麵', 'e.g. Taipei ramen Daan')}"><button class="btn ghost" data-r="i-google">${L('搜尋', 'Search')}</button></div>
        </div>
      </div>`);
  }

  function addPlace(p) {
    store.imported.push(p);
    save();
    closeModal();
    openPlace(p.id);
  }

  function parseGoogleLink(url) {
    try { url = decodeURIComponent(url); } catch { /* keep raw */ }
    const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    const name = (url.match(/\/place\/([^/@]+)/) || [])[1];
    if (!at) return null;
    return { lat: +at[1], lng: +at[2], name: name ? name.replace(/\+/g, ' ') : '' };
  }

  // Sort Google review text into our five dimensions with simple keywords.
  const KW = {
    food: ['鹹', '油', '難吃', '味道', '不新鮮', '冷掉', '份量', '腥', '拉肚子', 'salty', 'bland', 'cold', 'stale', 'taste', 'portion', 'food'],
    service: ['態度', '服務', '店員', '老闆', '慢', '催', '不理', 'rude', 'service', 'staff', 'slow', 'waiter', 'ignored'],
    space: ['吵', '髒', '擠', '冷氣', '熱', '廁所', '蟲', '環境', 'noisy', 'dirty', 'crowded', 'toilet', 'hot'],
    access: ['停車', '排隊', '找不到', '捷運', '訂位', 'parking', 'queue', 'line', 'wait', 'reservation'],
    price: ['貴', '價格', '服務費', 'CP', '低消', 'expensive', 'price', 'overpriced', 'charge'],
  };
  const classify = (text) => DIM_KEYS.filter((d) => KW[d].some((k) => text.toLowerCase().includes(k.toLowerCase()))).slice(0, 2);

  async function googleImport() {
    const key = $('#gKey').value.trim();
    const q = $('#gQuery').value.trim();
    if (!key || !q) return toast(L('金鑰和店名都要填喔', 'Fill in both the key and the place name'), 'worried');
    store.googleKey = key; save();
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.reviews,places.primaryTypeDisplayName',
        },
        body: JSON.stringify({ textQuery: q, languageCode: EN ? 'en' : 'zh-TW', maxResultCount: 1 }),
      });
      if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 120));
      const place = (await res.json()).places?.[0];
      if (!place) return toast(L('找不到這家店', "Couldn't find that place"), 'worried');
      const bad = (place.reviews || []).filter((r) => r.rating <= 2);
      const reviews = bad.flatMap((r, i) => {
        const text = r.text?.text || r.originalText?.text || '';
        const dims = classify(text);
        return (dims.length ? dims : ['food']).map((dim) => ({
          id: `g-${place.id}-${i}-${dim}`, user: r.authorAttribution?.displayName || L('Google 使用者', 'Google user'), dim,
          tags: [], severity: r.rating === 1 ? 3 : 2, text: text.slice(0, 200), suggest: '',
          at: Date.parse(r.publishTime) || Date.now(), agree: 0, source: 'google',
        }));
      });
      addPlace({
        id: 'g' + place.id, source: 'google', name: place.displayName?.text || q,
        cuisine: place.primaryTypeDisplayName?.text || '', area: (place.formattedAddress || '').slice(0, 12),
        lat: place.location.latitude, lng: place.location.longitude, reviews, improvements: [],
      });
      toast(L(`匯入 ${bad.length} 則 1–2 星評論（Google 最多回傳 5 則）`, `Imported ${bad.length} 1–2 star reviews (Google returns at most 5)`));
    } catch (err) {
      toast(L('Google 匯入失敗：', 'Google import failed: ') + esc(String(err.message || err).slice(0, 80)), 'worried');
    }
  }

  modal.addEventListener('click', (e) => {
    const el = e.target.closest('[data-r^="i-"]');
    if (!el) return;
    const r = el.dataset.r;
    if (r === 'i-close') return closeModal();
    if (r === 'i-link') {
      const g = parseGoogleLink($('#gmLink').value.trim());
      if (!g) return toast(L('這個連結裡找不到座標，試試長網址', 'No coordinates in that link — try the long URL'), 'worried');
      const name = g.name || prompt(L('這家店叫什麼名字？', "What's the place called?")) || '';
      if (!name) return;
      addPlace({ id: 'u' + Date.now().toString(36), source: 'manual', name, cuisine: '', area: '', lat: g.lat, lng: g.lng, reviews: [], improvements: [] });
      addPoints(5, L(`新增「${name}」`, `Added “${name}”`));
    }
    if (r === 'i-manual') {
      const name = $('#mName').value.trim();
      if (!name) return toast(L('店名要填喔', 'Fill in the name'), 'worried');
      const c = map.getCenter();
      addPlace({ id: 'u' + Date.now().toString(36), source: 'manual', name, cuisine: $('#mCuisine').value.trim(), area: '', lat: c.lat, lng: c.lng, reviews: [], improvements: [] });
      addPoints(5, L(`新增「${name}」`, `Added “${name}”`));
    }
    if (r === 'i-google') googleImport();
  });

  // ── Fairness explainer ────────────────────────────────────────
  function fairModal() {
    const items = EN ? [
      ['Aspects, no overall score', '“Hard to get to” isn\'t “bad food”. The map never says “awful place” — only which aspect to watch out for.'],
      ['Three makes it count', 'An aspect only counts after 3 different people report it. Before that it shows as “unconfirmed”, so one grudge can\'t sink a shop.'],
      ['Every report needs a suggestion', 'Each report includes “I wish the owner would…”. Complaints become a to-do list.'],
      ['Owners see it first for 72 hours', 'By default a report goes to the owner first, giving them a chance to fix things before it\'s public.'],
      ['Warnings fade', 'Reports lose half their weight after 6 months and archive after a year. Places change; so should their reputation.'],
      ['Fixing it clears it', 'Owner replies sit on top; once 3 customers confirm an improvement, old warnings barely count. Confirming earns more points than complaining.'],
      ['About what happened, not who', 'Swearing or personal attacks? Lei asks you to rephrase before you can send.'],
    ] : [
      ['分向度，沒有總分', '「交通不方便」不等於「難吃」。地圖上不會出現「爛店」，只會說哪個方面要注意。'],
      ['三人成雷', '同一個向度要 3 個不同的人回報才算數，之前只顯示「待確認」，避免一個人的私怨。'],
      ['一定要附建議', '每則回報都要寫一句「希望店家可以…」。抱怨變成改善清單。'],
      ['先讓店家看 72 小時', '預設回報先只給店家看，給他們先處理的機會，時間到才公開。'],
      ['雷會消散', '回報 6 個月後影響力減半，一年後自動封存。店會變，評價也該跟著變。'],
      ['改善就洗白', '店家回應會放最上面；改善後有 3 位客人確認，舊的雷只剩一點點影響。確認改善的人得到的點數比抱怨還多。'],
      ['對事不對人', '偵測到髒話或人身攻擊，阿雷會請你換個說法才能送出。'],
    ];
    openModal(`
      <div class="r-head"><div><small>${L('我們的原則', 'Our principles')}</small><h2>${L('避雷，但不害人倒店', 'Warn people, without sinking shops')}</h2></div><button class="x" data-r="i-close" aria-label="${L('關閉', 'Close')}">✕</button></div>
      <div class="say-row boxed">${mascot('happy', 44)}<p class="say">${L('我是阿雷。我打雷是為了提醒，不是為了劈人。', "I'm Lei. I thunder to warn, not to strike.")}</p></div>
      <ol class="fair">${items.map(([h, p], i) => `<li><span>${i + 1}</span><div><b>${h}</b><p>${p}</p></div></li>`).join('')}</ol>`);
  }

  // ── Global events ─────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || modal.contains(el)) return;
    const act = el.dataset.act;
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
    if (act === 'official') {
      navigator.clipboard?.writeText(el.dataset.name).catch(() => {});
      toast(L('店名已複製，貼到 iMAP 的搜尋欄就能查', 'Name copied — paste it into the iMAP search box'), 'calm');
      return;
    }
    if (act !== 'owner' && act !== 'report' && el.tagName === 'A') e.preventDefault();
    switch (act) {
      case 'home': case 'back':
        ui.view = 'list'; ui.id = null; render(); break;
      case 'dim': ui.dim = el.dataset.v; render(); break;
      case 'open': openPlace(el.dataset.id); break;
      case 'me': ui.view = 'me'; render(); document.body.classList.add('show-panel'); break;
      case 'fair': fairModal(); break;
      case 'lang': switchLang(); break;
      case 'add': addModal(); break;
      case 'mode':
        if (ui.mode === el.dataset.v) break;
        ui.mode = el.dataset.v; ui.view = 'list'; ui.id = null;
        if (ui.mode === 'demo') map.setView([25.045, 121.535], 13); else map.setView([25.0418, 121.5440], 16);
        render();
        break;
      case 'report': startReport(el.dataset.id); break;
      case 'owner': ownerModal(el.dataset.id); break;
      case 'agree':
        if (store.agreed[el.dataset.rid]) delete store.agreed[el.dataset.rid]; else store.agreed[el.dataset.rid] = true;
        save(); render(); break;
      case 'confirm': {
        const k = el.dataset.id + ':' + el.dataset.dim;
        store.confirms[k] = { at: Date.now() };
        addPoints(8, L(`確認「${byId(el.dataset.id).name}」的${DIMS[el.dataset.dim].label}改善了`, `Confirmed “${byId(el.dataset.id).name}” improved its ${DIMS[el.dataset.dim].label.toLowerCase()}`));
        render();
        toast(L('+8 點！謝謝你幫店家說句公道話', '+8 points! Thanks for being fair to the owner'));
        break;
      }
      case 'publish': {
        const r = store.reports.find((x) => x.id === el.dataset.rid);
        if (r) { r.privateUntil = null; save(); render(); toast(L('已公開', 'Published')); }
        break;
      }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[role=button][data-act]')) e.target.click();
  });
  panel.addEventListener('change', (e) => {
    const act = e.target.dataset.act;
    if (act === 'sort') { ui.sort = e.target.value; render(); }
    if (act === 'pending') { ui.pending = e.target.checked; render(); }
    if (act === 'name') { store.me.name = e.target.value.trim(); save(); }
  });
  let qT;
  $('#q').addEventListener('input', (e) => {
    clearTimeout(qT);
    qT = setTimeout(() => { ui.q = e.target.value; ui.view = 'list'; render(); }, 150);
  });
  let moveT;
  map.on('moveend', () => {
    if (ui.mode !== 'real' || ui.view !== 'list' || ui.q) return;
    clearTimeout(moveT);
    moveT = setTimeout(render, 150);
  });
  map.on('click', () => { if (ui.view === 'detail') { ui.view = 'list'; ui.id = null; render(); } });
  addEventListener('resize', () => map.invalidateSize());

  $('#brandMark').innerHTML = mascot('calm', 34);
  renderMeChip();
  render();
})();
