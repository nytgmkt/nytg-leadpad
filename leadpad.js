/* ════════════════════════════════════
   FIREBASE SETUP
════════════════════════════════════ */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getDatabase, ref, push, get, onValue, update, set } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyC1uyUDUgwzlIWqqn6TG6-rcogsWVHs7jU",
  authDomain: "nytg-leadpad.firebaseapp.com",
  databaseURL: "https://nytg-leadpad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nytg-leadpad",
  storageBucket: "nytg-leadpad.firebasestorage.app",
  messagingSenderId: "658641774864",
  appId: "1:658641774864:web:c66c544432260e8b5e5d95"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

/* ════════════════════════════════════
   DEFAULT PROJECT CONFIG (Bharat Tex 2026)
   Used as seed if Firebase has no data
════════════════════════════════════ */
const BHARATTEX_DEFAULT = {
  eventName: 'Bharat Tex 2026',
  orgName: 'NYTG',
  venueLine: 'Global Textile Expo · Hall 5',
  boothId: 'NYTG-BT26',
verifyAccessUrl: "https://asia-southeast1-nytg-leadpad.cloudfunctions.net/verifyAccess",
  fabrics: [
    { name: 'Elitech 360',     icon: '⚡', sub: 'Stretch & durability',  badgeClass: 'badge-teal'  },
    { name: 'Dry-Tech',        icon: '💧', sub: 'Moisture management',   badgeClass: 'badge-blue'  },
    { name: 'Recycled Fabric', icon: '♻️', sub: 'Circular fashion',      badgeClass: 'badge-amber' },
  ],
  fabricSelectExtras: ['Multiple / TBD'],
  apparelTypes: ['Workwear','Uniform','Polo shirt','Activewear','Casualwear','Others'],
  sources: [
    { label: 'Facebook Ad' },
    { label: 'Instagram' },
    { label: 'LinkedIn' },
    { label: 'Bharat Tex booth', showsSalesperson: true },
    { label: 'Other' },
  ],
  salespeople: [],
  brevoTemplateId: 2,
  scoringRules: {
    thresholds: { hot: 70, warm: 35 },
    weights: {
      fabricInterest: 20,
      apparelInterest: 10,
      message: 15,
      boothSource: 25,
      salesperson: 10,
      company: 10,
      email: 10,
    },
  },
  dashboardWidgets: [
    'fabricInterest',
    'sourceBreakdown',
    'salesperson',
    'temperatureOverall',
    'timeline',
  ],
  priorities: [
    { value: 'Hot',  label: '🔥 Hot',  cssClass: 'p-hot',  badgeClass: 'badge-red'   },
    { value: 'Warm', label: '🌤 Warm', cssClass: 'p-warm', badgeClass: 'badge-amber', default: true },
    { value: 'Cold', label: '❄️ Cold', cssClass: 'p-cold', badgeClass: 'badge-blue'  },
  ],
};

/* ════════════════════════════════════
   SESSION STATE
════════════════════════════════════ */
const SESSION_KEY = 'nytg_lp_session';

let session = loadSession();
let currentProject = null;
let leads = [];
let leadsListener = null;

let selectedFabrics = [];
let selectedApparel = [];
let selectedSource = '';

let activeFilter = 'All';
let boothFormOpen = false;

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: null, projectKey: null }; }
  catch { return { role: null, projectKey: null }; }
}
function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/* ════════════════════════════════════
   HASH ROUTER
════════════════════════════════════ */
async function route() {
session = getSession();
  const hash = location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) {
    await renderHome();
    return;
  }

if (parts[0] === 'login') {
  await renderLogin();
  return;
}

  if (parts[0] === 'hub') {
    if (!session.role) { goHome(); return; }
    await renderHub();
    return;
  }
if (parts[0] === 'projects' && parts[1] === 'new') {
  if (session.role !== 'admin') { navigate('/hub'); return; }
  await renderCreateProjectPage();
  return;
}
  const eventKey = parts[0];
  const sub = parts[1] || '';

  const cfg = await loadProjectConfig(eventKey);
  if (!cfg) {
    renderError(`Project "${eventKey}" not found.`);
    return;
  }
  currentProject = { key: eventKey, ...cfg };
  updateSidebarForProject();

  if (!sub) {
    await renderPublicForm();
  } else if (sub === 'dash') {
    if (!session.role) { navigate(`/${eventKey}`); return; }
    await renderDashPage();
  } else if (sub === 'booth') {
    if (!session.role) { navigate(`/${eventKey}`); return; }
    await renderBoothPage();
  } else if (sub === 'settings') {
    if (session.role !== 'admin') { navigate(`/${eventKey}/dash`); return; }
await renderSettingsPage();
  } else {
    renderError('Page not found.');
  }
}

/* ════════════════════════════════════
   FIREBASE PROJECT HELPERS
════════════════════════════════════ */
async function loadProjectConfig(key) {
  const settingsSnap = await get(ref(db, `projects/${key}/settings`));
  if (settingsSnap.exists()) return settingsSnap.val();

  const configSnap = await get(ref(db, `projects/${key}/config`));
  if (configSnap.exists()) return configSnap.val();

  if (key === 'bharattex2026') {
    await set(ref(db, 'projects/bharattex2026/settings'), BHARATTEX_DEFAULT);
    return BHARATTEX_DEFAULT;
  }

  return null;
}

async function loadAllProjects() {
  const snap = await get(ref(db, 'projects'));
  if (!snap.exists()) return [];
  const projects = [];
  snap.forEach(child => {
    const cfg = child.val().config || {};
    const leadsObj = child.val().leads || {};
    projects.push({
      key: child.key,
      eventName: cfg.eventName || child.key,
      orgName: cfg.orgName || '',
      venueLine: cfg.venueLine || '',
      leadCount: Object.keys(leadsObj).length,
    });
  });
  return projects;
}

function subscribeLeads(key) {
  if (leadsListener) leadsListener();

  const leadsRef = ref(db, `projects/${key}/leads`);

  leadsListener = onValue(leadsRef, (snap) => {
    leads = [];

    if (snap.exists()) {
      snap.forEach(child => {
        leads.push({ _key: child.key, ...child.val() });
      });
    }

    updateTopbarCount();

    const hash = location.hash;
    if (hash.includes('/dash')) renderDashList();
    if (hash.includes('/booth')) renderBoothList();
  });
}
function getSession() {
  try {
    const storedSession = JSON.parse(sessionStorage.getItem('leadpadAccess') || 'null');

    if (storedSession && storedSession.role && storedSession.projectKey) {
      session = storedSession;
      return storedSession;
    }

    return session || {};
  } catch (error) {
    return session || {};
  }
}
async function loadLeadsOnce(key) {
  const access = getSession();
  const token = access?.token || '';
  const password = access?.password || '';

  const response = await fetch("https://asia-southeast1-nytg-leadpad.cloudfunctions.net/getDashboardLeads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectKey: key,
      token,
      password,
    }),
  });

  const result = await response.json().catch(() => ({
    ok: false,
    error: "Could not load dashboard leads",
  }));

  if (!response.ok || !result.ok) {
    const message = result?.error || "Could not load dashboard leads";

    if (response.status === 401 || message === "Unauthorized") {
      sessionStorage.removeItem("leadpadAccess");
      session = {};
      showToast("Session expired. Please log in again.", "error");
      navigate("/login");
      return;
    }

    throw new Error(message);
  }

  leads = result.leads || [];

  updateTopbarCount();
  renderDashList();
}
async function saveLeadToProject(key, leadData) {
  const response = await fetch("https://submitlead-qba6lqpwsa-as.a.run.app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectKey: key,
      lead: leadData,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Could not submit lead");
  }

  return result.key;
}

