/* ════════════════════════════════════
   EVENT CONFIG — edit this object to adapt the app to any event
════════════════════════════════════ */
const EVENT_CONFIG = {
  /* Branding */
  eventName:    'Bharat Tex 2026',
  orgName:      'NYTG',
  venueLine:    'Global Textile Expo · Hall 5',

  /* Auth */
  adminPassword: 'nytg2026',

  /* Storage */
  storageKey: 'nytg_leads',

  /* Booth identifier shown in sidebar badge and booth form tag */
  boothId: 'NYTG-BT26',

  /* Fabric products shown as selectable cards on the public form
     and as options in the booth entry select.
     badgeClass must match one of: badge-teal, badge-blue, badge-amber, badge-gray */
  fabrics: [
    { name: 'Elitech 360',    icon: '⚡',  sub: 'Stretch & durability',  badgeClass: 'badge-teal'  },
    { name: 'Dry-Tech',       icon: '💧',  sub: 'Moisture management',   badgeClass: 'badge-blue'  },
    { name: 'Recycled Fabric', icon: '♻️', sub: 'Circular fashion',      badgeClass: 'badge-amber' },
  ],

  /* Extra option appended to the booth fabric select (not a card) */
  fabricSelectExtras: ['Multiple / TBD'],

  /* Apparel-type chips on the public form */
  apparelTypes: ['Workwear', 'Uniform', 'Polo shirt', 'Activewear', 'Casualwear', 'Others'],

  /* Lead-source chips on the public form.
     Set showsSalesperson:true on whichever source should reveal the salesperson input. */
  sources: [
    { label: 'Facebook Ad' },
    { label: 'Instagram' },
    { label: 'LinkedIn' },
    { label: 'Bharat Tex booth', showsSalesperson: true },
    { label: 'Other' },
  ],

  /* Priority levels used in booth entry form, lead cards, and dashboard stats.
     cssClass must match one of: p-hot, p-warm, p-cold.
     badgeClass must match one of: badge-red, badge-amber, badge-blue. */
  priorities: [
    { value: 'Hot',  label: '🔥 Hot',  cssClass: 'p-hot',  badgeClass: 'badge-red'   },
    { value: 'Warm', label: '🌤 Warm', cssClass: 'p-warm', badgeClass: 'badge-amber', default: true },
    { value: 'Cold', label: '❄️ Cold', cssClass: 'p-cold', badgeClass: 'badge-blue'  },
  ],
};

/* ════════════════════════════════════
   STATE
════════════════════════════════════ */
let leads = JSON.parse(localStorage.getItem(EVENT_CONFIG.storageKey) || '[]');
let selectedFabrics = [];
let selectedApparel = [];
let selectedSource = '';
let activeFilter = 'All';
let boothFormOpen = false;
let unlocked = false;

