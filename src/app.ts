import '../css/style.css';

const API_BASE = 'https://www.eporner.com/api/v2/video';
const PER_PAGE = 30;
const AD_LINK = 'https://omg10.com/4/9060184';

const CATEGORIES = [
  'all', 'anal', 'teen', 'pov', 'threesome', 'japanese', 'lesbian', 'asian',
  'mature', 'milf', 'big-tits', 'hardcore', 'amateur', 'ebony', 'latina',
  'redhead', 'blonde', 'shemale', 'hentai', 'vr-porn', 'homemade', 'cartoon',
  'gangbang', 'creampie', 'public', 'casting', 'british', 'indian', 'babe',
  'massage', 'fetish', 'squirt', 'double-penetration', 'interracial',
] as const;

const ORDERS: { value: string; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'most-popular', label: 'Most Popular' },
  { value: 'top-weekly', label: 'Trending' },
  { value: 'top-monthly', label: 'Top Monthly' },
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'longest', label: 'Longest' },
  { value: 'shortest', label: 'Shortest' },
];

interface HistoryEntry {
  id: string;
  title: string;
  time: number;
}

interface AppState {
  query: string;
  page: number;
  order: string;
  thumbsize: string;
  gay: string;
  lq: string;
  totalPages: number;
  totalCount: number;
  panic: boolean;
  history: HistoryEntry[];
}

const state: AppState = {
  query: 'all',
  page: 1,
  order: 'latest',
  thumbsize: 'big',
  gay: '0',
  lq: '0',
  totalPages: 1,
  totalCount: 0,
  panic: false,
  history: JSON.parse(localStorage.getItem('ih_history') || '[]'),
};

interface ThumbInfo {
  src: string;
  width: number;
  height: number;
  size: number;
}

interface VideoItem {
  id: string;
  title: string;
  views: number;
  rate: string;
  added: string;
  length_sec: number;
  length_min: string;
  default_thumb: ThumbInfo | null;
  thumbs: ThumbInfo[];
  embed: string;
  keywords: string;
  url: string;
}

interface SearchResponse {
  videos: VideoItem[];
  total_count: number;
  total_pages: number;
  page: number;
}

interface VideoByIdResponse {
  id: string;
  title: string;
  views: number;
  rate: string;
  added: string;
  length_sec: number;
  length_min: string;
  default_thumb: ThumbInfo | null;
  thumbs: ThumbInfo[];
  embed: string;
  keywords: string;
  url: string;
}

const app = document.getElementById('app') as HTMLDivElement;
const searchForm = document.getElementById('searchForm') as HTMLFormElement;
const orderSelect = document.getElementById('orderSelect') as HTMLSelectElement;
const thumbsizeSelect = document.getElementById('thumbsizeSelect') as HTMLSelectElement;
const panicOverlay = document.getElementById('panicOverlay') as HTMLDivElement;

function adRedirect(): false {
  window.open(AD_LINK, '_blank');
  return false;
}

function adPopup(): void {
  try {
    const w = window.open(AD_LINK, '_blank', 'width=800,height=600');
    if (!w) window.location.href = AD_LINK;
  } catch {}
}

function skeletonGrid(): string {
  const n = 12;
  let html = '<div class="skeleton-grid">';
  for (let i = 0; i < n; i++) {
    html += `<div class="skeleton-card">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>`;
  }
  html += '</div>';
  return html;
}

function showLoading(): void {
  app.innerHTML = '<div class="main"><div class="section-header"><h2>Loading...</h2></div>' + skeletonGrid() + '</div>';
}