async function updateLeadInProject(key, leadKey, fields) {
  await update(ref(db, `projects/${key}/leads/${leadKey}`), fields);
}
async function saveProjectSettings(key, fields) {
  await update(ref(db, `projects/${key}/settings`), fields);
}
/* ════════════════════════════════════
   NAVIGATION HELPERS
════════════════════════════════════ */
function navigate(path) {
  location.hash = '/' + path.replace(/^\//, '');
}
function goHome() { navigate('/'); }

/* ════════════════════════════════════
   SIDEBAR
════════════════════════════════════ */
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebar-overlay');
  if (s.classList.contains('open')) closeSidebar();
  else { s.classList.add('open'); o.classList.add('open'); }
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function renderSidebarNav(items) {
  document.getElementById('sidebar-nav').innerHTML = items.map(item => {
    if (item.divider) return '<div class="nav-divider"></div>';
    if (item.label_only) return `<div class="sidebar-section-label">${item.label_only}</div>`;
    const active = item.active ? ' active' : '';
    return `<button class="nav-item${active}" onclick="${item.onclick}">
      <span class="material-symbols-outlined">${item.icon}</span> ${item.label}
    </button>`;
  }).join('');
}

function updateSidebarForProject() {
  if (!currentProject) return;
  const key = currentProject.key;
  const hash = location.hash;
  document.getElementById('sidebar-brand-title').textContent = `${currentProject.orgName} · ${currentProject.eventName}`;
  document.getElementById('sidebar-brand-sub').textContent = currentProject.venueLine || 'LeadPad';

  const boothBadge = document.getElementById('sidebar-booth-badge');
  const boothText  = document.getElementById('sidebar-booth-badge-text');
  if (session.role) {
    boothBadge.style.display = 'flex';
    boothText.textContent = `Booth #${currentProject.orgName}`;
  } else {
    boothBadge.style.display = 'none';
  }

  const items = [
    { label_only: 'Public' },
    { icon: 'edit_square', label: 'Submit Interest', onclick: `navigate('/${key}')`, active: hash === `#/${key}` },
  ];

  if (session.role) {
    items.push({ label_only: 'Internal' });
    items.push({ icon: 'dashboard', label: 'Dashboard', onclick: `navigate('/${key}/dash')`, active: hash.includes('/dash') });
    items.push({ icon: 'edit_note', label: 'Booth Entry', onclick: `navigate('/${key}/booth')`, active: hash.includes('/booth') });

    if (session.role === 'admin') {
      items.push({ icon: 'settings', label: 'Settings', onclick: `navigate('/${key}/settings')`, active: hash.includes('/settings') });
    }

    items.push({ divider: true });
    items.push({ icon: 'grid_view', label: 'All Projects', onclick: `navigate('/hub')`, active: hash.includes('/hub') });
    items.push({ icon: 'download', label: 'Export CSV', onclick: `exportCSV()` });
    items.push({ divider: true });
    items.push({ icon: 'lock', label: 'Log out', onclick: `logout()` });
  } else {
    items.push({ divider: true });
    items.push({ icon: 'admin_panel_settings', label: 'Team login', onclick: `navigate('/login')` });
  }

  renderSidebarNav(items);
}

function updateSidebarGeneric() {
  document.getElementById('sidebar-brand-title').textContent = 'NYTG LeadPad';
  document.getElementById('sidebar-brand-sub').textContent = 'Lead Management';
  document.getElementById('sidebar-booth-badge').style.display = 'none';

  const items = [];
  if (session.role) {
    items.push({ icon: 'grid_view', label: 'All Projects', onclick: `navigate('/hub')`, active: location.hash.includes('hub') });
    items.push({ divider: true });
    items.push({ icon: 'lock', label: 'Log out', onclick: `logout()` });
  } else {
    items.push({ icon: 'home', label: 'Home', onclick: `navigate('/')`, active: location.hash === '#/' || location.hash === '' });
    items.push({ icon: 'admin_panel_settings', label: 'Team login', onclick: `navigate('/login')` });
  }
  renderSidebarNav(items);
}

/* ════════════════════════════════════
   TOPBAR
════════════════════════════════════ */
function updateTopbarCount() {
  const el = document.getElementById('topbar-leads');
  const cnt = document.getElementById('topbar-leads-count');
  const hash = location.hash;

  if (session.role && currentProject && hash.includes(`/${currentProject.key}`)) {
    el.style.display = 'flex';
    cnt.textContent = leads.length;
  } else {
    el.style.display = 'none';
    cnt.textContent = '0';
  }
}

function setTopbarTitle(title) {
  document.getElementById('topbar-title').textContent = title;
}

function updateRoleBadge() {
  const badge = document.getElementById('topbar-role-badge');
  if (!session.role) { badge.style.display = 'none'; return; }
  badge.style.display = 'block';
  badge.className = 'topbar-role-badge role-' + session.role;
  badge.textContent = session.role.charAt(0).toUpperCase() + session.role.slice(1);
}

/* ════════════════════════════════════
   AUTH
════════════════════════════════════ */
async function renderLogin() {
  currentProject = null;
  updateSidebarGeneric();
  setTopbarTitle('Team Login');
  updateRoleBadge();

  renderPage(`
    <div class="login-card card">
      <div class="login-icon">
        <span class="material-symbols-outlined">shield_person</span>
      </div>
      <h2>Team access</h2>
      <p>Enter your Admin or Creator password to continue.</p>

      <div class="field">
        <input id="pw-input" type="password" placeholder="Password" autocomplete="current-password"
          onkeydown="if(event.key === 'Enter') doLogin()">
      </div>

      <button class="btn-primary" style="width:100%" onclick="doLogin()">
        Enter
      </button>

      <button class="btn-link" style="margin-top:16px" onclick="goHome()">
        Back
      </button>
    </div>
  `, 'Team Login');
}
async function tryLogin(password, redirectKey) {
  const enteredPassword = String(password || '').trim();
  const projectKey = redirectKey || currentProject?.key || 'bharattex2026';
  const verifyAccessUrl = currentProject?.verifyAccessUrl || BHARATTEX_DEFAULT.verifyAccessUrl;

  if (!enteredPassword) {
    return false;
  }

  if (!verifyAccessUrl) {
    console.error('Missing verifyAccessUrl');
    return false;
  }

  try {
    const response = await fetch(verifyAccessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectKey,
        password: enteredPassword,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.ok !== true || !result.role) {
      return false;
    }

session = {
  projectKey,
  role: result.role,
  token: result.token || '',
  expiresAt: result.expiresAt || 0,
};

sessionStorage.setItem(
  'leadpadAccess',
  JSON.stringify(session)
);

const nextPath = result.role === 'admin'
  ? `#/${projectKey}/dash`
  : `#/${projectKey}/booth`;
console.log('LeadPad login route', result.role, nextPath);
window.location.href = nextPath;
return true;
  } catch (error) {
    console.error('Login failed', error);
    return false;
  }
}
/* ════════════════════════════════════
   PAGE RENDERERS
════════════════════════════════════ */
function setContent(html) {
  document.getElementById('page-content').innerHTML = html;
}
function renderError(msg) {
  setTopbarTitle('Error');
  setContent(`<div class="card" style="text-align:center;padding:40px">
    <span class="material-symbols-outlined" style="font-size:48px;color:var(--muted);opacity:.4">error</span>
    <div style="margin-top:12px;color:var(--muted);font-size:15px">${esc(msg)}</div>
    <button class="btn-secondary" style="margin:16px auto 0;display:inline-flex" onclick="navigate('/')">Go home</button>
  </div>`);
}
function renderPage(html, title) {
  setTopbarTitle(title);
  setContent(html);
}

/* ─── HOME ─── */
async function renderHome() {
  updateSidebarGeneric();
  updateRoleBadge();
  setTopbarTitle('LeadPad');

  if (session.role && session.projectKey) {
    navigate(`/${session.projectKey}/dash`);
    return;
  }
  if (session.role) {
    navigate('/hub');
    return;
  }

  setContent(`
    <div class="home-screen">
      <div class="home-logo">📋</div>
      <div class="home-title">NYTG LeadPad</div>
      <div class="home-sub">Lead capture & management platform.<br>Choose how you'd like to continue.</div>
      <div class="role-cards">
        <div class="role-card" onclick="navigate('/bharattex2026')">
          <span class="material-symbols-outlined">edit_square</span>
          <div class="role-card-label">Submit Interest</div>
          <div class="role-card-desc">Fill the public form for Bharat Tex 2026</div>
        </div>
        <div class="role-card" onclick="navigate('/login')">
          <span class="material-symbols-outlined">admin_panel_settings</span>
          <div class="role-card-label">Team Login</div>
          <div class="role-card-desc">Access dashboard & booth entry</div>
        </div>
      </div>
    </div>
  `);
}

/* ─── LOGIN ─── */
async function renderHub() {
  if (!currentProject && session.projectKey) {
    const cfg = await loadProjectConfig(session.projectKey);
    if (cfg) currentProject = { key: session.projectKey, ...cfg };
  }

  if (currentProject) {
    updateSidebarForProject();
  } else {
    updateSidebarGeneric();
  }

  setTopbarTitle('All Projects');
  updateRoleBadge();

  setContent(`<div style="text-align:center;padding:40px;color:var(--muted)">
    <span class="material-symbols-outlined" style="font-size:36px;opacity:.4">hourglass_top</span>
    <div style="margin-top:8px">Loading projects...</div>
  </div>`);

  const projects = await loadAllProjects();

  let cardsHtml = '';
  if (!projects.length) {
    cardsHtml = `<div class="empty">
      <span class="material-symbols-outlined">folder_off</span>
      <div>No projects yet.</div>
    </div>`;
  } else {
    cardsHtml = projects.map(project => `
      <div class="project-card" onclick="navigate('/${project.key}/dash')">
        <div class="project-icon">
          <span class="material-symbols-outlined">event_note</span>
        </div>
        <h3>${esc(project.eventName || project.key)}</h3>
        <p>${esc(project.orgName || '')}${project.venueLine ? ' · ' + esc(project.venueLine) : ''}</p>
        <div class="project-meta">
          <span>📋 ${project.leadCount || 0} leads</span>
          <span>/${esc(project.key)}</span>
        </div>
      </div>
    `).join('');
  }

  const createProjectButton = session.role === 'admin'
    ? `<button class="btn-primary" onclick="navigate('/projects/new')">
        <span class="material-symbols-outlined">add</span>
        Create Project
      </button>`
    : '';

  const newProjectCard = session.role === 'admin'
    ? `<button class="project-card project-card-new" onclick="navigate('/projects/new')">
        <span class="material-symbols-outlined">add_circle</span>
        <strong>New Project</strong>
        <small>Create another event workspace</small>
      </button>`
    : '';

  renderPage(`
    <div class="page-head">
      <div>
        <h1>All Projects</h1>
        <p>Click a project to open its dashboard.</p>
      </div>
      ${createProjectButton}
    </div>

    <div class="projects-grid">
      ${cardsHtml}
      ${newProjectCard}
    </div>
  `, 'All Projects');
}
async function renderSettingsPage() {
  if (!currentProject || session.role !== 'admin') {
    navigate('/hub');
    return;
  }

  setTopbarTitle('Settings');
  updateSidebarForProject();
  updateRoleBadge();

  renderPage(`
    <div class="page-head">
      <div>
        <h1>Settings</h1>
        <p>Edit basic project details for ${esc(currentProject.eventName || currentProject.key)}.</p>
      </div>
    </div>

    <div class="card" style="max-width:760px;margin:0 auto">
      <div class="card-header">
        <h3><span class="material-symbols-outlined">settings</span> Project details</h3>
      </div>

      <div class="field">
        <label>Project / Event name *</label>
        <input id="st-event-name" value="${esc(currentProject.eventName || '')}">
      </div>

      <div class="field">
        <label>Organization *</label>
        <input id="st-org-name" value="${esc(currentProject.orgName || '')}">
      </div>

      <div class="field">
        <label>Venue line</label>
        <input id="st-venue-line" value="${esc(currentProject.venueLine || '')}">
      </div>

      <div class="field">
        <label>Booth ID</label>
        <input id="st-booth-id" value="${esc(currentProject.boothId || '')}">
      </div>
      <div class="card-header" style="margin-top:28px">
        <h3><span class="material-symbols-outlined">inventory_2</span> Form options</h3>
      </div>

      <div class="field">
        <label>Fabric Interest options</label>
        <textarea id="st-fabrics" rows="6" placeholder="One option per line">${esc((currentProject.fabrics || []).map(f => f.name || f).join('\n'))}</textarea>
        <small style="display:block;margin-top:6px;color:var(--muted)">พิมพ์ 1 ตัวเลือกต่อ 1 บรรทัด กด Enter เพื่อเพิ่มตัวเลือกใหม่</small>
      </div>
            <div class="field">
        <label>Product Type options</label>
        <textarea id="st-product-types" rows="6" placeholder="One option per line">${esc((currentProject.productTypes || currentProject.apparelTypes || []).join('\n'))}</textarea>
        <small style="display:block;margin-top:6px;color:var(--muted)">พิมพ์ 1 ตัวเลือกต่อ 1 บรรทัด กด Enter เพื่อเพิ่มตัวเลือกใหม่</small>
      </div>
            <div class="field">
        <label>Source options</label>
        <textarea id="st-sources" rows="6" placeholder="One option per line">${esc((currentProject.sources || []).map(s => s.label || s).join('\n'))}</textarea>
        <small style="display:block;margin-top:6px;color:var(--muted)">พิมพ์ 1 ตัวเลือกต่อ 1 บรรทัด กด Enter เพื่อเพิ่มตัวเลือกใหม่</small>
      </div>
      <div class="field">
  <label>Estimated order quantity options</label>
  <textarea id="st-quantity-options" rows="5" placeholder="One option per line">${esc((currentProject.estimatedOrderQuantityOptions || [
    'Under 500 kg',
    '500-2,000 kg',
    '2,000-5,000 kg',
    '5,000+ kg',
    'Not sure yet'
  ]).join('\n'))}</textarea>
  <small style="display:block;margin-top:6px;color:var(--muted)">พิมพ์ 1 ตัวเลือกต่อ 1 บรรทัด กด Enter เพื่อเพิ่มตัวเลือกใหม่</small>
</div>

<div class="field">
  <label>Follow-up method options</label>
  <textarea id="st-follow-up-options" rows="5" placeholder="One option per line">${esc((currentProject.followUpOptions || [
    'WhatsApp',
    'Line',
    'Phone call',
    'Email',
    'No need, just send moodboard'
  ]).join('\n'))}</textarea>
  <small style="display:block;margin-top:6px;color:var(--muted)">พิมพ์ 1 ตัวเลือกต่อ 1 บรรทัด กด Enter เพื่อเพิ่มตัวเลือกใหม่</small>
</div>
            <div class="field">
        <label>Salesperson options</label>
        <textarea id="st-salespeople" rows="5" placeholder="One salesperson per line">${esc((currentProject.salespeople || []).join('\n'))}</textarea>
        <small style="display:block;margin-top:6px;color:var(--muted)">พิมพ์ 1 ชื่อต่อ 1 บรรทัด กด Enter เพื่อเพิ่มชื่อใหม่</small>
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap">
        <button class="btn-secondary" onclick="navigate('/${currentProject.key}/dash')">Cancel</button>
        <button class="btn-primary" onclick="submitProjectSettings()">
          <span class="material-symbols-outlined">save</span>
          Save Settings
        </button>
      </div>
    </div>
  `, 'Settings');
}
async function renderCreateProjectPage() {
  currentProject = null;
  updateSidebarGeneric();
  setTopbarTitle('Create Project');
  updateRoleBadge();

  const projects = await loadAllProjects();
  const copyOptions = projects
    .filter(project => project.key !== 'bharattex2026')
    .map(project => `
      <option value="${esc(project.key)}">${esc(project.eventName || project.key)}</option>
    `)
    .join('');

  renderPage(`
    <div class="page-head">
      <div>
        <h1>Create Project</h1>
        <p>Start a new event workspace from a ready LeadPad template.</p>
      </div>
    </div>

    <div class="card" style="max-width:720px;margin:0 auto">
      <div class="card-header">
        <h3><span class="material-symbols-outlined">add_business</span> Project info</h3>
      </div>

      <div class="field">
        <label>Project / Event name *</label>
        <input id="cp-event-name" placeholder="e.g. Bharat Tex 2027" oninput="syncProjectSlug()">
      </div>

      <div class="field">
        <label>Project key *</label>
        <input id="cp-project-key" placeholder="e.g. bharattex2027" oninput="this.dataset.touched='true'">
        <small style="display:block;margin-top:6px;color:var(--muted)">Use lowercase letters and numbers only. This becomes the project URL.</small>
      </div>

      <div class="field">
        <label>Organization *</label>
        <input id="cp-org-name" placeholder="e.g. NYTG">
      </div>

      <div class="field">
        <label>Venue line</label>
        <input id="cp-venue-line" placeholder="e.g. Global Textile Expo · Hall 5">
      </div>

      <div class="field">
        <label>Booth ID</label>
        <input id="cp-booth-id" placeholder="e.g. NYTG-BT27">
      </div>

      <div class="field">
        <label>Start from template</label>
        <select id="cp-copy-from">
          <option value="bharattex2026">Default LeadPad template</option>
          ${copyOptions}
        </select>
        <small style="display:block;margin-top:6px;color:var(--muted)">This copies form structure and settings only. Leads will not be copied.</small>
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap">
        <button class="btn-secondary" onclick="navigate('/hub')">Cancel</button>
        <button class="btn-primary" onclick="submitCreateProject()">
          <span class="material-symbols-outlined">rocket_launch</span>
          Publish Project
        </button>
      </div>
    </div>
  `, 'Create Project');
}
function syncProjectSlug() {
  const nameInput = document.getElementById('cp-event-name');
  const keyInput = document.getElementById('cp-project-key');

  if (!nameInput || !keyInput) return;
  if (keyInput.dataset.touched === 'true') return;

  const slug = nameInput.value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);

  keyInput.value = slug;
}
async function submitProjectSettings() {
  if (!currentProject || session.role !== 'admin') {
    showToast('Only admin can update settings.', 'error');
    return;
  }

  const eventName = document.getElementById('st-event-name')?.value.trim() || '';
  const orgName = document.getElementById('st-org-name')?.value.trim() || '';
  const venueLine = document.getElementById('st-venue-line')?.value.trim() || '';
  const boothId = document.getElementById('st-booth-id')?.value.trim() || '';
  const fabricLines = document.getElementById('st-fabrics')?.value
    .split('\n')
    .map(value => value.trim())
    .filter(Boolean) || [];
  
   if (!fabricLines.length) {
    showToast('Please add at least one Fabric Interest option.', 'error');
    return;
  }
  const productTypes = document.getElementById('st-product-types')?.value
    .split('\n')
    .map(value => value.trim())
    .filter(Boolean) || [];

  if (!productTypes.length) {
    showToast('Please add at least one Product Type option.', 'error');
    return;
  }
     const sourceLines = document.getElementById('st-sources')?.value
    .split('\n')
    .map(value => value.trim())
    .filter(Boolean) || [];

  if (!sourceLines.length) {
    showToast('Please add at least one Source option.', 'error');
    return;
  }
const quantityOptions = document.getElementById('st-quantity-options')?.value
  .split('\n')
  .map(value => value.trim())
  .filter(Boolean) || [];

const followUpOptions = document.getElementById('st-follow-up-options')?.value
  .split('\n')
  .map(value => value.trim())
  .filter(Boolean) || [];

if (!quantityOptions.length) {
  showToast('Please add at least one Estimated quantity option.', 'error');
  return;
}

if (!followUpOptions.length) {
  showToast('Please add at least one Follow-up option.', 'error');
  return;
}
const oldSources = currentProject.sources || [];
const sourceNeedsSalesperson = (label) => {
  const text = String(label || '').toLowerCase();
  return (
    text.includes('event') ||
    text.includes('booth') ||
    text.includes('trade show') ||
    text.includes('tradeshow')
  );
};

const sources = sourceLines.map(label => {
  const existing = oldSources.find(source => (source.label || source) === label) || {};
  return {
    label,
    showsSalesperson: !!existing.showsSalesperson || sourceNeedsSalesperson(label),
  };
});
   const salespeople = document.getElementById('st-salespeople')?.value
  .split('\n')
  .map(value => value.trim())
  .filter(Boolean) || [];
  const fabrics = fabricLines.map(name => ({
    name,
    icon: '',
    sub: '',
    badgeClass: 'badge-teal',
  }));
  if (!eventName || !orgName) {
    showToast('Please fill in Project name and Organization.', 'error');
    return;
  }

  try {
await saveProjectSettings(currentProject.key, {
  eventName,
  orgName,
  venueLine,
  boothId,
  fabrics,
  productTypes,
  apparelTypes: productTypes,
   sources,
   salespeople,
   estimatedOrderQuantityOptions: quantityOptions,
followUpOptions,
});
currentProject = {
  ...currentProject,
  eventName,
  orgName,
  venueLine,
  boothId,
  fabrics,
  productTypes,
  apparelTypes: productTypes,
   sources,
   salespeople,
   estimatedOrderQuantityOptions: quantityOptions,
followUpOptions,
};

    showToast('Settings saved.', 'success');
    updateSidebarForProject();
    setTopbarTitle('Settings');
  } catch (error) {
    console.error('Save settings failed', error);
    showToast('Could not save settings. Please try again.', 'error');
  }
}
async function submitCreateProject() {
  if (session.role !== 'admin') {
    showToast('Only admin can create projects.', 'error');
    return;
  }

  const eventName = document.getElementById('cp-event-name')?.value.trim() || '';
  const projectKey = document.getElementById('cp-project-key')?.value.trim().toLowerCase() || '';
  const orgName = document.getElementById('cp-org-name')?.value.trim() || '';
  const venueLine = document.getElementById('cp-venue-line')?.value.trim() || '';
  const boothId = document.getElementById('cp-booth-id')?.value.trim() || '';
  const copyFromProjectKey = document.getElementById('cp-copy-from')?.value || 'bharattex2026';

  if (!eventName || !projectKey || !orgName) {
    showToast('Please fill in Project name, Project key and Organization.', 'error');
    return;
  }

  if (!/^[a-z0-9]+$/.test(projectKey)) {
    showToast('Project key must use lowercase letters and numbers only.', 'error');
    return;
  }

  const access = getSession();
  const token = access?.token || '';

  if (!token) {
    showToast('Please login again before creating a project.', 'error');
    navigate('/login');
    return;
  }

  try {
    const response = await fetch('https://createproject-qba6lqpwsa-as.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authProjectKey: session.projectKey || 'bharattex2026',
        token,
        copyFromProjectKey,
        projectKey,
        eventName,
        orgName,
        venueLine,
        boothId,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.ok !== true) {
      throw new Error(result?.error || 'Could not create project');
    }

    showToast('Project created.', 'success');
    navigate('/hub');
  } catch (error) {
    console.error('Create project failed', error);
    showToast('Could not create project. Please try again.', 'error');
  }
}
/* ─── PUBLIC FORM ─── */
async function renderPublicForm() {
  const cfg = currentProject;
  setTopbarTitle('Share your fabric needs');
  updateSidebarForProject();
  updateRoleBadge();

  selectedFabrics = [];
  selectedApparel = [];
  selectedSource = '';

  const fabricHtml = cfg.fabrics.map(f =>
    `<div class="fabric-card" onclick="toggleFabric(this,'${f.name.replace(/'/g,"\\'")}')">
      <div class="fc-icon">${f.icon}</div>
      <div class="fc-name">${esc(f.name)}</div>
      <div class="fc-sub">${esc(f.sub)}</div>
    </div>`
  ).join('');

  const sourceHtml = cfg.sources.map(s =>
    `<button class="chip" onclick="selectSource(this,'${s.label.replace(/'/g,"\\'")}',${s.showsSalesperson ? 'true' : 'false'})">${esc(s.label)}</button>`
  ).join('');

  const fabricPropertyOptions = [
    'Moisture management',
    'Stretch & recovery',
    'Lightweight',
    'Color fastness',
    'UV protection',
    'Odor control',
    'Sustainability / Recycled',
    'Durability',
    'Soft hand feel',
    'Quick dry',
    'Other',
  ];

const productOptions = currentProject.productTypes || currentProject.apparelTypes || [
  'Activewear / Sportswear',
  'Workwear / Uniform',
  'Casualwear',
  'Medical / Healthcare',
  'Outerwear',
  'Other',
];

  const chipButton = (group, value) =>
    `<button class="chip" data-value="${esc(value)}" onclick="this.classList.toggle('selected'); if ('${group}' === 'productType' && '${value}' === 'Other') document.getElementById('product-other-field').style.display = this.classList.contains('selected') ? 'block' : 'none'; if ('${group}' === 'fabricProperties' && '${value}' === 'Other') document.getElementById('fabric-property-other-field').style.display = this.classList.contains('selected') ? 'block' : 'none';">${esc(value)}</button>`;

  const propertyHtml = fabricPropertyOptions.map(v => chipButton('fabricProperties', v)).join('');
  const productHtml = productOptions.map(v => chipButton('productType', v)).join('');
const quantityOptions = currentProject.estimatedOrderQuantityOptions || currentProject.quantityOptions || [
  'Under 500 kg',
  '500-2,000 kg',
  '2,000-10,000 kg',
  'Over 10,000 kg',
  'Not sure yet',
];

const followUpOptions = currentProject.followUpOptions || [
  'Email',
  'WhatsApp',
  'Line',
  'Phone call',
  'No need, just send moodboard',
];

const quantityHtml = quantityOptions
  .map(option => `<option>${esc(option)}</option>`)
  .join('');

const followUpHtml = followUpOptions
  .map(option => `<option>${esc(option)}</option>`)
  .join('');
  let spInner = '';
  if (cfg.salespeople && cfg.salespeople.length) {
    const opts = cfg.salespeople.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    spInner = `
      <div class="field" style="margin-top:10px;margin-bottom:0">
        <label>Sales person who assisted you</label>
        <select id="f-salesperson-select" onchange="onSalespersonSelectChange(this)">
          <option value="">Select...</option>${opts}
          <option value="__other__">Other...</option>
        </select>
      </div>
      <div class="field" id="salesperson-other-wrap" style="margin-top:8px;display:none;margin-bottom:0">
        <label>Please specify</label>
        <input id="f-salesperson" placeholder="Enter name">
      </div>`;
  } else {
    spInner = `
      <div class="field" style="margin-top:10px;margin-bottom:0">
        <label>Sales person who assisted you</label>
        <input id="f-salesperson" placeholder="e.g. Khun Nook">
      </div>`;
  }

  setContent(`
    <div id="form-view">
      <div class="hero-banner">
        <div class="hero-banner-overlay"></div>
        <div class="hero-banner-content">
          <h3>NYTG LeadPad</h3>
          <p>Fill in a few details and our team will follow up with the right fabric direction.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4><span class="material-symbols-outlined">person_add</span> Contact information</h4>
        </div>
        <div class="grid2">
          <div class="field"><label>Full name *</label><input id="f-name" placeholder="Your full name" autocomplete="name"></div>
          <div class="field"><label>Company name *</label><input id="f-company" placeholder="Company name" autocomplete="organization"></div>
        </div>
        <div class="grid2">
          <div class="field"><label>Email address *</label><input id="f-email" type="email" placeholder="work@email.com" autocomplete="email"></div>
          <div class="field">
            <label>Country *</label>
            <select id="f-country" onchange="document.getElementById('country-other-field').style.display = this.value === 'Other' ? 'block' : 'none';">
              <option value="">Select country...</option>
              <option>India</option>
              <option>Vietnam</option>
              <option>Hong Kong</option>
              <option>USA</option>
              <option>Thailand</option>
              <option>Bangladesh</option>
              <option>Indonesia</option>
              <option>China</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div class="field" id="country-other-field" style="display:none;margin-top:8px">
          <label>Please specify country *</label>
          <input id="f-country-other" placeholder="Enter country">
        </div>
        <div class="field">
          <label>Your role</label>
          <select id="f-buyer-role" onchange="document.getElementById('role-other-field').style.display = this.value === 'Other' ? 'block' : 'none';">
            <option value="">Select role...</option>
            <option>Buyer / Sourcing</option>
            <option>Product developer</option>
            <option>Designer</option>
            <option>Brand owner</option>
            <option>Manufacturer</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field" id="role-other-field" style="display:none;margin-top:8px;margin-bottom:0">
          <label>Please specify role</label>
          <input id="f-buyer-role-other" placeholder="Enter role">
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4><span class="material-symbols-outlined">sensors</span> How did you hear about us? *</h4>
        </div>
        <div class="chip-row" id="source-chips">${sourceHtml}</div>
        <div class="salesperson-field" id="other-source-field">
          <div class="field" style="margin-top:10px;margin-bottom:0">
            <label>Please specify</label>
            <input id="f-source-other" placeholder="e.g. Friend referral, Trade show...">
          </div>
        </div>
        <div class="salesperson-field" id="salesperson-field">${spInner}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4><span class="material-symbols-outlined">inventory_2</span> Fabric interest *</h4>
        </div>
        <div class="fabric-grid" id="fabric-cards">${fabricHtml}</div>

        <div style="margin-top:16px">
          <div class="field" style="margin-bottom:6px">
            <label>Fabric properties you need *</label>
          </div>
          <div class="chip-row" id="fabric-property-chips">${propertyHtml}</div>
          <div class="field" id="fabric-property-other-field" style="display:none;margin-top:8px;margin-bottom:0">
            <label>Please specify other fabric property *</label>
            <input id="f-fabric-property-other" placeholder="Enter fabric property">
          </div>
        </div>

        <div style="margin-top:16px">
          <div class="field" style="margin-bottom:6px">
            <label>What product are you developing?</label>
          </div>
          <div class="chip-row" id="product-type-chips">${productHtml}</div>
          <div class="field" id="product-other-field" style="display:none;margin-top:8px;margin-bottom:0">
            <label>Please specify product</label>
            <input id="f-product-other" placeholder="Enter product type">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4><span class="material-symbols-outlined">trending_up</span> Qualification</h4>
        </div>
        <div class="grid2">
          <div class="field">
            <label>Estimated order quantity per style / year</label>
            <select id="f-estimated-quantity">
${quantityHtml}
            </select>
          </div>
          <div class="field">
            <label>How would you like us to follow up?</label>
            <select id="f-follow-up" onchange="const method=this.value; const needsNumber=method==='WhatsApp'||method==='Phone call'; const needsLine=method==='Line'; document.getElementById('follow-up-contact-field').style.display=(needsNumber||needsLine)?'block':'none'; document.getElementById('follow-up-phone-fields').style.display=needsNumber?'grid':'none'; document.getElementById('follow-up-line-field').style.display=needsLine?'block':'none'; document.getElementById('follow-up-country-code-other-field').style.display='none';">
${followUpHtml}
              <option>No need, just send moodboard</option>
            </select>
          </div>
        </div>

        <div id="follow-up-contact-field" style="display:none;margin-top:8px">
          <div class="grid2" id="follow-up-phone-fields" style="display:none">
            <div class="field">
              <label>Country code *</label>
              <select id="f-follow-up-country-code" onchange="document.getElementById('follow-up-country-code-other-field').style.display = this.value === 'Other' ? 'block' : 'none';">
                <option value="">Select code...</option>
                <option value="+91">India +91</option>
                <option value="+66">Thailand +66</option>
                <option value="+84">Vietnam +84</option>
                <option value="+852">Hong Kong +852</option>
                <option value="+1">USA +1</option>
                <option value="+880">Bangladesh +880</option>
                <option value="+62">Indonesia +62</option>
                <option value="+86">China +86</option>
                <option value="+60">Malaysia +60</option>
                <option value="+65">Singapore +65</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="field">
              <label>WhatsApp / phone number *</label>
              <input id="f-follow-up-number" placeholder="Enter number">
            </div>
          </div>
          <div class="field" id="follow-up-country-code-other-field" style="display:none;margin-top:8px">
            <label>Please specify country code *</label>
            <input id="f-follow-up-country-code-other" placeholder="e.g. +44">
          </div>
          <div class="field" id="follow-up-line-field" style="display:none">
            <label>Line ID *</label>
            <input id="f-follow-up-line" placeholder="Enter Line ID">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h4><span class="material-symbols-outlined">chat_bubble</span> Specific preparation</h4>
        </div>
        <div class="field" style="margin-bottom:0">
          <textarea id="f-msg" placeholder="e.g. specific color, weight, certification needed"></textarea>
        </div>
      </div>

      <button class="btn-primary btn-teal" onclick="submitPublicForm()">
        <span class="material-symbols-outlined">send</span>
        Submit &amp; get moodboard
      </button>
    </div>

    <div id="success-view" style="display:none">
      <div class="card">
        <div class="success-box">
          <span class="success-icon">✅</span>
          <h3>Thank you!</h3>
          <p>Your moodboard link will be sent to<br><strong id="conf-email"></strong><br><br>Our team may follow up for further discussion.</p>
          <button class="btn-secondary" style="margin-top:16px" onclick="renderPublicForm()">Submit another</button>
        </div>
      </div>
    </div>
  `);

  subscribeLeads(cfg.key);
}
/* ─── DASHBOARD ─── */
async function renderDashPage() {
  const cfg = currentProject;
  setTopbarTitle('Lead Dashboard');
  updateSidebarForProject();
  updateRoleBadge();

  const filterPills = [
    { label: 'All', value: 'All', on: true },
    ...cfg.fabrics.map(f => ({ label: f.name, value: f.name })),
    { label: '🔥 Hot', value: 'Hot' },
    { label: 'Booth', value: 'Booth' },
    { label: 'Online', value: 'Online' },
  ].map(f =>
    `<button class="filter-pill${f.on ? ' on' : ''}" onclick="setFilter('${f.value.replace(/'/g,"\\'")}',this)">${esc(f.label)}</button>`
  ).join('');

  setContent(`
    <div class="section-head">
      <h2>Lead Dashboard</h2>
      <p>${esc(cfg.eventName)} · ${esc(cfg.venueLine || '')}</p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Total leads</div>
        <div class="stat-val" id="st-total">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🔥 Hot</div>
        <div class="stat-val" id="st-hot" style="color:var(--hot)">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🌤 Warm</div>
        <div class="stat-val" id="st-warm" style="color:var(--warm)">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">❄️ Cold</div>
        <div class="stat-val" id="st-cold" style="color:var(--cold)">—</div>
      </div>
    </div>

    <div class="dashboard-widgets" id="dashboard-widgets"></div>

    <div class="filter-row" id="dash-filters">${filterPills}</div>

    <div id="dash-list" class="lead-list">
      <div class="empty">
        <span class="material-symbols-outlined">inbox</span>
        Loading leads…
      </div>
    </div>
  `);

  activeFilter = 'All';
  await loadLeadsOnce(cfg.key);
  subscribeLeads(cfg.key);
}

