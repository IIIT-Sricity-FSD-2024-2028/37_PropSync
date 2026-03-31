/* ============================================================
   LOADER — Assembles the app shell from inline <template> tags.
   No fetch() calls — works when opened directly as a file OR
   served from any HTTP server (Live Server, npx serve, etc.).
   ============================================================ */

const PAGE_TEMPLATE_IDS = [
  'tpl-page-dashboard',
  'tpl-page-participants',
  'tpl-page-roles',
  'tpl-page-configuration',
  'tpl-page-complaints',
  'tpl-page-notifications',
  'tpl-page-profile',
];

function cloneTemplate(id) {
  const tpl = document.getElementById(id);
  if (!tpl) throw new Error('Template #' + id + ' not found in index.html');
  return document.importNode(tpl.content, true);
}

function loadAppShell() {
  try {
    var app = document.getElementById('app');

    /* 1. Sidebar */
    var sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'sidebar-container';
    sidebarContainer.appendChild(cloneTemplate('tpl-sidebar'));
    app.appendChild(sidebarContainer);

    /* 2. Main content wrapper */
    var mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    app.appendChild(mainContent);

    /* 3. Header */
    var headerContainer = document.createElement('div');
    headerContainer.id = 'header-container';
    headerContainer.appendChild(cloneTemplate('tpl-header'));
    mainContent.appendChild(headerContainer);

    /* 4. Page content wrapper */
    var pageContent = document.createElement('main');
    pageContent.id = 'page-content';
    mainContent.appendChild(pageContent);

    /* 5. All page fragments */
    PAGE_TEMPLATE_IDS.forEach(function(id) {
      var fragment = cloneTemplate(id);
      var pageEl = fragment.firstElementChild;
      if (pageEl) pageContent.appendChild(pageEl);
    });

    /* 6. Modals — on <body>, outside #app */
    var modalsContainer = document.createElement('div');
    modalsContainer.id = 'modals-container';
    modalsContainer.appendChild(cloneTemplate('tpl-modals'));
    document.body.appendChild(modalsContainer);

    return Promise.resolve();

  } catch (err) {
    return Promise.reject(err);
  }
}