/* ════════════════════════════════════
   INIT — populate all config-driven UI
════════════════════════════════════ */
function initUI() {
  const { eventName, orgName, boothId, venueLine, fabrics, fabricSelectExtras,
          apparelTypes, sources, priorities } = EVENT_CONFIG;

  /* Page title & sidebar brand */
  document.title = `${orgName} · ${eventName} — Lead App`;
  document.getElementById('sidebar-brand-title').textContent = `${orgName} · ${eventName}`;
  document.getElementById('sidebar-booth-badge-text').textContent = `Booth #${orgName}`;
  document.getElementById('sidebar-footer-text').textContent = venueLine;
  document.getElementById('booth-vid-tag').textContent = `V-ID: ${boothId}`;

  /* Source chips */
  const sourceContainer = document.getElementById('source-chips');
  sourceContainer.innerHTML = sources.map(s =>
    '<button class="chip" onclick="selectSource(this,' + JSON.stringify(s.label) + ')">' + esc(s.label) + '<\/button>'
  ).join('');

  /* Fabric cards */
  const fabricContainer = document.getElementById('fabric-cards');
  fabricContainer.innerHTML = fabrics.map(f =>
    '<div class="fabric-card" onclick="toggleFabric(this,' + JSON.stringify(f.name) + ')">'
    + '<div class="fc-icon">' + f.icon + '<\/div>'
    + '<div class="fc-name">' + esc(f.name) + '<\/div>'
    + '<div class="fc-sub">' + esc(f.sub) + '<\/div>'
    + '<\/div>'
  ).join('');

  /* Apparel chips */
  const apparelContainer = document.getElementById('apparel-chips');
  apparelContainer.innerHTML = apparelTypes.map(a =>
    '<button class="chip" onclick="toggleChip(this)">' + esc(a) + '<\/button>'
  ).join('');

  /* Booth fabric select options */
  const fabricSelect = document.getElementById('b-fabric');
  fabrics.forEach(f => {
    const o = document.createElement('option');
    o.value = f.name; o.textContent = f.name;
    fabricSelect.appendChild(o);
  });
  fabricSelectExtras.forEach(name => {
    const o = document.createElement('option');
    o.value = name; o.textContent = name;
    fabricSelect.appendChild(o);
  });

  /* Booth priority radios */
  const priorityRow = document.getElementById('booth-priority-row');
  priorityRow.innerHTML = priorities.map(p =>
    '<div class="priority-opt">'
    + '<input type="radio" name="b-priority" id="bp-' + p.value.toLowerCase() + '" value="' + esc(p.value) + '"' + (p.default ? ' checked' : '') + '>'
    + '<label for="bp-' + p.value.toLowerCase() + '" class="' + esc(p.cssClass) + '">' + p.label + '<\/label>'
    + '<\/div>'
  ).join('');

  /* Dashboard filter pills */
  const filterRow = document.getElementById('dash-filters');
  const staticFilters = [
    { label: 'All', value: 'All', on: true },
    ...fabrics.map(f => ({ label: f.name, value: f.name })),
    { label: '🔥 Hot', value: 'Hot' },
    { label: 'Booth', value: 'Booth' },
    { label: 'Online', value: 'Online' },
  ];
  filterRow.innerHTML = staticFilters.map(f =>
    '<button class="filter-pill' + (f.on ? ' on' : '') + '" onclick="setFilter(' + JSON.stringify(f.value) + ',this)">' + f.label + '<\/button>'
  ).join('');
}

/* ════════════════════════════════════
   PERSIST
════════════════════════════════════ */
function saveLeads() {
  localStorage.setItem(EVENT_CONFIG.storageKey, JSON.stringify(leads));
  updateTopbarCount();
}
function updateTopbarCount() {
  const el = document.getElementById('topbar-leads');
  const cnt = document.getElementById('topbar-leads-count');
  if (unlocked) {
    el.style.display = 'flex';
    cnt.textContent = leads.length;
  } else {
    el.style.display = 'none';
  }
}

/* ════════════════════════════════════
   SIDEBAR
════════════════════════════════════ */
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebar-overlay');
  const isOpen = s.classList.contains('open');
  if (isOpen) closeSidebar();
  else { s.classList.add('open'); o.classList.add('open'); }
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

/* ════════════════════════════════════
   NAVIGATION
════════════════════════════════════ */
const pageTitles = {
  form: 'Share your fabric needs',
  login: 'Team login',
  dash: 'Lead dashboard',
  booth: 'Booth entry',
};
function goTo(id) {
  closeSidebar();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-item[id^="nav-"]').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + id);
  if (navBtn) navBtn.classList.add('active');
  document.getElementById('topbar-title').textContent = pageTitles[id] || '';
  if (id === 'dash') renderDash();
  if (id === 'booth') renderBoothList();
}

/* ════════════════════════════════════
   AUTH
════════════════════════════════════ */
function checkPassword() {
  const val = document.getElementById('pw-input').value;
  if (val === EVENT_CONFIG.adminPassword) {
    unlocked = true;
    document.getElementById('pw-error').style.display = 'none';
    document.getElementById('pw-input').value = '';
    document.getElementById('admin-nav').style.display = 'block';
    document.getElementById('login-nav').style.display = 'none';
    document.getElementById('sidebar-booth-badge').style.display = 'flex';
    updateTopbarCount();
    goTo('dash');
  } else {
    document.getElementById('pw-error').style.display = 'block';
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-input').focus();
  }
}
function lockApp() {
  unlocked = false;
  document.getElementById('admin-nav').style.display = 'none';
  document.getElementById('login-nav').style.display = 'block';
  document.getElementById('sidebar-booth-badge').style.display = 'none';
  updateTopbarCount();
  goTo('form');
}