function renderDashList() {
  const el = document.getElementById('dash-list');
  if (!el || !currentProject) return;

  const statTotal = document.getElementById('st-total');
  const statHot   = document.getElementById('st-hot');
  const statWarm  = document.getElementById('st-warm');
  const statCold  = document.getElementById('st-cold');
  if (statTotal) {
    statTotal.textContent = leads.length;
    statHot.textContent   = leads.filter(l => (l.manualTemp || l.autoTemp || l.priority) === 'Hot').length;
    statWarm.textContent  = leads.filter(l => (l.manualTemp || l.autoTemp || l.priority) === 'Warm').length;
    statCold.textContent  = leads.filter(l => (l.manualTemp || l.autoTemp || l.priority) === 'Cold').length;
  }
  renderDashboardWidgets();

  const priorities = currentProject.priorities.map(p => p.value);
  const filtered = leads.filter(l => {
    const temp = l.manualTemp || l.autoTemp || l.priority;
    if (activeFilter === 'All') return true;
    if (priorities.includes(activeFilter)) return temp === activeFilter;
    if (activeFilter === 'Booth') return l.source === 'Booth';
    if (activeFilter === 'Online') return l.source !== 'Booth';
    return l.fabric && l.fabric.includes(activeFilter);
  }).slice().reverse();

  el.innerHTML = filtered.length
    ? filtered.map(l => leadHTML(l, currentProject)).join('')
    : '<div class="empty"><span class="material-symbols-outlined">search_off</span>No leads match this filter.</div>';
}

