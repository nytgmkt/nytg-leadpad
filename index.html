<!DOCTYPE html>
<html lang="en" class="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title id="page-title">LeadPad</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
<style>
/* ── Reset & Tokens ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:#004AC6;--primary-dk:#003A9E;--primary-lt:#EEF2FF;--primary-mid:rgba(0,74,198,.12);
  --teal:#1D9E75;--teal-dk:#17866A;--teal-lt:#ECFDF5;
  --hot:#DC2626;--warm:#D97706;--cold:#2563EB;
  --ink:#111827;--muted:#6B7280;--border:#E5E8EE;
  --surface:#FFFFFF;--surface2:#F8FAFC;--bg:#F2F5F9;
  --shadow-sm:0 1px 3px rgba(0,0,0,.08);
  --shadow-md:0 4px 16px rgba(0,0,0,.10);
  --radius:8px;--radius-lg:12px;--radius-xl:16px;
  --sidebar-w:260px;
}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;overflow-x:hidden}
.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;vertical-align:middle;line-height:1}

/* ── App Shell ── */
.app{display:flex;min-height:100vh}
.main{flex:1;display:flex;flex-direction:column;min-width:0}

/* ── Sidebar ── */
.sidebar{
  width:var(--sidebar-w);flex-shrink:0;
  background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;
  position:fixed;top:0;left:0;height:100vh;z-index:200;
  transition:transform .25s ease;
}
.sidebar-brand{padding:20px 20px 16px;border-bottom:1px solid var(--border)}
.sidebar-brand-title{font-size:15px;font-weight:700;color:var(--primary);letter-spacing:-.01em}
.sidebar-brand-sub{font-size:11px;color:var(--muted);margin-top:2px;font-family:'DM Mono',monospace}
.sidebar-booth-badge{
  margin:10px 12px;padding:10px 12px;border-radius:var(--radius-lg);
  background:var(--teal-lt);border:1px solid rgba(29,158,117,.2);
  display:flex;align-items:center;gap:8px;
}
.sidebar-booth-badge .material-symbols-outlined{font-size:18px;color:var(--teal)}
.sidebar-booth-badge-text{font-size:12px;font-weight:600;color:var(--teal-dk)}
.sidebar-booth-badge-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;margin-left:auto;flex-shrink:0;box-shadow:0 0 0 2px rgba(34,197,94,.25)}
.sidebar-section-label{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;padding:10px 16px 4px}
.sidebar-nav{flex:1;padding:0 8px;overflow-y:auto}
.nav-item{
  width:100%;text-align:left;
  display:flex;align-items:center;gap:10px;padding:9px 12px;
  border-radius:var(--radius);border:none;background:none;cursor:pointer;
  font-size:14px;font-weight:500;color:var(--ink);transition:background .15s;
}
.nav-item:hover{background:var(--surface2)}
.nav-item.active{background:var(--primary-lt);color:var(--primary)}
.nav-item .material-symbols-outlined{font-size:18px}
.nav-divider{height:1px;background:var(--border);margin:6px 8px}
.sidebar-footer{padding:16px 20px;border-top:1px solid var(--border)}
.sidebar-footer-text{font-size:11px;color:var(--muted)}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:199;opacity:0;pointer-events:none;transition:opacity .25s}
.sidebar-overlay.open{opacity:1;pointer-events:all}

/* ── Topbar ── */
.topbar{
  position:sticky;top:0;z-index:100;
  height:56px;display:flex;align-items:center;gap:12px;padding:0 20px;
  background:var(--surface);border-bottom:1px solid var(--border);
}
.topbar-hamburger{
  display:none;width:36px;height:36px;border:1px solid var(--border);
  border-radius:var(--radius);background:var(--surface2);cursor:pointer;
  align-items:center;justify-content:center;flex-shrink:0;
}
.topbar-title{font-size:16px;font-weight:700;flex:1;letter-spacing:-.01em}
.topbar-right{display:flex;align-items:center;gap:8px}
.topbar-stat-pill{
  display:flex;align-items:center;gap:6px;
  padding:5px 12px;background:var(--primary-lt);border-radius:20px;
  font-size:13px;font-weight:600;color:var(--primary);
}
.topbar-stat-pill .material-symbols-outlined{font-size:16px}
.topbar-role-badge{
  padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
  letter-spacing:.04em;text-transform:uppercase;
}
.role-admin{background:#FEF3C7;color:#92400E}
.role-creator{background:var(--primary-lt);color:var(--primary)}
.role-user{background:var(--teal-lt);color:var(--teal-dk)}

/* ── Page Content ── */
.page-content{flex:1;padding:20px;max-width:1200px;width:100%;margin:0 auto;}
.page{display:none}
.page.active{display:block}

/* ── Cards ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:20px;margin-bottom:16px}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.card-header h4{font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--ink)}
.card-header h4 .material-symbols-outlined{font-size:18px;color:var(--primary)}
.card-tag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:var(--surface2);border:1px solid var(--border);padding:3px 8px;border-radius:20px}

/* ── Forms ── */
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.field label{font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
input,select,textarea{
  width:100%;padding:9px 12px;
  border:1.5px solid var(--border);border-radius:var(--radius);
  font-family:'DM Sans',sans-serif;font-size:14px;background:var(--surface);
  color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s;
}
input:focus,select:focus,textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-mid)}
textarea{resize:vertical;min-height:80px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}

