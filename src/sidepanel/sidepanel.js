/**
 * Side Panel JS - Interactive LeetSensei Workspace
 */

import { sendOpenRouterRequest, DEFAULT_MODEL, OLLAMA_DEFAULT_MODEL } from '../utils/openrouter.js';
import { renderMarkdown } from '../utils/markdown.js';
import {
  SYSTEM_PROMPT,
  buildReframeDescriptionPrompt,
  buildBestPythonSolutionPrompt,
  buildBestMethodSelectorPrompt,
  buildProgressiveHintsPrompt,
  buildStepExplanationPrompt,
  buildCodeReviewPrompt,
  buildCustomChatPrompt
} from '../utils/prompts.js';

document.addEventListener('DOMContentLoaded', async () => {
  const spModelSelect = document.getElementById('spModelSelect');
  const problemDifficulty = document.getElementById('problemDifficulty');
  const problemTitle = document.getElementById('problemTitle');
  const problemTopics = document.getElementById('problemTopics');
  const refreshProblemBtn = document.getElementById('refreshProblemBtn');
  const apiKeyNotice = document.getElementById('apiKeyNotice');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const actionCards = document.querySelectorAll('.action-card');
  const welcomePlaceholder = document.getElementById('welcomePlaceholder');
  const responseWrapper = document.getElementById('responseWrapper');
  const responseActionTitle = document.getElementById('responseActionTitle');
  const responseBody = document.getElementById('responseBody');
  const clearOutputBtn = document.getElementById('clearOutputBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const loadingText = document.getElementById('loadingText');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  let activeProblem = null;
  let apiKey = '';
  let selectedModel = DEFAULT_MODEL;
  let provider = 'auto';

  await loadSettings();
  await loadActiveProblem();
  setupEventListeners();

  async function loadSettings() {
    const settings = await chrome.storage.sync.get(['openrouter_api_key', 'selected_model', 'provider', 'ollama_model']);
    apiKey = settings.openrouter_api_key || '';
    selectedModel = settings.provider === 'ollama' ? (settings.ollama_model || OLLAMA_DEFAULT_MODEL) : (settings.selected_model || DEFAULT_MODEL);
    provider = settings.provider || 'auto';

    if (!apiKey && provider !== 'ollama') apiKeyNotice.classList.remove('hidden');
    else apiKeyNotice.classList.add('hidden');

    if (selectedModel) spModelSelect.value = selectedModel;
  }

  async function loadActiveProblem() {
    const data = await chrome.storage.local.get('active_problem');
    if (data.active_problem) {
      activeProblem = data.active_problem;
      renderProblemInfo(activeProblem);
    } else {
      problemTitle.textContent = 'Open a LeetCode problem page';
      problemDifficulty.textContent = 'NO DATA';
      problemDifficulty.className = 'diff-tag diff-unknown';
      problemTopics.innerHTML = '';
    }
  }

  function renderProblemInfo(prob) {
    const titleText = prob.frontendId ? `${prob.frontendId}. ${prob.title}` : (prob.title || 'LeetCode Problem');
    problemTitle.textContent = titleText;

    const diff = (prob.difficulty || 'UNKNOWN').toUpperCase();
    problemDifficulty.textContent = diff;

    if (diff === 'EASY') problemDifficulty.className = 'diff-tag diff-easy';
    else if (diff === 'MEDIUM') problemDifficulty.className = 'diff-tag diff-medium';
    else if (diff === 'HARD') problemDifficulty.className = 'diff-tag diff-hard';
    else problemDifficulty.className = 'diff-tag diff-unknown';

    if (prob.topics && prob.topics.length > 0) {
      problemTopics.innerHTML = prob.topics.map(t => `<span class="topic-tag">${t}</span>`).join('');
    } else {
      problemTopics.innerHTML = '';
    }
  }

  function setupEventListeners() {
    spModelSelect.addEventListener('change', async () => {
      selectedModel = spModelSelect.value;
      await chrome.storage.sync.set(provider === 'ollama'
        ? { ollama_model: selectedModel }
        : { selected_model: selectedModel });
    });

    refreshProblemBtn.addEventListener('click', async () => {
      refreshProblemBtn.classList.add('spin');
      await loadActiveProblem();
      setTimeout(() => refreshProblemBtn.classList.remove('spin'), 600);
    });

    openSettingsBtn?.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
      else alert('Please click the extension icon to set your OpenRouter API Key.');
    });

    actionCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.getAttribute('data-action');
        handleAiAction(action);
      });
    });

    clearOutputBtn.addEventListener('click', () => {
      responseWrapper.classList.add('hidden');
      welcomePlaceholder.classList.remove('hidden');
      responseBody.innerHTML = '';
    });

    sendChatBtn.addEventListener('click', sendCustomChat);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendCustomChat();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.active_problem) {
        activeProblem = changes.active_problem.newValue;
        if (activeProblem) renderProblemInfo(activeProblem);
      }
      if (areaName === 'sync') {
        if (changes.openrouter_api_key) {
          apiKey = changes.openrouter_api_key.newValue;
          if (apiKey) apiKeyNotice.classList.add('hidden');
          else apiKeyNotice.classList.remove('hidden');
        }
        if (changes.selected_model) {
          selectedModel = changes.selected_model.newValue;
          spModelSelect.value = selectedModel;
        }
        if (changes.provider) provider = changes.provider.newValue;
        if (changes.ollama_model && provider === 'ollama') {
          selectedModel = changes.ollama_model.newValue;
          spModelSelect.value = selectedModel;
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('copy-code-btn')) {
        const encodedCode = e.target.getAttribute('data-code');
        if (encodedCode) {
          const code = decodeURIComponent(encodedCode);
          navigator.clipboard.writeText(code).then(() => {
            const originalText = e.target.textContent;
            e.target.textContent = '✅ Copied!';
            setTimeout(() => e.target.textContent = originalText, 2000);
          });
        }
      }
    });
  }

  async function handleAiAction(actionType) {
    if (!apiKey && provider !== 'ollama') {
      alert('Please set your OpenRouter API Key in settings first!');
      return;
    }

    if (!activeProblem) {
      await loadActiveProblem();
      if (!activeProblem) {
        alert('Please open a LeetCode problem page first.');
        return;
      }
    }

    let promptText = '';
    let title = 'Output';

    switch (actionType) {
      case 'best_solution':
        title = '🐍 Optimal Python 3 Solution';
        promptText = buildBestPythonSolutionPrompt(activeProblem);
        break;
      case 'reframe_description':
        title = '📝 Simplified Problem Statement';
        promptText = buildReframeDescriptionPrompt(activeProblem);
        break;
      case 'best_method':
        title = '🎯 Best Method & Pattern Selector';
        promptText = buildBestMethodSelectorPrompt(activeProblem);
        break;
      case 'hints':
        title = '💡 Progressive Hints';
        promptText = buildProgressiveHintsPrompt(activeProblem);
        break;
      case 'step_explanation':
        title = '📖 Step-by-Step Logic';
        promptText = buildStepExplanationPrompt(activeProblem);
        break;
      case 'review_code':
        title = '🔍 Code Review & Debugger';
        promptText = buildCodeReviewPrompt(activeProblem, activeProblem.userCode);
        break;
      default:
        return;
    }

    executeAiStream({ title, promptText });
  }

  async function sendCustomChat() {
    const query = chatInput.value.trim();
    if (!query) return;

    if (!apiKey && provider !== 'ollama') {
      alert('Please set your OpenRouter API Key in settings first!');
      return;
    }

    chatInput.value = '';
    const title = `💬 Q: ${query}`;
    const promptText = buildCustomChatPrompt(activeProblem || {}, query);

    executeAiStream({ title, promptText });
  }

  async function executeAiStream({ title, promptText }) {
    welcomePlaceholder.classList.add('hidden');
    responseWrapper.classList.remove('hidden');
    responseActionTitle.textContent = title;
    responseBody.innerHTML = '';

    loadingIndicator.classList.remove('hidden');
    loadingText.textContent = `Consulting AI...`;

    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: promptText }
      ];

      await sendOpenRouterRequest({
        apiKey,
        model: selectedModel,
        provider,
        messages,
        onChunk: (chunk, fullText) => {
          loadingIndicator.classList.add('hidden');
          responseBody.innerHTML = renderMarkdown(fullText);
        }
      });

      loadingIndicator.classList.add('hidden');
    } catch (err) {
      loadingIndicator.classList.add('hidden');
      responseBody.innerHTML = `
        <div class="error-box">
          <strong>❌ Error:</strong> ${err.message}
        </div>
      `;
    }
  }
});