function renderDashboardWidgets() {
  const el = document.getElementById('dashboard-widgets');
  if (!el || !currentProject) return;
  const widgets = currentProject.dashboardWidgets || BHARATTEX_DEFAULT.dashboardWidgets || [];
  el.innerHTML = widgets.map(type => {
    if (type === 'fabricInterest') {
      return barWidget('Fabric interest', 'Top requested fabric lines', countByCsv(leads, 'fabric'), 'var(--teal)');
    }
    if (type === 'sourceBreakdown') {
      return barWidget('Source breakdown', 'Where leads came from', countByField(leads, 'source'), 'var(--primary)');
    }
    if (type === 'salesperson') {
      return barWidget('Salesperson', 'Booth and referral ownership', countByField(leads, 'salesperson', 'Unassigned'), 'var(--warm)');
    }
    if (type === 'temperatureOverall') {
      const counts = ['Hot', 'Warm', 'Cold'].map(label => ({
        label,
        value: leads.filter(l => leadTemp(l) === label).length,
      }));
      return barWidget('Temperature overall', 'Auto score plus manual override', counts, 'var(--hot)');
    }
    if (type === 'timeline') return timelineWidget();
    return '';
  }).join('');
}

function barWidget(title, sub, rows, color) {
  const topRows = rows.filter(r => r.value > 0).slice(0, 5);
  const max = Math.max(1, ...topRows.map(r => r.value));
  const body = topRows.length ? topRows.map(r => {
    const pct = Math.max(4, Math.round((r.value / max) * 100));
    return `<div class="bar-row">
      <div>
        <div class="bar-label">${esc(r.label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>
      <div class="bar-value">${r.value}</div>
    </div>`;
  }).join('') : '<div class="empty" style="padding:18px 8px">No data yet.</div>';
  return `<div class="dash-widget">
    <div class="widget-head">
      <div class="widget-title">${esc(title)}</div>
      <div class="widget-sub">${esc(sub)}</div>
    </div>
    <div class="bar-list">${body}</div>
  </div>`;
}

