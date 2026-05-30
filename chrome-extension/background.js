// Smart Tab Manager - Service Worker
// Handles duplicate tab detection and badge updates

const DISMISSED_DUPES_KEY = "dismissedDupes";

// Track duplicate tabs and update badge
async function checkForDuplicates() {
  const tabs = await chrome.tabs.query({});
  const urlMap = new Map();

  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) continue;
    const normalized = normalizeUrl(tab.url);
    if (!urlMap.has(normalized)) {
      urlMap.set(normalized, []);
    }
    urlMap.get(normalized).push(tab.id);
  }

  // Get dismissed duplicates from storage
  const { dismissedDupes = [] } = await chrome.storage.local.get(DISMISSED_DUPES_KEY);
  const dismissedSet = new Set(dismissedDupes);

  let dupeCount = 0;
  for (const [url, tabIds] of urlMap) {
    if (tabIds.length > 1 && !dismissedSet.has(url)) {
      dupeCount += tabIds.length - 1;
    }
  }

  if (dupeCount > 0) {
    await chrome.action.setBadgeText({ text: String(dupeCount) });
    await chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" });
  } else {
    await chrome.action.setBadgeText({ text: "" });
  }

  return { urlMap, dupeCount };
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    // Strip trailing slash and hash for comparison
    return (u.origin + u.pathname).replace(/\/$/, "") + u.search;
  } catch {
    return url;
  }
}

// Listen for tab events to keep badge updated
chrome.tabs.onCreated.addListener(() => checkForDuplicates());
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    checkForDuplicates();
  }
});
chrome.tabs.onRemoved.addListener(() => checkForDuplicates());

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_DUPLICATES") {
    getDuplicatesData().then(sendResponse);
    return true; // async
  }
  if (message.type === "DISMISS_DUPLICATE") {
    dismissDuplicate(message.url).then(sendResponse);
    return true;
  }
  if (message.type === "CLOSE_DUPLICATE_TABS") {
    closeDuplicateTabs(message.url).then(sendResponse);
    return true;
  }
});

async function getDuplicatesData() {
  const tabs = await chrome.tabs.query({});
  const urlMap = new Map();

  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) continue;
    const normalized = normalizeUrl(tab.url);
    if (!urlMap.has(normalized)) {
      urlMap.set(normalized, []);
    }
    urlMap.get(normalized).push({ id: tab.id, title: tab.title, url: tab.url, favIconUrl: tab.favIconUrl });
  }

  const { dismissedDupes = [] } = await chrome.storage.local.get(DISMISSED_DUPES_KEY);
  const dismissedSet = new Set(dismissedDupes);

  const duplicates = [];
  for (const [normalizedUrl, tabList] of urlMap) {
    if (tabList.length > 1 && !dismissedSet.has(normalizedUrl)) {
      duplicates.push({ normalizedUrl, tabs: tabList });
    }
  }

  return { duplicates };
}

async function dismissDuplicate(url) {
  const { dismissedDupes = [] } = await chrome.storage.local.get(DISMISSED_DUPES_KEY);
  if (!dismissedDupes.includes(url)) {
    dismissedDupes.push(url);
    await chrome.storage.local.set({ [DISMISSED_DUPES_KEY]: dismissedDupes });
  }
  await checkForDuplicates();
  return { success: true };
}

async function closeDuplicateTabs(normalizedUrl) {
  const tabs = await chrome.tabs.query({});
  const matching = tabs.filter(t => t.url && normalizeUrl(t.url) === normalizedUrl);
  // Keep the first (oldest), close the rest
  const toClose = matching.slice(1).map(t => t.id);
  if (toClose.length > 0) {
    await chrome.tabs.remove(toClose);
  }
  await checkForDuplicates();
  return { success: true, closed: toClose.length };
}

// Initial check on install/startup
chrome.runtime.onInstalled.addListener(() => checkForDuplicates());
chrome.runtime.onStartup.addListener(() => checkForDuplicates());