function esc(str: string): string {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function fmtNum(n: number): string {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M'
    : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K'
    : String(n);
}

function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function dateAgo(s: string): string {
  const d = new Date(s.replace(' ', 'T'));
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString();
}

function addHistory(id: string, title: string): void {
  state.history = state.history.filter(h => h.id !== id);
  state.history.unshift({ id, title, time: Date.now() });
  if (state.history.length > 50) state.history = state.history.slice(0, 50);
  localStorage.setItem('ih_history', JSON.stringify(state.history));
}

async function api<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }
  qs.set('format', 'json');
  const url = `${API_BASE}/${endpoint}/?${qs}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json() as T;
  } catch { return null; }
}

async function searchVideos(
  q: string, page: number, order: string, thumbsize: string, gay: string, lq: string
): Promise<SearchResponse | null> {
  return api<SearchResponse>('search', {
    query: q || 'all',
    page: page || 1,
    per_page: PER_PAGE,
    order: order || 'latest',
    thumbsize: thumbsize || 'big',
    gay: gay || '0',
    lq: lq || '0',
  });
}

async function getVideo(id: string, thumbsize: string): Promise<VideoByIdResponse | null> {
  return api<VideoByIdResponse>('id', { id, thumbsize: thumbsize || 'big' });
}

function updateSEO(opts: { title?: string; description?: string; url?: string; image?: string } = {}): void {
  const baseTitle = 'IndoHamster';
  const baseDesc = 'Watch free HD porn videos in 4K. Huge collection of xxx adult entertainment, amateur, anal, teen, MILF and more. Daily updates, fast streaming.';
  const baseUrl = 'https://indohamster.com/';
  const baseImg = 'https://indohamster.com/og-image.jpg';

  const title = opts.title ? `${opts.title} - ${baseTitle}` : `${baseTitle} - Free HD Porn Videos, XXX Tube & Adult Entertainment`;
  const desc = opts.description || baseDesc;
  const url = opts.url || baseUrl;
  const img = opts.image || baseImg;

  document.title = title;
  setMeta('description', desc);
  setMeta('og:title', title);
  setMeta('og:description', desc);
  setMeta('og:url', url);
  setMeta('og:image', img);
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', img);
}

function setMeta(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function router(): void {
  const hash = location.hash.slice(1) || '/';

  if (hash === '/') { renderHome(); return; }
  if (hash.startsWith('/search')) {
    const p = new URLSearchParams(hash.split('?')[1] || '');
    state.query = p.get('q') || 'all';
    state.page = parseInt(p.get('page') || '1') || 1;
    state.order = p.get('order') || orderSelect.value;
    state.thumbsize = p.get('thumbsize') || thumbsizeSelect.value;
    state.gay = p.get('gay') || '0';
    state.lq = p.get('lq') || '0';
    showLoading();
    loadGrid();
    return;
  }
  if (hash.startsWith('/video/')) {
    const id = hash.split('/video/')[1].split('?')[0];
    showLoading();
    renderDetail(id);
    return;
  }
  renderHome();
}

window.addEventListener('hashchange', router);

function renderHome(): void {
  state.query = 'all';
  state.page = 1;
  showLoading();
  loadGrid();
}

function renderTabsHtml(active: string): string {
  const tabs = ['latest', 'most-popular', 'top-weekly', 'top-monthly', 'top-rated'];
  const labels: Record<string, string> = { latest: 'Latest', 'most-popular': 'Most Popular', 'top-weekly': 'Trending', 'top-monthly': 'Top Monthly', 'top-rated': 'Top Rated' };
  let html = '<div class="tabs">';
  tabs.forEach(t => {
    html += `<button class="tab-btn${t === active ? ' active' : ''}" data-tab="${t}">${labels[t] || t}</button>`;
  });
  html += '</div>';
  return html;
}

function renderCatsHtml(active: string): string {
  let html = '<div class="categories">';
  CATEGORIES.forEach(c => {
    const label = c === 'all' ? 'All' : c.replace(/-/g, ' ');
    html += `<button class="category-btn${c === active ? ' active' : ''}" data-cat="${c}">${label}</button>`;
  });
  html += '</div>';
  return html;
}

function attachClickHandlers(): void {
  app.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.order = (btn as HTMLButtonElement).dataset.tab!;
      state.page = 1;
      const p = new URLSearchParams({ q: state.query, order: state.order, thumbsize: state.thumbsize, gay: state.gay, lq: state.lq });
      location.hash = `#/search?${p}`;
    });
  });

  app.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.query = (btn as HTMLButtonElement).dataset.cat!;
      state.page = 1;
      const p = new URLSearchParams({ q: state.query, order: state.order, thumbsize: state.thumbsize, gay: state.gay, lq: state.lq });
      location.hash = `#/search?${p}`;
    });
  });
}