function timelineWidget() {
  const rows = lastSevenDays().map(day => ({
    ...day,
    value: leads.filter(l => leadDateKey(l) === day.key).length,
  }));
  const max = Math.max(1, ...rows.map(r => r.value));
  const bars = rows.map(r => {
    const height = Math.max(4, Math.round((r.value / max) * 92));
    return `<div class="timeline-day">
      <div class="timeline-count">${r.value}</div>
      <div class="timeline-bar" style="height:${height}px"></div>
      <div class="timeline-label">${esc(r.label)}</div>
    </div>`;
  }).join('');
  return `<div class="dash-widget dash-widget-wide">
    <div class="widget-head">
      <div class="widget-title">Timeline</div>
      <div class="widget-sub">Leads over the last 7 days</div>
    </div>
    <div class="timeline-bars">${bars}</div>
  </div>`;
}

function countByCsv(items, field) {
  const counts = new Map();
  items.forEach(item => {
    String(item[field] || '').split(',').map(x => x.trim()).filter(Boolean)
      .forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  });
  return sortCounts(counts);
}

function countByField(items, field, fallback = '') {
  const counts = new Map();
  items.forEach(item => {
    const value = String(item[field] || fallback).trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return sortCounts(counts);
}

function sortCounts(counts) {
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function leadTemp(lead) {
  return lead.manualTemp || lead.autoTemp || lead.priority || 'Warm';
}

function lastSevenDays() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      key: dateKey(d),
      label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    });
  }
  return days;
}

