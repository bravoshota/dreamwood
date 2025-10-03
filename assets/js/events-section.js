(function () {
  const GRID = document.getElementById('evGrid');
  const DOTS = document.getElementById('evDots');
  const BTN_PREV = document.getElementById('evPrev');
  const BTN_NEXT = document.getElementById('evNext');
  const TAB_UP = document.getElementById('evTabUpcoming');
  const TAB_P  = document.getElementById('evTabPast');
  const PANEL  = document.getElementById('evPanel');

  // one source of truth (easy to maintain)
  const DATA_URL = 'assets/data/events.json'; // edit this file to manage events

  let upcoming = [];
  let past = [];
  const state = {
    tab: 'upcoming',
    page: { upcoming: 0, past: 0 },
    pages: { upcoming: 1, past: 1 }
  };

  // Utilities
  const fmt = new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
  const chunk = (arr, size) => Array.from({length: Math.ceil(arr.length/size)},(_,i)=>arr.slice(i*size, i*size+size));
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  function thumbHTML(ev){
    const date = ev.date ? fmt.format(new Date(ev.date)) : '';
    const href = ev.url || ev.video || ev.youtube || '#';
    const target = href.startsWith('#') ? '' : ' target="_blank" rel="noopener"';

    const bg = ev.poster || ev.thumbnail || '';
    const label = [date, ev.location].filter(Boolean).join(' — ');

    return `
      <a class="ev-card" role="listitem" href="${href}"${target} aria-label="${ev.title || 'Event'}">
        <div class="ev-thumb" style="background-image:url('${bg}')"></div>
        <div class="ev-info">
          <h3 class="ev-title">${ev.title || 'Untitled'}</h3>
          ${label ? `<div class="ev-meta">${label}</div>` : ``}
        </div>
      </a>
    `;
  }

  function render(){
    const tab = state.tab;
    const list = tab === 'upcoming' ? upcoming : past;

    // compute pages (4 per page)
    const groups = chunk(list, 4);
    state.pages[tab] = Math.max(1, groups.length);
    state.page[tab]  = clamp(state.page[tab], 0, state.pages[tab]-1);

    const current = groups[state.page[tab]] || [];

    // Fill grid
    GRID.innerHTML = current.map(thumbHTML).join('');

    // Pagination UI
    BTN_PREV.hidden = state.page[tab] <= 0 || state.pages[tab] <= 1;
    BTN_NEXT.hidden = state.page[tab] >= state.pages[tab]-1 || state.pages[tab] <= 1;

    // Dots
    DOTS.innerHTML = groups.map((_,i)=>`
      <button class="ev-dot ${i===state.page[tab]?'is-active':''}" data-ix="${i}" aria-label="Go to page ${i+1}"></button>
    `).join('');

    // a11y bindings
    PANEL.setAttribute('aria-labelledby', tab === 'upcoming' ? 'evTabUpcoming' : 'evTabPast');
  }

  function switchTab(tab){
    if(state.tab === tab) return;
    state.tab = tab;
    TAB_UP.classList.toggle('is-active', tab==='upcoming');
    TAB_P.classList.toggle('is-active',  tab==='past');
    TAB_UP.setAttribute('aria-selected', (tab==='upcoming').toString());
    TAB_P.setAttribute('aria-selected',  (tab==='past').toString());
    render();
  }

  // Events
  BTN_PREV.addEventListener('click', () => { state.page[state.tab]--; render(); });
  BTN_NEXT.addEventListener('click', () => { state.page[state.tab]++; render(); });
  DOTS.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-ix]');
    if(!b) return;
    state.page[state.tab] = +b.dataset.ix;
    render();
  });
  TAB_UP.addEventListener('click', () => switchTab('upcoming'));
  TAB_P .addEventListener('click', () => switchTab('past'));

  // Load data
  fetch(DATA_URL, { cache: 'no-store' })
    .then(r => r.json())
    .then(all => {
      const now = new Date();
      const hasDate = (d)=>d && !isNaN(new Date(d).valueOf());

      // split
      (all||[]).forEach(ev=>{
        if(hasDate(ev.date) && new Date(ev.date) >= now) upcoming.push(ev);
        else past.push(ev);
      });

      // sort
      upcoming.sort((a,b)=> new Date(a.date) - new Date(b.date));   // nearest first
      past.sort((a,b)=> new Date(b.date) - new Date(a.date));       // most recent first

      render();
    })
    .catch(err => {
      console.error('events load failed', err);
      GRID.innerHTML = `<p style="color:#b7c2b9">Events are not available right now.</p>`;
      BTN_PREV.hidden = BTN_NEXT.hidden = true;
      DOTS.innerHTML = '';
    });
})();