/* ════════════════════════════════════
   FORM INTERACTIONS
════════════════════════════════════ */
function selectSource(el, name) {
  document.querySelectorAll('#source-chips .chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedSource = name;
  const sp = document.getElementById('salesperson-field');
  const src = EVENT_CONFIG.sources.find(s => s.label === name);
  if (src && src.showsSalesperson) sp.classList.add('show');
  else sp.classList.remove('show');
}
function toggleFabric(el, name) {
  const i = selectedFabrics.indexOf(name);
  if (i > -1) { selectedFabrics.splice(i,1); el.classList.remove('selected'); }
  else { selectedFabrics.push(name); el.classList.add('selected'); }
}
function toggleChip(el) {
  const name = el.textContent.trim();
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selectedApparel = selectedApparel.filter(a => a !== name);
  } else {
    el.classList.add('selected');
    selectedApparel.push(name);
  }
}

/* ════════════════════════════════════
   PUBLIC FORM SUBMIT
════════════════════════════════════ */
function submitPublicForm() {
  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const company = document.getElementById('f-company').value.trim();
  if (!name || !email || !company) { showToast('Please fill in Name, Company and Email.', 'error'); return; }
  if (!selectedFabrics.length) { showToast('Please select at least one fabric interest.', 'error'); return; }
  if (!selectedSource) { showToast('Please select how you heard about us.', 'error'); return; }

  const src = EVENT_CONFIG.sources.find(s => s.label === selectedSource);
  const salesperson = (src && src.showsSalesperson)
    ? document.getElementById('f-salesperson').value.trim() : '';

  const lead = makeLead({
    name, email, company,
    country: document.getElementById('f-country').value.trim(),
    fabric: selectedFabrics.join(', '),
    apparel: selectedApparel.join(', '),
    msg: document.getElementById('f-msg').value.trim(),
    source: selectedSource,
    salesperson,
    priority: EVENT_CONFIG.priorities.find(p => p.default)?.value || EVENT_CONFIG.priorities[0].value,
    note: ''
  });
  leads.push(lead);
  saveLeads();

  document.getElementById('conf-email').textContent = email;
  document.getElementById('form-view').style.display = 'none';
  document.getElementById('success-view').style.display = 'block';
  window.scrollTo(0, 0);
}

function resetPublicForm() {
  ['f-name','f-email','f-company','f-country','f-msg','f-salesperson']
    .forEach(id => document.getElementById(id).value = '');
  selectedFabrics = []; selectedApparel = []; selectedSource = '';
  document.querySelectorAll('#page-form .fabric-card, #page-form .chip')
    .forEach(c => c.classList.remove('selected'));
  document.getElementById('salesperson-field').classList.remove('show');
  document.getElementById('form-view').style.display = 'block';
  document.getElementById('success-view').style.display = 'none';
  window.scrollTo(0, 0);
}

/* ════════════════════════════════════
   BOOTH ENTRY
════════════════════════════════════ */
function toggleBoothForm() {
  boothFormOpen = !boothFormOpen;
  document.getElementById('booth-form').style.display = boothFormOpen ? 'block' : 'none';
  document.getElementById('add-btn').style.display = boothFormOpen ? 'none' : 'flex';
  if (boothFormOpen) document.getElementById('b-name').focus();
}