function leadDateKey(lead) {
  if (lead.createdAt) {
    return dateKey(new Date(Number(lead.createdAt)));
  }

  const parsed = parseLeadTime(lead.time);
  return parsed ? dateKey(parsed) : '';
}

function parseLeadTime(value) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0));
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/* ─── BOOTH PAGE ─── */
async function renderBoothPage() {
  const cfg = currentProject;
  setTopbarTitle('Booth Entry');
  updateSidebarForProject();
  updateRoleBadge();
  subscribeLeads(cfg.key);
  boothFormOpen = false;

  const fabricOpts = [
    ...cfg.fabrics.map(f => `<option value="${esc(f.name)}">${esc(f.name)}</option>`),
    ...(cfg.fabricSelectExtras || []).map(n => `<option value="${esc(n)}">${esc(n)}</option>`),
  ].join('');

  const prioHtml = cfg.priorities.map(p =>
    `<div class="priority-opt">
      <input type="radio" name="b-priority" id="bp-${p.value.toLowerCase()}" value="${esc(p.value)}"${p.default ? ' checked' : ''}>
      <label for="bp-${p.value.toLowerCase()}" class="${esc(p.cssClass)}">${p.label}</label>
    </div>`
  ).join('');

  setContent(`
    <div class="section-head">
      <h2>Booth Entry</h2>
      <p>Add walk-in contacts directly from the booth.</p>
    </div>

    <div class="split-layout">
      <div>
        <button class="add-btn" id="add-btn" onclick="toggleBoothForm()">
          <span class="material-symbols-outlined" style="font-size:18px">add</span>
          Add new contact
        </button>

        <div id="booth-form" style="display:none">
          <div class="card">
            <div class="card-header">
              <h4><span class="material-symbols-outlined">person_add</span> New contact</h4>
              <span class="card-tag">${esc(cfg.boothId || cfg.orgName)}</span>
            </div>
            <div class="grid2">
              <div class="field"><label>Name *</label><input id="b-name" placeholder="Full name" tabindex="1"></div>
              <div class="field"><label>Company</label><input id="b-company" placeholder="Company" tabindex="2"></div>
              <div class="field"><label>Email</label><input id="b-email" type="email" placeholder="Email" tabindex="3"></div>
              <div class="field"><label>Country</label><input id="b-country" placeholder="Country" tabindex="4"></div>
            </div>
            <div class="grid2">
              <div class="field">
                <label>Fabric interest</label>
                <select id="b-fabric" tabindex="5"><option value="">Select...</option>${fabricOpts}</select>
              </div>
              <div class="field">
                <label>Sales person</label>
                <input id="b-sales" placeholder="Your name" tabindex="6">
              </div>
            </div>
            <div class="field">
              <label>Priority</label>
              <div class="priority-row" id="booth-priority-row">${prioHtml}</div>
            </div>
            <div class="field">
              <label>Note</label>
              <input id="b-note" placeholder="Quick note about this contact..." tabindex="7">
            </div>
            <div style="display:flex;gap:8px;margin-top:4px">
              <button class="btn-primary" style="width:auto;padding:10px 20px;margin-top:0" onclick="saveBoothLead()" tabindex="8">
                <span class="material-symbols-outlined">save</span> Save contact
              </button>
              <button class="btn-ghost" onclick="toggleBoothForm()">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:14px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:18px;color:var(--muted)">history</span> Recent contacts
          </div>
          <button class="btn-secondary" style="font-size:12px;padding:4px 12px" onclick="navigate('/${cfg.key}/dash')">
            View all <span class="material-symbols-outlined" style="font-size:14px">arrow_forward</span>
          </button>
        </div>
        <div id="booth-list" class="lead-list">
          <div class="empty">
            <span class="material-symbols-outlined">group_add</span>
            No contacts yet.
          </div>
        </div>
      </div>
    </div>
  `);
}

function renderBoothList() {
  const el = document.getElementById('booth-list');
  if (!el || !currentProject) return;
  const items = leads.filter(l => l.source === 'Booth').slice().reverse();
  el.innerHTML = items.length
    ? items.map(l => leadHTML(l, currentProject)).join('')
    : '<div class="empty"><span class="material-symbols-outlined">group_add</span>No contacts yet.</div>';
}

/* ════════════════════════════════════
   FORM INTERACTIONS
════════════════════════════════════ */
function selectSource(el, name, showsSalesperson) {
  const wasSelected = el.classList.contains('selected');
  document.querySelectorAll('#source-chips .chip').forEach(c => c.classList.remove('selected'));
  const sp = document.getElementById('salesperson-field');
  const otherField = document.getElementById('other-source-field');
  if (wasSelected) {
    selectedSource = '';
    if (sp) sp.classList.remove('show');
    if (otherField) otherField.classList.remove('show');
    return;
  }
  el.classList.add('selected');
  selectedSource = name;
  if (sp) sp.classList.toggle('show', !!showsSalesperson);
  if (otherField) otherField.classList.toggle('show', name === 'Other');
}

function onSalespersonSelectChange(sel) {
  const wrap = document.getElementById('salesperson-other-wrap');
  if (wrap) wrap.style.display = sel.value === '__other__' ? 'block' : 'none';
  const inp = document.getElementById('f-salesperson');
  if (inp && sel.value !== '__other__') inp.value = '';
}

