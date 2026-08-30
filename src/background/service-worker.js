/**
 * Background Service Worker for LeetSensei
 */

chrome.runtime.onInstalled.addListener(async () => {
  console.log('LeetSensei Installed');
  const existing = await chrome.storage.sync.get(['openrouter_api_key', 'selected_model']);
  if (!existing.selected_model) {
    await chrome.storage.sync.set({ selected_model: 'deepseek/deepseek-r1' });
  }
});

if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((err) => {
    console.warn('sidePanel behavior error:', err);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'OPEN_SIDE_PANEL') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && chrome.sidePanel && chrome.sidePanel.open) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Side panel API not available' });
        }
      } else if (message.action === 'GET_ACTIVE_PROBLEM') {
        const { active_problem } = await chrome.storage.local.get('active_problem');
        sendResponse({ problem: active_problem || null });
      } else if (message.action === 'SET_ACTIVE_PROBLEM') {
        await chrome.storage.local.set({ active_problem: message.problem });
        sendResponse({ success: true });
      } else {
        sendResponse({ status: 'unknown_action' });
      }
    } catch (err) {
      console.error('Service worker error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true;
});