/* ── Chips ── */
.chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.chip{
  padding:5px 14px;border:1.5px solid var(--border);border-radius:20px;
  background:var(--surface);cursor:pointer;font-size:13px;font-weight:500;
  color:var(--ink);transition:all .15s;
}
.chip:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-lt)}
.chip.selected{border-color:var(--primary);background:var(--primary);color:#fff}

/* ── Fabric Cards ── */
.fabric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px}
.fabric-card{
  border:1.5px solid var(--border);border-radius:var(--radius-lg);
  padding:14px 10px;text-align:center;cursor:pointer;
  transition:all .15s;background:var(--surface);
}
.fabric-card:hover{border-color:var(--primary);box-shadow:var(--shadow-sm)}
.fabric-card.selected{border-color:var(--primary);background:var(--primary-lt)}
.fc-icon{font-size:24px;margin-bottom:6px}
.fc-name{font-size:13px;font-weight:700;color:var(--ink)}
.fc-sub{font-size:11px;color:var(--muted);margin-top:2px}

/* ── Priority Radios ── */
.priority-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.priority-opt{position:relative}
.priority-opt input{position:absolute;opacity:0;width:0;height:0}
.priority-opt label{
  display:block;cursor:pointer;
  padding:8px 6px;border:1.5px solid var(--border);border-radius:var(--radius);
  font-size:12px;font-weight:600;text-align:center;min-width:64px;
  transition:all .15s;white-space:nowrap;
}
.priority-opt input:checked+label.p-hot{border-color:var(--hot);background:#FEF2F2;color:var(--hot)}
.priority-opt input:checked+label.p-warm{border-color:var(--warm);background:#FFFBEB;color:var(--warm)}
.priority-opt input:checked+label.p-cold{border-color:var(--cold);background:#EFF6FF;color:var(--cold)}

/* ── Buttons ── */
.btn-primary{
  width:100%;padding:11px 20px;background:var(--primary);
  color:#fff;border:none;border-radius:var(--radius);cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:background .15s;margin-top:8px;
}
.btn-primary:hover{background:var(--primary-dk)}
.btn-teal{background:var(--teal)}
.btn-teal:hover{background:var(--teal-dk)}
.btn-secondary{
  padding:8px 16px;border:1.5px solid var(--border);border-radius:var(--radius);
  background:var(--surface);cursor:pointer;font-family:'DM Sans',sans-serif;
  font-size:13px;font-weight:600;color:var(--ink);display:inline-flex;
  align-items:center;gap:6px;transition:all .15s;
}
.btn-secondary:hover{border-color:var(--primary);color:var(--primary)}
.btn-ghost{
  padding:8px 16px;border:none;border-radius:var(--radius);
  background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;
  font-size:13px;font-weight:600;color:var(--muted);transition:color .15s;
}
.btn-ghost:hover{color:var(--ink)}

/* ── Dashboard ── */
.section-head{margin-bottom:20px}
.section-head h2{font-size:22px;font-weight:800;letter-spacing:-.02em}
.section-head p{color:var(--muted);font-size:14px;margin-top:4px}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.stat-card{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:16px;text-align:center;
}
.stat-label{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.stat-val{font-size:28px;font-weight:800;color:var(--ink);letter-spacing:-.02em}
.filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.filter-pill{
  padding:4px 13px;border:1.5px solid var(--border);border-radius:20px;
  background:var(--surface);cursor:pointer;font-size:12px;font-weight:600;
  color:var(--muted);transition:all .15s;
}
.filter-pill:hover,.filter-pill.on{border-color:var(--primary);background:var(--primary-lt);color:var(--primary)}
.lead-list{display:flex;flex-direction:column;gap:10px}
.lead-card{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:14px 16px;
}
.lead-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
.lead-avatar{
  width:36px;height:36px;border-radius:50%;
  background:var(--primary-lt);color:var(--primary);
  font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.lead-info{flex:1;min-width:0}
.lead-name{font-size:14px;font-weight:700}
.lead-sub{font-size:12px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.priority-select{
  border:1.5px solid var(--border);border-radius:var(--radius);
  padding:4px 8px;font-size:12px;font-weight:600;cursor:pointer;background:var(--surface);
}
.badges{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
.badge{padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600}
.badge-teal{background:#ECFDF5;color:#065F46}
.badge-blue{background:#EFF6FF;color:#1D4ED8}
.badge-amber{background:#FFFBEB;color:#92400E}
.badge-red{background:#FEF2F2;color:#991B1B}
.badge-purple{background:#F5F3FF;color:#5B21B6}
.badge-gray{background:var(--surface2);color:var(--muted);border:1px solid var(--border)}
.note-area{display:flex;gap:8px;margin-top:8px}
.note-input{flex:1;padding:6px 10px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:13px}
.note-text{font-size:12px;color:var(--muted);margin-bottom:4px;display:flex;align-items:center;gap:4px}
.lead-time{font-size:11px;color:var(--muted);margin-top:8px;font-family:'DM Mono',monospace}
.empty{text-align:center;padding:40px 20px;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:8px}
.empty .material-symbols-outlined{font-size:36px;opacity:.4}

/* ── Salesperson toggle ── */
.salesperson-field{display:none}
.salesperson-field.show{display:block}

/* ── Hero Banner ── */
.hero-banner{
  position:relative;border-radius:var(--radius-xl);overflow:hidden;
  background:linear-gradient(135deg,var(--primary) 0%,#1E40AF 100%);
  padding:32px 24px;margin-bottom:16px;color:#fff;
}
.hero-banner-overlay{
  position:absolute;inset:0;
  background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.hero-banner-content{position:relative}
.hero-banner-content h3{font-size:22px;font-weight:800;margin-bottom:6px;letter-spacing:-.02em}
.hero-banner-content p{font-size:14px;opacity:.85;line-height:1.6}

/* ── Success ── */
.success-box{text-align:center;padding:20px 0}
.success-icon{font-size:48px;display:block;margin-bottom:12px}
.success-box h3{font-size:22px;font-weight:800;margin-bottom:8px}
.success-box p{color:var(--muted);line-height:1.7}

/* ── Password screen ── */
.pw-screen{display:flex;align-items:center;justify-content:center;padding:40px 20px}
.pw-box{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);
  padding:28px 24px;width:100%;max-width:360px;box-shadow:var(--shadow-md);text-align:center;
}
.pw-box .material-symbols-outlined{font-size:40px;color:var(--primary);margin-bottom:8px}
.pw-box h3{font-size:20px;font-weight:800;margin-bottom:6px}
.pw-box p{color:var(--muted);font-size:14px;line-height:1.6;margin-bottom:16px}
.pw-box input{
  width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:var(--radius);
  font-size:16px;text-align:center;letter-spacing:.2em;margin-bottom:10px;
}
.pw-box input:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-mid)}
.pw-error{color:var(--hot);font-size:12px;font-weight:600;margin-bottom:10px;display:none}

/* ── Hub page (project list) ── */
.hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:20px}
.project-card{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);
  padding:20px;cursor:pointer;transition:all .2s;display:block;text-decoration:none;color:inherit;
}
.project-card:hover{border-color:var(--primary);box-shadow:var(--shadow-md);transform:translateY(-2px)}
.project-card-icon{width:44px;height:44px;border-radius:var(--radius-lg);background:var(--primary-lt);
  display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.project-card-icon .material-symbols-outlined{font-size:22px;color:var(--primary)}
.project-card-name{font-size:16px;font-weight:800;margin-bottom:4px}
.project-card-sub{font-size:12px;color:var(--muted);margin-bottom:12px}
.project-card-stats{display:flex;gap:8px}
.project-stat{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:var(--surface2);border:1px solid var(--border);color:var(--muted)}

/* ── Home / role selector ── */
.home-screen{min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center}
.home-logo{font-size:48px;margin-bottom:16px}
.home-title{font-size:28px;font-weight:900;letter-spacing:-.03em;margin-bottom:8px}
.home-sub{color:var(--muted);font-size:15px;margin-bottom:32px;line-height:1.6}
.role-cards{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:520px}
.role-card{
  flex:1;min-width:140px;max-width:200px;
  background:var(--surface);border:2px solid var(--border);border-radius:var(--radius-xl);
  padding:20px 16px;cursor:pointer;transition:all .2s;text-align:center;
}
.role-card:hover{border-color:var(--primary);box-shadow:var(--shadow-md);transform:translateY(-3px)}
.role-card .material-symbols-outlined{font-size:32px;color:var(--primary);margin-bottom:8px;display:block}
.role-card-label{font-size:14px;font-weight:700}
.role-card-desc{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4}

/* ── Booth add btn ── */
.add-btn{
  width:100%;padding:14px;border:1.5px dashed var(--border);border-radius:var(--radius-xl);
  background:var(--surface);cursor:pointer;font-size:14px;font-weight:600;
  color:var(--primary);display:flex;align-items:center;justify-content:center;gap:8px;
  transition:all .15s;margin-bottom:16px;
}
.add-btn:hover{border-color:var(--primary);background:var(--primary-lt)}

/* ── Split layout ── */
.split-layout{display:grid;grid-template-columns:1fr 1fr;gap:16px}

/* ── Responsive ── */
@media(max-width:1024px){
  .sidebar{transform:translateX(calc(-1 * var(--sidebar-w)))}
  .sidebar.open{transform:translateX(0)}
  .topbar-hamburger{display:flex}
  .main{margin-left:0!important}
  .split-layout{grid-template-columns:1fr}
  .stats-row{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:640px){
  .page-content{padding:12px}
  .grid2,.grid3{grid-template-columns:1fr}
  .fabric-grid{grid-template-columns:repeat(3,1fr)}
  .stats-row{grid-template-columns:repeat(2,1fr)}
  .hero-banner{padding:24px 16px}
  .hero-banner-content h3{font-size:18px}
}
@media(max-width:360px){
  .fabric-grid{grid-template-columns:1fr 1fr}
  .stats-row{grid-template-columns:1fr 1fr}
}
@media(min-width:1025px){
  .main{margin-left:var(--sidebar-w)}
}
</style>
</head>
<body>

<!-- SIDEBAR OVERLAY (mobile) -->
<div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>

<!-- APP WRAPPER -->
<div class="app">

  <!-- ════════ SIDEBAR ════════ -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-title" id="sidebar-brand-title">NYTG LeadPad</div>
      <div class="sidebar-brand-sub" id="sidebar-brand-sub">Lead Management</div>
    </div>

    <!-- Booth sync badge (shown when logged in) -->
    <div class="sidebar-booth-badge" id="sidebar-booth-badge" style="display:none">
      <span class="material-symbols-outlined">store</span>
      <div>
        <div class="sidebar-booth-badge-text" id="sidebar-booth-badge-text">Booth Active</div>
        <div style="font-size:10px;color:var(--teal-dk)">Lead Sync Active</div>
      </div>
      <div class="sidebar-booth-badge-dot"></div>
    </div>

    <div class="sidebar-nav" id="sidebar-nav" style="padding-top:12px">
      <!-- Populated by router -->
    </div>

    <div class="sidebar-footer">
      <div class="sidebar-footer-text" id="sidebar-footer-text">NYTG LeadPad v2</div>
    </div>
  </aside>

  <!-- ════════ MAIN ════════ -->
  <div class="main">

    <!-- TOP BAR -->
    <header class="topbar">
      <button class="topbar-hamburger" onclick="toggleSidebar()" aria-label="Menu">
        <span class="material-symbols-outlined" style="font-size:20px">menu</span>
      </button>
      <div class="topbar-title" id="topbar-title">LeadPad</div>
      <div class="topbar-right">
        <div class="topbar-stat-pill" id="topbar-leads" style="display:none">
          <span class="material-symbols-outlined">group</span>
          <span id="topbar-leads-count">0</span> leads
        </div>
        <div id="topbar-role-badge" class="topbar-role-badge" style="display:none"></div>
      </div>
    </header>

    <!-- PAGE CONTENT (router renders here) -->
    <div class="page-content" id="page-content">
      <div style="text-align:center;padding:60px 20px;color:var(--muted)">
        <span class="material-symbols-outlined" style="font-size:40px;opacity:.4">hourglass_top</span>
        <div style="margin-top:8px;font-size:14px">Loading…</div>
      </div>
    </div>

  </div><!-- /main -->
</div><!-- /app -->

<script type="module" src="leadpad.js?v=8"></script>
</body>
</html>