function saveBoothLead() {
  const name = document.getElementById('b-name').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }

  const priorityEl = document.querySelector('input[name="b-priority"]:checked');
  const defaultPriority = EVENT_CONFIG.priorities.find(p => p.default)?.value || EVENT_CONFIG.priorities[0].value;
  const priority = priorityEl ? priorityEl.value : defaultPriority;

  leads.push(makeLead({
    name,
    company: document.getElementById('b-company').value.trim(),
    email: document.getElementById('b-email').value.trim(),
    country: document.getElementById('b-country').value.trim(),
    fabric: document.getElementById('b-fabric').value,
    apparel: '', msg: '',
    source: 'Booth',
    salesperson: document.getElementById('b-sales').value.trim(),
    priority,
    note: document.getElementById('b-note').value.trim()
  }));
  saveLeads();

  ['b-name','b-company','b-email','b-country','b-sales','b-note']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('b-fabric').value = '';
  const defaultRadio = document.querySelector(`input[name="b-priority"][value="${defaultPriority}"]`);
  if (defaultRadio) defaultRadio.checked = true;

  boothFormOpen = false;
  document.getElementById('booth-form').style.display = 'none';
  document.getElementById('add-btn').style.display = 'flex';
  renderBoothList();
  showToast('Contact saved!', 'success');
}

/* ════════════════════════════════════
   LEAD FACTORY
════════════════════════════════════ */
function makeLead(data) {
  return { id: Date.now() + Math.random(), ...data, time: new Date().toLocaleString('en-GB') };
}