async function loadGrid(): Promise<void> {
  const data = await searchVideos(state.query, state.page, state.order, state.thumbsize, state.gay, state.lq);
  if (!data || !data.videos) {
    app.innerHTML = '<div class="error-msg"><h3>Failed to load videos</h3><p>Try again later.</p></div>';
    return;
  }

  state.totalPages = data.total_pages;
  state.totalCount = data.total_count;
  const title = state.query === 'all' ? 'All Videos' : esc(state.query);

  const keywordDesc = state.query === 'all'
    ? 'Browse the latest HD porn videos on IndoHamster. Free xxx tube with daily updates.'
    : `Watch free ${esc(state.query)} porn videos. HD xxx tube with ${state.query} category, amateur, anal, teen and more.`;
  const orderLabel = ORDERS.find(o => o.value === state.order)?.label || state.order;
  updateSEO({
    title: `${title} - ${orderLabel} Porn Videos`,
    description: keywordDesc,
    url: location.href,
  });

  let html = renderTabsHtml(state.order);
  html += renderCatsHtml(state.query);
  html += `<div class="section-header"><h2>${title}</h2><span class="count">${fmtNum(state.totalCount)} videos</span></div>`;

  const gridId = 'videoGrid_' + Date.now();
  html += `<div class="video-grid" id="${gridId}">`;
  html += data.videos.map((v, i) => {
    if (i > 0 && i % 8 === 0) return renderCard(v) + renderCard(null, true);
    return renderCard(v);
  }).join('');
  html += '</div>';

  html += renderPagination();

  app.innerHTML = html;
  attachClickHandlers();
  attachCardClicks('#' + gridId);
  attachPagination();

  document.querySelectorAll('.video-card').forEach(card => {
    const hover = card.querySelector('.hover-gif') as HTMLImageElement | null;
    if (hover && hover.dataset.src) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { hover.src = hover.dataset.src!; obs.unobserve(hover); }
        });
      });
      obs.observe(hover);
    }
  });
}

function renderCard(v: VideoItem | null, isSponsored?: boolean): string {
  if (isSponsored) {
    return `
      <div class="video-card sponsored" onclick="adRedirect()">
        <div class="thumb-wrap">
          <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a237e,#4a148c);display:flex;justify-content:center;align-items:center;font-size:40px;">🔞</div>
          <span class="duration">VIP</span>
          <span class="sponsored-badge">AD</span>
        </div>
        <div class="card-body">
          <div class="card-title" style="color:#ff9800">✨ Premium Video - Watch Full HD</div>
          <div class="card-meta">
            <span>👁 2.5M</span>
            <span class="rate">★ 4.9</span>
          </div>
        </div>
      </div>
    `;
  }

  if (!v) return '';

  const thumb = v.default_thumb?.src ? esc(v.default_thumb.src) : '';
  const hoverSrc = v.thumbs?.[3]?.src || v.thumbs?.[0]?.src || thumb;
  const title = esc(v.title);
  const dur = v.length_min || fmtDur(v.length_sec);
  const views = fmtNum(v.views);
  const rate = v.rate || '-';
  const id = esc(v.id);

  return `
    <div class="video-card" data-id="${id}">
      <div class="thumb-wrap">
        <img src="${thumb}" alt="${title}" loading="lazy">
        <img class="hover-gif" data-src="${esc(hoverSrc)}" alt="" loading="lazy">
        <span class="duration">${dur}</span>
        <span class="hd-badge">HD</span>
      </div>
      <div class="card-body">
        <div class="card-title">${title}</div>
        <div class="card-meta">
          <span>👁 ${views}</span>
          <span class="rate">★ ${rate}</span>
        </div>
      </div>
    </div>
  `;
}

function attachCardClicks(containerSelector: string): void {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = (card as HTMLElement).dataset.id;
      if (id) location.hash = `#/video/${id}`;
    });
  });
}

function renderPagination(): string {
  const p = state.page;
  const t = state.totalPages;
  const maxPage = Math.min(t, 1000);
  return `
    <div class="pagination">
      <button class="first-btn" ${p <= 1 ? 'disabled' : ''}>⏪</button>
      <button class="prev-btn" ${p <= 1 ? 'disabled' : ''}>← Prev</button>
      <span class="page-info">Page ${p} of ${maxPage}</span>
      <button class="next-btn" ${p >= maxPage ? 'disabled' : ''}>Next →</button>
      <button class="last-btn" ${p >= maxPage ? 'disabled' : ''}>⏩</button>
    </div>
  `;
}

function attachPagination(): void {
  const go = (n: number) => {
    state.page = n;
    const p = new URLSearchParams({ q: state.query, page: String(state.page), order: state.order, thumbsize: state.thumbsize, gay: state.gay, lq: state.lq });
    location.hash = `#/search?${p}`;
  };

  app.querySelector('.first-btn')?.addEventListener('click', () => go(1));
  app.querySelector('.prev-btn')?.addEventListener('click', () => { if (state.page > 1) go(state.page - 1); });
  app.querySelector('.next-btn')?.addEventListener('click', () => { if (state.page < state.totalPages) go(state.page + 1); });
  app.querySelector('.last-btn')?.addEventListener('click', () => go(Math.min(state.totalPages, 1000)));
}

