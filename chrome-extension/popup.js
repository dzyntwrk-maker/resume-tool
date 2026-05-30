// Smart Tab Manager — popup logic

let allTabs = [];
let searchQuery = "";

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  allTabs = await chrome.tabs.query({});
  document.getElementById("tab-count").textContent = `${allTabs.length} tabs`;
  renderTabsPanel();
  renderDupesPanel();
  renderSavedGroups();
}

// ── Navigation ────────────────────────────────────────────────────────────────
document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.panel).classList.add("active");
  });
});

// ── Search ────────────────────────────────────────────────────────────────────
document.getElementById("search").addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase();
  renderTabsPanel();
});

// ── Tabs Panel ────────────────────────────────────────────────────────────────
function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function getFavicon(url) {
  try { const u = new URL(url); return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=16`; }
  catch { return ""; }
}

function renderTabsPanel() {
  const panel = document.getElementById("tabs-panel");
  const filtered = searchQuery
    ? allTabs.filter((t) => (t.title || "").toLowerCase().includes(searchQuery) || (t.url || "").toLowerCase().includes(searchQuery))
    : allTabs;

  if (filtered.length === 0) {
    panel.innerHTML = `<div class="empty">${searchQuery ? "No tabs match your search." : "No tabs open."}</div>`;
    return;
  }

  // Group by domain
  const groups = {};
  for (const tab of filtered) {
    const domain = getDomain(tab.url || "");
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(tab);
  }

  const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  panel.innerHTML = sorted.map(([domain, tabs]) => `
    <div class="domain-group">
      <div class="domain-header" onclick="toggleGroup('${domain}')">
        <img class="domain-favicon" src="${getFavicon(tabs[0].url)}" onerror="this.style.display='none'">
        <span class="domain-name">${domain}</span>
        <span class="domain-badge">${tabs.length}</span>
      </div>
      <div class="tab-list open" id="group-${CSS.escape(domain)}">
        ${tabs.map((tab) => `
          <div class="tab-item" onclick="goToTab(${tab.id})">
            <span class="tab-title" title="${escHtml(tab.title || tab.url)}">${escHtml(tab.title || tab.url)}</span>
            <span class="tab-close" onclick="closeTab(event, ${tab.id})">✕</span>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function toggleGroup(domain) {
  const el = document.getElementById(`group-${CSS.escape(domain)}`);
  if (el) el.classList.toggle("open");
}

async function goToTab(tabId) {
  await chrome.tabs.update(tabId, { active: true });
  const tab = await chrome.tabs.get(tabId);
  await chrome.windows.update(tab.windowId, { focused: true });
  window.close();
}

async function closeTab(e, tabId) {
  e.stopPropagation();
  await chrome.tabs.remove(tabId);
  allTabs = allTabs.filter((t) => t.id !== tabId);
  document.getElementById("tab-count").textContent = `${allTabs.length} tabs`;
  renderTabsPanel();
  renderDupesPanel();
}

// ── Saved Groups ──────────────────────────────────────────────────────────────
async function getSavedGroups() {
  const data = await chrome.storage.local.get("tabGroups");
  return data.tabGroups || [];
}

async function renderSavedGroups() {
  const groups = await getSavedGroups();
  const list = document.getElementById("saved-groups-list");
  if (groups.length === 0) {
    list.innerHTML = `<div class="empty">No saved groups yet.<br>Use "Save All" to save your current tabs.</div>`;
    return;
  }
  list.innerHTML = groups.map((g, i) => `
    <div class="saved-group">
      <div class="saved-group-header">
        <div>
          <div class="saved-group-name">${escHtml(g.name)}</div>
          <div class="saved-group-meta">${g.tabs.length} tabs · saved ${timeAgo(g.savedAt)}</div>
        </div>
        <div class="saved-group-actions">
          <button class="btn-sm btn-restore" onclick="restoreGroup(${i})">Restore</button>
          <button class="btn-sm btn-delete" onclick="deleteGroup(${i})">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

document.getElementById("save-group-btn").addEventListener("click", async () => {
  const name = document.getElementById("group-name").value.trim() || `Group ${new Date().toLocaleTimeString()}`;
  const groups = await getSavedGroups();
  groups.unshift({ name, tabs: allTabs.map((t) => ({ url: t.url, title: t.title })), savedAt: Date.now() });
  await chrome.storage.local.set({ tabGroups: groups });
  document.getElementById("group-name").value = "";
  renderSavedGroups();
});

async function restoreGroup(index) {
  const groups = await getSavedGroups();
  const group = groups[index];
  for (const tab of group.tabs) {
    await chrome.tabs.create({ url: tab.url, active: false });
  }
  window.close();
}

async function deleteGroup(index) {
  const groups = await getSavedGroups();
  groups.splice(index, 1);
  await chrome.storage.local.set({ tabGroups: groups });
  renderSavedGroups();
}

// ── Duplicates Panel ──────────────────────────────────────────────────────────
function normalizeUrl(url) {
  try { const u = new URL(url); return `${u.hostname}${u.pathname}`.replace(/\/$/, ""); }
  catch { return url; }
}

async function renderDupesPanel() {
  const panel = document.getElementById("dupes-panel");
  const { dismissedDupes = [] } = await chrome.storage.local.get("dismissedDupes");

  const urlMap = new Map();
  for (const tab of allTabs) {
    if (!tab.url || tab.url.startsWith("chrome")) continue;
    const key = normalizeUrl(tab.url);
    if (!urlMap.has(key)) urlMap.set(key, []);
    urlMap.get(key).push(tab);
  }

  const dupes = [...urlMap.entries()]
    .filter(([key, tabs]) => tabs.length > 1 && !dismissedDupes.includes(key));

  const badge = document.getElementById("dupe-badge");
  if (dupes.length > 0) {
    badge.style.display = "inline";
    badge.textContent = dupes.length;
  } else {
    badge.style.display = "none";
  }

  if (dupes.length === 0) {
    panel.innerHTML = `<div class="empty">No duplicate tabs detected.</div>`;
    return;
  }

  panel.innerHTML = dupes.map(([key, tabs]) => `
    <div class="dupe-item">
      <div class="dupe-url">${escHtml(tabs[0].title || key)}</div>
      <div class="dupe-tabs">${tabs.length} copies open</div>
      <button class="btn-close-dupes" onclick="closeDupes('${key}', [${tabs.slice(1).map((t) => t.id).join(",")}])">Close Extras</button>
      <button class="btn-dismiss" onclick="dismissDupe('${key}')">Dismiss</button>
    </div>
  `).join("");
}

async function closeDupes(key, tabIds) {
  for (const id of tabIds) await chrome.tabs.remove(id);
  allTabs = allTabs.filter((t) => !tabIds.includes(t.id));
  renderTabsPanel();
  renderDupesPanel();
}

async function dismissDupe(key) {
  const { dismissedDupes = [] } = await chrome.storage.local.get("dismissedDupes");
  dismissedDupes.push(key);
  await chrome.storage.local.set({ dismissedDupes });
  renderDupesPanel();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

init();
