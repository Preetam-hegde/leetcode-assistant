/**
 * Popup JS - Settings Manager with Auto Key Detection
 */

import { isGoogleStudioKeyOrModel, OLLAMA_DEFAULT_MODEL } from '../utils/openrouter.js';

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const providerSelect = document.getElementById('providerSelect');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const keyProviderBadge = document.getElementById('keyProviderBadge');
  const modelSelect = document.getElementById('modelSelect');
  const customModelGroup = document.getElementById('customModelGroup');
  const customModelInput = document.getElementById('customModelInput');
  const ollamaModelGroup = document.getElementById('ollamaModelGroup');
  const ollamaModelInput = document.getElementById('ollamaModelInput');
  const saveBtn = document.getElementById('saveBtn');
  const statusMessage = document.getElementById('statusMessage');
  const openSidePanelBtn = document.getElementById('openSidePanelBtn');

  // Load existing settings
  const settings = await chrome.storage.sync.get(['openrouter_api_key', 'selected_model', 'custom_model', 'provider', 'ollama_model']);
  providerSelect.value = settings.provider || 'auto';
  ollamaModelInput.value = settings.ollama_model || OLLAMA_DEFAULT_MODEL;

  if (settings.openrouter_api_key) {
    apiKeyInput.value = settings.openrouter_api_key;
    updateKeyBadge(settings.openrouter_api_key);
  }
  updateProviderUi();

  const model = settings.selected_model || 'deepseek/deepseek-r1';
  const knownOptions = Array.from(modelSelect.querySelectorAll('option')).map(o => o.value);

  if (knownOptions.includes(model)) {
    modelSelect.value = model;
  } else {
    modelSelect.value = 'custom';
    customModelGroup.classList.remove('hidden');
    customModelInput.value = settings.custom_model || model;
  }

  // Detect key type live
  apiKeyInput.addEventListener('input', () => {
    const val = apiKeyInput.value.trim();
    updateKeyBadge(val);
  });

  function updateKeyBadge(key) {
    if (isGoogleStudioKeyOrModel(key, '')) {
      keyProviderBadge.textContent = '✨ Google AI Studio Key Detected (AQ... / AIza...)';
      keyProviderBadge.style.color = '#00E5FF';
      // Auto switch default model if current selection is not a Gemini model
      if (!modelSelect.value.startsWith('gemini-')) {
        modelSelect.value = 'gemini-3.6-flash';
      }
    } else if (key.length > 5) {
      keyProviderBadge.textContent = '⚡ OpenRouter Key Detected';
      keyProviderBadge.style.color = '#FFA116';
    } else {
      keyProviderBadge.textContent = 'OpenRouter or Google AI Studio key';
      keyProviderBadge.style.color = 'var(--text-muted)';
    }
  }

  modelSelect.addEventListener('change', () => {
    if (modelSelect.value === 'custom') {
      customModelGroup.classList.remove('hidden');
    } else {
      customModelGroup.classList.add('hidden');
    }
  });

  providerSelect.addEventListener('change', updateProviderUi);

  function updateProviderUi() {
    const local = providerSelect.value === 'ollama';
    apiKeyInput.closest('.form-group').classList.toggle('hidden', local);
    ollamaModelGroup.classList.toggle('hidden', !local);
  }

  toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '👁️';
    }
  });

  saveBtn.addEventListener('click', async () => {
    const provider = providerSelect.value;
    const apiKey = apiKeyInput.value.trim();
    let selectedModel = modelSelect.value;
    let customModel = customModelInput.value.trim();

    if (provider !== 'ollama' && selectedModel === 'custom') {
      if (!customModel) {
        showStatus('Please specify a custom model ID.', 'error');
        return;
      }
      selectedModel = customModel;
    }

    if (provider !== 'ollama' && !apiKey) {
      showStatus('Enter a cloud API key or choose Ollama (local).', 'error');
      return;
    }
    await chrome.storage.sync.set({
      openrouter_api_key: apiKey,
      selected_model: selectedModel,
      custom_model: customModel,
      provider,
      ollama_model: ollamaModelInput.value.trim() || OLLAMA_DEFAULT_MODEL
    });

    showStatus('Settings saved successfully! ✅', 'success');
  });

  openSidePanelBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      window.close();
    } else {
      showStatus('Side Panel is not supported on this tab.', 'error');
    }
  });

  function showStatus(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = `status-msg ${type}`;
    statusMessage.style.display = 'block';

    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 4000);
  }
});