function showDetailSkeleton(): void {
  app.innerHTML = `<div class="video-detail">
    <div class="main-content">
      <div class="skeleton-card" style="aspect-ratio:16/9;border-radius:var(--radius);margin-bottom:20px">
        <div class="skeleton-thumb" style="height:100%"></div>
      </div>
      <div class="skeleton-card" style="padding:16px;border-radius:var(--radius)">
        <div class="skeleton-line" style="height:24px;width:70%;margin-bottom:12px"></div>
        <div class="skeleton-line" style="height:14px;width:40%;margin-bottom:16px"></div>
        <div class="skeleton-line" style="height:14px;width:90%"></div>
        <div class="skeleton-line" style="height:14px;width:60%"></div>
      </div>
    </div>
    <div class="sidebar">
      <div class="skeleton-card" style="padding:12px;border-radius:var(--radius)">
        <div class="skeleton-line" style="height:18px;width:50%;margin-bottom:12px"></div>
        ${Array(5).fill('<div class="skeleton-card" style="display:flex;gap:10px;padding:8px;border-radius:var(--radius-sm);margin-bottom:8px"><div class="skeleton-thumb" style="width:120px;aspect-ratio:16/9;flex-shrink:0;border-radius:4px"></div><div style="flex:1"><div class="skeleton-line" style="height:12px;width:90%"></div><div class="skeleton-line" style="height:12px;width:50%;margin-top:6px"></div></div></div>').join('')}
      </div>
    </div>
  </div>`;
}

async function renderDetail(id: string): Promise<void> {
  showDetailSkeleton();
  const data = await getVideo(id, 'big');
  if (!data || !data.id) {
    app.innerHTML = '<div class="error-msg"><h3>Video not found or removed</h3><p><a href="#/">← Back to home</a></p></div>';
    return;
  }

  addHistory(data.id, data.title);

  const v = data;
  const title = esc(v.title);
  updateSEO({
    title: title,
    description: `Watch ${title} free on IndoHamster. ${v.views}+ views, rating ${v.rate}. HD porn video in full length.`,
    url: location.href,
    image: v.default_thumb?.src || '',
  });

  const views = fmtNum(v.views);
  const rate = v.rate || '-';
  const added = dateAgo(v.added);
  const dur = v.length_min || fmtDur(v.length_sec);
  const embedSrc = v.embed ? esc(v.embed) : '';
  const kwRaw = v.keywords || '';
  const keywords = kwRaw.split(',').map(k => esc(k.trim())).filter(Boolean);

  const relatedQ = keywords[0] || 'all';
  const related = await searchVideos(relatedQ, 1, 'top-weekly', 'medium', '0', '0');
  const relatedVids = related?.videos?.slice(0, 12) || [];

  let html = '<div class="video-detail"><div class="main-content">';
  html += `<div class="player-wrap ad-player">`;
  html += `<iframe src="${embedSrc}" allowfullscreen loading="lazy"></iframe>`;
  html += `<div class="player-ad-overlay" onclick="this.classList.add('clicked'); adRedirect();"><span>▶ Play</span></div>`;
  html += `</div>`;
  html += '<div class="video-info">';
  html += `<h1>${title}</h1>`;
  html += `<div class="video-stats">
    <span>👁 ${views} views</span>
    <span class="rate">★ ${rate}</span>
    <span>⏱ ${dur}</span>
    <span>📅 ${added}</span>
    <span>🆔 ${esc(v.id)}</span>
  </div>`;
  html += `<div class="ad-action-bar">
    <button class="ad-btn download-btn" onclick="adRedirect()">⬇ Download HD</button>
    <button class="ad-btn next-btn" onclick="adRedirect()">⏭ Next Video</button>
    <button class="ad-btn hd-btn" onclick="adRedirect()">⚙ 4K Quality</button>
  </div>`;

  if (keywords.length) {
    html += '<div class="keywords">';
    html += keywords.map(k =>
      `<a href="#/search?q=${encodeURIComponent(k.replace(/&amp;/g, '&'))}">${k}</a>`
    ).join('');
    html += '</div>';
  }

  html += '</div></div>';

  html += '<div class="sidebar">';
  html += '<h3>Related Videos</h3>';
  if (relatedVids.length) {
    html += '<div class="video-grid" style="grid-template-columns:1fr">';
    html += relatedVids.map(rv => renderCard(rv)).join('');
    html += '</div>';
  } else {
    html += '<p class="empty-state">No related videos found</p>';
  }
  html += '</div></div>';

  app.innerHTML = html;
  attachCardClicks('.sidebar');

  window.scrollTo(0, 0);
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = searchForm.q as HTMLInputElement;
  const q = input.value.trim();
  state.query = q || 'all';
  state.page = 1;
  const p = new URLSearchParams({ q: state.query, order: orderSelect.value, thumbsize: thumbsizeSelect.value, gay: state.gay, lq: state.lq });
  location.hash = `#/search?${p}`;
});