function getSalesperson() {
  const sel = document.getElementById('f-salesperson-select');
  if (sel) {
    if (sel.value === '__other__') return (document.getElementById('f-salesperson')?.value || '').trim();
    return sel.value;
  }
  return (document.getElementById('f-salesperson')?.value || '').trim();
}

function toggleFabric(el, name) {
  const i = selectedFabrics.indexOf(name);
  if (i > -1) { selectedFabrics.splice(i, 1); el.classList.remove('selected'); }
  else { selectedFabrics.push(name); el.classList.add('selected'); }
}

function toggleChip(el, group) {
  el.classList.toggle('active');

  if (group === 'productType') {
    const otherField = document.getElementById('product-other-field');
    if (otherField) {
      const hasOther = !!document.querySelector('#product-type-chips .chip.active[data-value="Other"]');
      otherField.style.display = hasOther ? 'block' : 'none';
    }
  }

  if (group === 'fabricProperties') {
    const otherField = document.getElementById('fabric-property-other-field');
    if (otherField) {
      const hasOther = !!document.querySelector('#fabric-property-chips .chip.active[data-value="Other"]');
      otherField.style.display = hasOther ? 'block' : 'none';
    }
  }
}

/* ════════════════════════════════════
   PUBLIC FORM SUBMIT
════════════════════════════════════ */
function scoreLead(data, cfg) {
  const rules = cfg.scoringRules || BHARATTEX_DEFAULT.scoringRules || {};
  const weights = rules.weights || {};
  const thresholds = rules.thresholds || { hot: 70, warm: 35 };
  let score = 0;
  const fabrics = String(data.fabric || '').split(',').map(x => x.trim()).filter(Boolean);
  const apparel = String(data.apparel || '').split(',').map(x => x.trim()).filter(Boolean);
  if (fabrics.length) score += weights.fabricInterest || 0;
  if (apparel.length) score += weights.apparelInterest || 0;
  if (String(data.msg || '').trim().length >= 20) score += weights.message || 0;
  if (String(data.source || '').toLowerCase().includes('booth')) score += weights.boothSource || 0;
  if (String(data.salesperson || '').trim()) score += weights.salesperson || 0;
  if (String(data.company || '').trim()) score += weights.company || 0;
  if (String(data.email || '').trim()) score += weights.email || 0;
  score = Math.min(100, score);
  const temp = score >= thresholds.hot ? 'Hot' : score >= thresholds.warm ? 'Warm' : 'Cold';
  return { score, temp };
}

