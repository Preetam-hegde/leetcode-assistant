/**
 * Content Script for LeetSensei
 */

(function () {
  let currentSlug = null;
  let floatingBtn = null;

  console.log('LeetSensei Content Script Active');

  init();

  function init() {
    checkUrl();

    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        checkUrl();
      }
    }).observe(document, { subtree: true, childList: true });

    setInterval(checkUrl, 2000);
  }

  function checkUrl() {
    const match = window.location.pathname.match(/\/problems\/([^\/]+)/);
    if (match && match[1]) {
      const slug = match[1];
      if (slug !== currentSlug) {
        currentSlug = slug;
        fetchProblemData(slug);
      }
      injectFloatingButton();
    } else {
      currentSlug = null;
      removeFloatingButton();
    }
  }

  async function fetchProblemData(titleSlug) {
    try {
      const query = `
        query getQuestionDetail($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionFrontendId
            title
            titleSlug
            content
            difficulty
            topicTags { name }
            hints
          }
        }
      `;

      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query, variables: { titleSlug } })
      });

      if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);

      const data = await res.json();
      const q = data?.data?.question;

      if (q) {
        const textDescription = stripHtmlTags(q.content || '');

        const problemInfo = {
          frontendId: q.questionFrontendId,
          title: q.title,
          titleSlug: q.titleSlug,
          difficulty: q.difficulty,
          description: textDescription,
          topics: (q.topicTags || []).map(t => t.name),
          hints: q.hints || [],
          userCode: getUserEditorCode(),
          updatedAt: Date.now()
        };

        await chrome.storage.local.set({ active_problem: problemInfo });

        chrome.runtime.sendMessage({
          action: 'SET_ACTIVE_PROBLEM',
          problem: problemInfo
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('LeetSensei GraphQL fallback:', err);
      extractFromDomFallback(titleSlug);
    }
  }

  function extractFromDomFallback(titleSlug) {
    const titleEl = document.querySelector('[data-cy="question-title"]') || document.querySelector('.text-title-large');
    const descEl = document.querySelector('[data-track-load="description_content"]') || document.querySelector('.elfjS');

    const problemInfo = {
      frontendId: '',
      title: titleEl ? titleEl.innerText : titleSlug,
      titleSlug: titleSlug,
      difficulty: 'Unknown',
      description: descEl ? descEl.innerText : 'Description could not be parsed automatically.',
      topics: [],
      userCode: getUserEditorCode(),
      updatedAt: Date.now()
    };

    chrome.storage.local.set({ active_problem: problemInfo });
  }

  function getUserEditorCode() {
    try {
      const lines = document.querySelectorAll('.monaco-editor .view-line');
      if (lines && lines.length > 0) {
        return Array.from(lines).map(line => line.innerText).join('\n');
      }
      const textarea = document.querySelector('textarea.inputarea');
      if (textarea && textarea.value) return textarea.value;
    } catch (_) {}
    return '';
  }

  function stripHtmlTags(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    temp.querySelectorAll('p, br, li, h1, h2, h3, h4').forEach(el => {
      el.prepend(document.createTextNode('\n'));
    });
    return temp.innerText.trim();
  }

  function injectFloatingButton() {
    if (document.getElementById('leetsensei-floating-btn')) return;

    floatingBtn = document.createElement('div');
    floatingBtn.id = 'leetsensei-floating-btn';
    floatingBtn.innerHTML = `
      <button id="leetsensei-trigger-btn" title="Open LeetSensei AI Mentor">
        <span class="btn-icon">🥋</span>
        <span class="btn-text">LeetSensei</span>
      </button>
    `;

    document.body.appendChild(floatingBtn);

    document.getElementById('leetsensei-trigger-btn').addEventListener('click', async () => {
      const userCode = getUserEditorCode();
      const { active_problem } = await chrome.storage.local.get('active_problem');
      if (active_problem) {
        active_problem.userCode = userCode;
        await chrome.storage.local.set({ active_problem });
      }
      chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
    });
  }

  function removeFloatingButton() {
    const existing = document.getElementById('leetsensei-floating-btn');
    if (existing) existing.remove();
  }

  document.addEventListener('keyup', () => {
    if (currentSlug) {
      const code = getUserEditorCode();
      chrome.storage.local.get('active_problem').then(({ active_problem }) => {
        if (active_problem && active_problem.userCode !== code) {
          active_problem.userCode = code;
          chrome.storage.local.set({ active_problem });
        }
      }).catch(() => {});
    }
  });

})();