/* ════════════════════════════════════
   INITIALS HELPER
════════════════════════════════════ */
function initials(name) {
  return (name || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}

/* ════════════════════════════════════
   RENDER DASHBOARD
════════════════════════════════════ */
function renderDash() {
  document.getElementById('st-total').textContent = leads.length;
  EVENT_CONFIG.priorities.forEach(p => {
    const el = document.getElementById('st-' + p.value.toLowerCase());
    if (el) el.textContent = leads.filter(l => l.priority === p.value).length;
  });
  renderDashList();
}
function renderDashList() {
  const el = document.getElementById('dash-list');
  const priorities = EVENT_CONFIG.priorities.map(p => p.value);
  const filtered = leads.filter(l => {
    if (activeFilter === 'All') return true;
    if (priorities.includes(activeFilter)) return l.priority === activeFilter;
    if (activeFilter === 'Booth') return l.source === 'Booth';
    if (activeFilter === 'Online') return l.source !== 'Booth';
    return l.fabric && l.fabric.includes(activeFilter);
  }).slice().reverse();
  el.innerHTML = filtered.length
    ? filtered.map(leadHTML).join('')
    : '<div class="empty"><span class="material-symbols-outlined">search_off<\/span>No leads match this filter.<\/div>';
}

/* ════════════════════════════════════
   RENDER BOOTH LIST
════════════════════════════════════ */
function renderBoothList() {
  const el = document.getElementById('booth-list');
  const items = leads.filter(l => l.source === 'Booth').slice().reverse();
  el.innerHTML = items.length
    ? items.map(leadHTML).join('')
    : '<div class="empty"><span class="material-symbols-outlined">group_add<\/span>No contacts yet.<\/div>';
}

/* ════════════════════════════════════
   LEAD HTML CARD
════════════════════════════════════ */
function leadHTML(l) {
  const fabrics = (l.fabric||'').split(', ').filter(Boolean);
  const fabricBadges = fabrics.map(f => {
    const cfg = EVENT_CONFIG.fabrics.find(x => x.name === f);
    const cls = cfg ? cfg.badgeClass : 'badge-gray';
    return '<span class="badge ' + cls + '">' + esc(f) + '<\/span>';
  }).join('');
  const pCfg = EVENT_CONFIG.priorities.find(p => p.value === l.priority);
  const pClass = pCfg ? pCfg.badgeClass : 'badge-gray';
  const srcClass = l.source === 'Booth' ? 'badge-purple' : 'badge-gray';
  const salesBadge = l.salesperson
    ? '<span class="badge badge-gray">👤 ' + esc(l.salesperson) + '<\/span>' : '';
  const appParts = l.apparel ? l.apparel.split(', ') : [];
  const appBadge = appParts.length
    ? '<span class="badge badge-gray">' + esc(appParts[0]) + (appParts.length > 1 ? ' +' + (appParts.length - 1) : '') + '<\/span>' : '';
  const priorityOptions = EVENT_CONFIG.priorities.map(p =>
    '<option ' + (l.priority === p.value ? 'selected' : '') + ' value="' + esc(p.value) + '">' + p.label + '<\/option>'
  ).join('');
  const noteRow = l.note
    ? '<div class="note-text"><span class="material-symbols-outlined" style="font-size:13px">edit_note<\/span>' + esc(l.note) + '<\/div>' : '';
  return '<div class="lead-card">'
    + '<div class="lead-top">'
    +   '<div style="display:flex;gap:10px;align-items:flex-start;flex:1;min-width:0">'
    +     '<div class="lead-avatar">' + initials(l.name) + '<\/div>'
    +     '<div class="lead-info">'
    +       '<div class="lead-name">' + esc(l.name) + '<\/div>'
    +       '<div class="lead-sub">' + esc(l.company||'—') + (l.country ? ' \xB7 ' + esc(l.country) : '') + (l.email ? ' \xB7 ' + esc(l.email) : '') + '<\/div>'
    +     '<\/div>'
    +   '<\/div>'
    +   '<select class="priority-select" onchange="updatePriority(\'' + l.id + '\',this.value)">'
    +     priorityOptions
    +   '<\/select>'
    + '<\/div>'
    + '<div class="badges">'
    +   fabricBadges + appBadge
    +   '<span class="badge ' + srcClass + '">' + esc(l.source) + '<\/span>'
    +   '<span class="badge ' + pClass + '">' + l.priority + '<\/span>'
    +   salesBadge
    + '<\/div>'
    + noteRow
    + '<div class="note-area">'
    +   '<input class="note-input" id="note-' + l.id + '" placeholder="Add note..." value="' + esc(l.note||'') + '">'
    +   '<button class="btn-secondary" style="font-size:12px;padding:5px 12px;flex-shrink:0" onclick="saveNote(\'' + l.id + '\')">Save<\/button>'
    + '<\/div>'
    + '<div class="lead-time">' + l.time + '<\/div>'
    + '<\/div>';
}

/* ════════════════════════════════════
   ESCAPE HTML
════════════════════════════════════ */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/\x3c/g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════════════
   ACTIONS
════════════════════════════════════ */
function updatePriority(id, val) {
  const l = leads.find(x => String(x.id) === String(id));
  if (l) { l.priority = val; saveLeads(); renderDash(); renderBoothList(); }
}
function saveNote(id) {
  const l = leads.find(x => String(x.id) === String(id));
  if (l) {
    l.note = document.getElementById('note-' + id).value.trim();
    saveLeads(); renderDash(); renderBoothList();
    showToast('Note saved!', 'success');
  }
}
function setFilter(f, btn) {
  activeFilter = f;
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderDashList();
}

/* ════════════════════════════════════
   EXPORT CSV
════════════════════════════════════ */
function exportCSV() {
  if (!leads.length) { showToast('No leads to export yet.', 'error'); return; }
  const headers = ['Name','Company','Email','Country','Source','Salesperson','Fabric','Apparel','Message','Priority','Note','Time'];
  const rows = leads.map(l =>
    [l.name,l.company,l.email,l.country,l.source,l.salesperson,l.fabric,l.apparel,l.msg,l.priority,l.note,l.time]
      .map(v => `"${(v||'').replace(/"/g,'""')}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `${EVENT_CONFIG.orgName}_${EVENT_CONFIG.eventName.replace(/\s+/g,'')}_Leads_` + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  closeSidebar();
}

/* ════════════════════════════════════
   TOAST NOTIFICATION
════════════════════════════════════ */
let toastTimeout;
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(100px);
      padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;
      box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:9999;transition:transform .25s ease;
      white-space:nowrap;pointer-events:none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#E24B4A' : '#1D9E75';
  toast.style.color = '#fff';
  clearTimeout(toastTimeout);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  toastTimeout = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
  }, 2500);
}

/* ════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSidebar();
  if (unlocked && e.key === 'b' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); goTo('booth'); }
  if (unlocked && e.key === 'd' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); goTo('dash'); }
});

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
initUI();
updateTopbarCount();