orderSelect.addEventListener('change', () => {
  state.order = orderSelect.value;
  state.page = 1;
  const p = new URLSearchParams({ q: state.query, order: state.order, thumbsize: thumbsizeSelect.value, gay: state.gay, lq: state.lq });
  location.hash = `#/search?${p}`;
});

thumbsizeSelect.addEventListener('change', () => {
  state.thumbsize = thumbsizeSelect.value;
  router();
});

function buildFiltersUI(): void {
  const header = document.querySelector('.header') as HTMLElement;
  const extraFilters = document.createElement('div');
  extraFilters.className = 'header-filters extra-filters';
  extraFilters.style.cssText = 'margin-left:auto';

  const gaySelect = document.createElement('select');
  gaySelect.id = 'gaySelect';
  gaySelect.innerHTML = '<option value="0">Straight</option><option value="1">Gay + Straight</option><option value="2">Gay Only</option>';
  gaySelect.value = state.gay;
  gaySelect.addEventListener('change', () => {
    state.gay = gaySelect.value;
    state.page = 1;
    const p = new URLSearchParams({ q: state.query, order: state.order, thumbsize: thumbsizeSelect.value, gay: state.gay, lq: state.lq });
    location.hash = `#/search?${p}`;
  });
  extraFilters.appendChild(gaySelect);

  const lqSelect = document.createElement('select');
  lqSelect.id = 'lqSelect';
  lqSelect.innerHTML = '<option value="0">HD Only</option><option value="1">All Quality</option><option value="2">Low Quality Only</option>';
  lqSelect.value = state.lq;
  lqSelect.addEventListener('change', () => {
    state.lq = lqSelect.value;
    state.page = 1;
    const p = new URLSearchParams({ q: state.query, order: state.order, thumbsize: thumbsizeSelect.value, gay: state.gay, lq: state.lq });
    location.hash = `#/search?${p}`;
  });
  extraFilters.appendChild(lqSelect);

  const randBtn = document.createElement('button');
  randBtn.textContent = '🎲 Random';
  randBtn.className = 'random-btn';
  randBtn.addEventListener('click', async () => {
    const data = await searchVideos('all', 1, 'latest', 'medium', '0', '0');
    if (data && data.total_count) {
      const maxP = Math.min(data.total_pages, 1000);
      const randP = Math.floor(Math.random() * maxP) + 1;
      const randData = await searchVideos('all', randP, 'latest', 'medium', '0', '0');
      if (randData?.videos?.length) {
        const v = randData.videos[Math.floor(Math.random() * randData.videos.length)];
        location.hash = `#/video/${v.id}`;
      }
    }
  });
  extraFilters.appendChild(randBtn);

  header.appendChild(extraFilters);
}

document.addEventListener('click', function popOnce() {
  if (location.hash.startsWith('#/video/')) {
    adPopup();
  }
  document.removeEventListener('click', popOnce);
}, { once: true });

let visitCount = parseInt(sessionStorage.getItem('ih_visits') || '0', 10) + 1;
sessionStorage.setItem('ih_visits', String(visitCount));
if (visitCount % 3 === 0) {
  setTimeout(adPopup, 2000);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    state.panic = !state.panic;
    panicOverlay.classList.toggle('show', state.panic);
    return;
  }
  if (state.panic) return;
  if (document.activeElement?.tagName !== 'INPUT') {
    if (e.key === 'f' || e.key === 'F') {
      const iframe = document.querySelector('.player-wrap iframe') as HTMLIFrameElement | null;
      if (iframe) {
        try { iframe.contentWindow?.postMessage('{"event":"command","func":"toggleFullscreen","args":""}', '*'); } catch {}
      }
    }
  }
});

panicOverlay.addEventListener('click', () => {
  state.panic = false;
  panicOverlay.classList.remove('show');
});

buildFiltersUI();
router();