async function submitPublicForm() {
  const cfg = currentProject;

  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const company = document.getElementById('f-company').value.trim();

  const countrySelect = document.getElementById('f-country')?.value.trim() || '';
  const countryOther = document.getElementById('f-country-other')?.value.trim() || '';
  const country = countrySelect === 'Other' ? countryOther : countrySelect;

  const buyerRoleSelect = document.getElementById('f-buyer-role')?.value.trim() || '';
  const buyerRoleOther = document.getElementById('f-buyer-role-other')?.value.trim() || '';
  const buyerRole = buyerRoleSelect === 'Other' ? buyerRoleOther : buyerRoleSelect;

  const rawFabricProperties = Array.from(document.querySelectorAll('#fabric-property-chips .chip.selected'))
    .map(chip => chip.dataset.value || chip.textContent.trim())
    .filter(Boolean);

  const fabricPropertiesOther = document.getElementById('f-fabric-property-other')?.value.trim() || '';
  const fabricProperties = rawFabricProperties
    .map(value => value === 'Other' && fabricPropertiesOther ? fabricPropertiesOther : value)
    .filter(value => value !== 'Other' || fabricPropertiesOther);

  const productType = Array.from(document.querySelectorAll('#product-type-chips .chip.selected'))
    .map(chip => chip.dataset.value || chip.textContent.trim())
    .filter(Boolean);

  const productOther = document.getElementById('f-product-other')?.value.trim() || '';
  const finalProductType = productType
    .map(value => value === 'Other' && productOther ? productOther : value)
    .filter(value => value !== 'Other' || productOther);

  const estimatedOrderQuantity = document.getElementById('f-estimated-quantity')?.value.trim() || '';
  const followUpPreference = document.getElementById('f-follow-up')?.value.trim() || '';
  const specificRequest = document.getElementById('f-msg')?.value.trim() || '';

  let followUpCountryCode = '';
  let followUpContact = '';

  if (followUpPreference === 'WhatsApp' || followUpPreference === 'Phone call') {
    const codeSelect = document.getElementById('f-follow-up-country-code')?.value.trim() || '';
    const codeOther = document.getElementById('f-follow-up-country-code-other')?.value.trim() || '';
    followUpCountryCode = codeSelect === 'Other' ? codeOther : codeSelect;
    const number = document.getElementById('f-follow-up-number')?.value.trim() || '';
    followUpContact = [followUpCountryCode, number].filter(Boolean).join(' ');
  }

  if (followUpPreference === 'Line') {
    followUpContact = document.getElementById('f-follow-up-line')?.value.trim() || '';
  }

  if (!name || !email || !company) {
    showToast('Please fill in Name, Company and Email.', 'error');
    return;
  }

  if (!country) {
    showToast('Please select your country.', 'error');
    return;
  }

  if (!selectedFabrics.length) {
    showToast('Please select at least one fabric interest.', 'error');
    return;
  }

  if (!rawFabricProperties.length) {
    showToast('Please select at least one fabric property.', 'error');
    return;
  }

  if (rawFabricProperties.includes('Other') && !fabricPropertiesOther) {
    showToast('Please specify other fabric property.', 'error');
    return;
  }

  if ((followUpPreference === 'WhatsApp' || followUpPreference === 'Phone call') && !followUpContact) {
    showToast('Please enter your follow-up contact.', 'error');
    return;
  }

  if ((followUpPreference === 'WhatsApp' || followUpPreference === 'Phone call') && !followUpCountryCode) {
    showToast('Please select country code.', 'error');
    return;
  }

  if (followUpPreference === 'Line' && !followUpContact) {
    showToast('Please enter your Line ID.', 'error');
    return;
  }

  if (!selectedSource) {
    showToast('Please select how you heard about us.', 'error');
    return;
  }

  const src = cfg.sources.find(s => s.label === selectedSource);
  const salesperson = (src && src.showsSalesperson) ? getSalesperson() : '';
  const otherText = document.getElementById('f-source-other')?.value.trim() || '';
  const source = (selectedSource === 'Other' && otherText) ? otherText : selectedSource;

  const leadData = {
    name,
    email,
    company,
    country,
    buyerRole,

    source,
    salesperson,

    fabricInterest: selectedFabrics,
    fabricProperties,
    fabricPropertiesOther,
    productType: finalProductType,
    estimatedOrderQuantity,
    followUpPreference,
    followUpCountryCode,
    followUpContact,
    specificRequest,

    fabric: selectedFabrics.join(', '),
    fabrics: selectedFabrics,
    apparel: finalProductType.join(', '),
    apparelType: finalProductType.join(', '),
    msg: specificRequest,
    needs: specificRequest,

    note: '',
  };

  const autoScore = scoreLead(leadData, cfg);

  await saveLeadToProject(cfg.key, makeLead({
    ...leadData,
    priority: autoScore.temp,
    autoTemp: autoScore.temp,
    leadScore: autoScore.score,
    manualTemp: '',
  }));

  document.getElementById('conf-email').textContent = email;
  document.getElementById('form-view').style.display = 'none';
  document.getElementById('success-view').style.display = 'block';
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

async function saveBoothLead() {
  const cfg = currentProject;
  const name = document.getElementById('b-name').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }

  const priorityEl = document.querySelector('input[name="b-priority"]:checked');
  const defaultPriority = cfg.priorities.find(p => p.default)?.value || cfg.priorities[0].value;
  const priority = priorityEl ? priorityEl.value : defaultPriority;

  const leadData = {
    name,
    company:    document.getElementById('b-company').value.trim(),
    email:      document.getElementById('b-email').value.trim(),
    country:    document.getElementById('b-country').value.trim(),
    fabric:     document.getElementById('b-fabric').value,
    apparel: '', msg: '',
    source:     'Booth',
    salesperson: document.getElementById('b-sales').value.trim(),
    note:       document.getElementById('b-note').value.trim(),
  };
  const autoScore = scoreLead(leadData, cfg);

  await saveLeadToProject(cfg.key, makeLead({
    ...leadData,
    priority,
    autoTemp: autoScore.temp,
    leadScore: autoScore.score,
    manualTemp: priority,
  }));

  ['b-name','b-company','b-email','b-country','b-sales','b-note'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('b-fabric').value = '';
  const defaultRadio = document.querySelector(`input[name="b-priority"][value="${defaultPriority}"]`);
  if (defaultRadio) defaultRadio.checked = true;
  boothFormOpen = false;
  document.getElementById('booth-form').style.display = 'none';
  document.getElementById('add-btn').style.display = 'flex';
  showToast('Contact saved!', 'success');
}

/* ════════════════════════════════════
   FILTER / SORT
════════════════════════════════════ */
function setFilter(f, btn) {
  activeFilter = f;
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderDashList();
}

/* ════════════════════════════════════
   LEAD HTML CARD
════════════════════════════════════ */
function leadHTML(l, cfg) {
  const fabrics = (l.fabric || '').split(', ').filter(Boolean);
  const fabricBadges = fabrics.map(f => {
    const c = cfg.fabrics.find(x => x.name === f);
    return `<span class="badge ${c ? c.badgeClass : 'badge-gray'}">${esc(f)}</span>`;
  }).join('');

  const temp = l.manualTemp || l.autoTemp || l.priority;
  const pCfg = cfg.priorities.find(p => p.value === temp);
  const pClass = pCfg ? pCfg.badgeClass : 'badge-gray';
  const srcClass = l.source === 'Booth' ? 'badge-purple' : 'badge-gray';
  const salesBadge = l.salesperson ? `<span class="badge badge-gray">👤 ${esc(l.salesperson)}</span>` : '';
  const appParts = l.apparel ? l.apparel.split(', ') : [];
  const appBadge = appParts.length
    ? `<span class="badge badge-gray">${esc(appParts[0])}${appParts.length > 1 ? ' +' + (appParts.length - 1) : ''}</span>` : '';

  const manualIndicator = l.manualTemp
    ? `<span class="badge badge-amber" title="Manual override">✏️ ${esc(l.manualTemp)}</span>`
    : '';

  const scoreBadge = Number.isFinite(Number(l.leadScore))
    ? `<span class="badge badge-gray">Score ${Number(l.leadScore)}</span>`
    : '';

  const priorityOptions = cfg.priorities.map(p =>
    `<option${(l.manualTemp || l.priority) === p.value ? ' selected' : ''} value="${esc(p.value)}">${p.label}</option>`
  ).join('');

  const noteRow = l.note
    ? `<div class="note-text"><span class="material-symbols-outlined" style="font-size:13px">edit_note</span>${esc(l.note)}</div>` : '';

  const key = l._key || l.id;
  return `<div class="lead-card">
    <div class="lead-top">
      <div style="display:flex;gap:10px;align-items:flex-start;flex:1;min-width:0">
        <div class="lead-avatar">${initials(l.name)}</div>
        <div class="lead-info">
          <div class="lead-name">${esc(l.name)}</div>
          <div class="lead-sub">${esc(l.company || '—')}${l.country ? ' · ' + esc(l.country) : ''}${l.email ? ' · ' + esc(l.email) : ''}</div>
        </div>
      </div>
      <select class="priority-select" onchange="updateLeadTemp('${key}',this.value)">${priorityOptions}</select>
    </div>
    <div class="badges">${fabricBadges}${appBadge}<span class="badge ${srcClass}">${esc(l.source)}</span>${manualIndicator || '<span class="badge ' + pClass + '">' + esc(temp) + '</span>'}${scoreBadge}${salesBadge}</div>
    ${noteRow}
    <div class="note-area">
      <input class="note-input" id="note-${key}" placeholder="Add note..." value="${esc(l.note || '')}">
      <button class="btn-secondary" style="font-size:12px;padding:5px 12px;flex-shrink:0" onclick="saveNote('${key}')">Save</button>
    </div>
    <div class="lead-time">${esc(l.time)}</div>
  </div>`;
}

/* ════════════════════════════════════
   LEAD ACTIONS
════════════════════════════════════ */
async function updateLeadTemp(key, val) {
  if (!currentProject) return;
  await updateLeadInProject(currentProject.key, key, { manualTemp: val });
}

async function saveNote(key) {
  if (!currentProject) return;
  const note = document.getElementById('note-' + key).value.trim();
  await updateLeadInProject(currentProject.key, key, { note });
  showToast('Note saved!', 'success');
}

/* ════════════════════════════════════
   EXPORT CSV
════════════════════════════════════ */
function exportCSV() {
  if (!leads.length) { showToast('No leads to export yet.', 'error'); return; }

  const cfg = currentProject;
  const headers = [
    'Name',
    'Company',
    'Email',
    'Country',
    'Role',
    'Source',
    'Salesperson',
    'Fabric Interest',
    'Fabric Properties',
    'Product Type',
    'Estimated Quantity',
    'Follow Up Method',
    'Follow Up Contact',
    'Specific Request',
    'Priority',
    'Note',
    'Time'
  ];

  const formatExportTime = (lead) => {
    if (lead.time) return lead.time;
    if (lead.createdAt) return new Date(Number(lead.createdAt)).toLocaleString();
    return '';
  };

  const formatList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(' / ');
    return value || '';
  };

  const formatFabricInterest = (lead) => {
    if (Array.isArray(lead.fabricInterest)) return lead.fabricInterest.join(' / ');
    if (Array.isArray(lead.fabrics)) return lead.fabrics.join(' / ');
    return lead.fabric || '';
  };

  const formatFabricProperties = (lead) => {
    const props = Array.isArray(lead.fabricProperties)
      ? [...lead.fabricProperties]
      : String(lead.fabricProperties || '').split(',').map(v => v.trim()).filter(Boolean);

    if (lead.fabricPropertiesOther && !props.includes(lead.fabricPropertiesOther)) {
      props.push(lead.fabricPropertiesOther);
    }

    return props.filter(Boolean).join(' / ');
  };

  const formatProductType = (lead) => {
    if (Array.isArray(lead.productType)) return lead.productType.join(' / ');
    return lead.apparelType || lead.apparel || '';
  };

  const formatFollowUpContact = (lead) => {
    return lead.followUpContact || '';
  };

  const formatMessage = (lead) => {
    return lead.specificRequest || lead.msg || lead.message || lead.needs || '';
  };

  const rows = leads.map(l => {
    const temp = l.manualTemp || l.autoTemp || l.priority;
    return [
      l.name,
      l.company,
      l.email,
      l.country,
      l.buyerRole,
      l.source,
      l.salesperson,
      formatFabricInterest(l),
      formatFabricProperties(l),
      formatProductType(l),
      l.estimatedOrderQuantity,
      l.followUpPreference,
      formatFollowUpContact(l),
      formatMessage(l),
      temp,
      l.note,
      formatExportTime(l)
    ]
      .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
      .join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = `${cfg.orgName}_${cfg.eventName.replace(/\s+/g, '_')}_Leads_` + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  closeSidebar();
}
/* ════════════════════════════════════
   BREVO EMAIL
════════════════════════════════════ */

/* ════════════════════════════════════
   HELPERS
════════════════════════════════════ */
function makeLead(data) {
  return { id: Date.now() + Math.random(), ...data, time: new Date().toLocaleString('en-GB') };
}
function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════════════
   TOAST
════════════════════════════════════ */
let toastTimeout;
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(100px);padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:9999;transition:transform .25s ease;white-space:nowrap;pointer-events:none;`;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#E24B4A' : '#1D9E75';
  toast.style.color = '#fff';
  clearTimeout(toastTimeout);
  requestAnimationFrame(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; });
  toastTimeout = setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(100px)'; }, 2500);
}

/* ════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSidebar();
  if (session.role && currentProject) {
    if (e.key === 'b' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); navigate(`/${currentProject.key}/booth`); }
    if (e.key === 'd' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); navigate(`/${currentProject.key}/dash`); }
  }
});

/* ════════════════════════════════════
   EXPOSE GLOBALS (type="module" requirement)
════════════════════════════════════ */
function logout() {
  sessionStorage.removeItem('leadpadAccess');
  window.location.href = '#/login';
  window.location.reload();
}
window.toggleSidebar   = toggleSidebar;
window.closeSidebar    = closeSidebar;
window.navigate        = navigate;
window.goHome          = goHome;
window.doLogin         = () => {
  const pw = document.getElementById('pw-input')?.value || '';
  tryLogin(pw, session.projectKey || 'bharattex2026');
};
window.logout          = logout;
window.selectSource    = selectSource;
window.toggleFabric    = toggleFabric;
window.toggleChip      = toggleChip;
window.onSalespersonSelectChange = onSalespersonSelectChange;
window.submitPublicForm = submitPublicForm;
window.syncProjectSlug = syncProjectSlug;
window.submitCreateProject = submitCreateProject;
window.submitProjectSettings = submitProjectSettings;
window.renderPublicForm = renderPublicForm;
window.toggleBoothForm = toggleBoothForm;
window.saveBoothLead   = saveBoothLead;
window.exportCSV       = exportCSV;
window.updateLeadTemp  = updateLeadTemp;
window.saveNote        = saveNote;
window.setFilter       = setFilter;
window.renderDashList  = renderDashList;
window.renderBoothList = renderBoothList;

/* ════════════════════════════════════
   BOOT — Hash Router
════════════════════════════════════ */
window.addEventListener('hashchange', route);

if (!location.hash || location.hash === '#' || location.hash === '#/') {
  location.hash = '/';
}
route();
