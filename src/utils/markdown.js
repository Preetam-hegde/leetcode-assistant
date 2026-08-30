/**
 * Lightweight custom markdown & code highlight renderer for extension UI
 */

export function renderMarkdown(markdownText) {
  if (!markdownText) return '';

  let html = markdownText;

  // 1. Escape unsafe HTML tags
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Code blocks (```python ... ```)
  html = html.replace(/```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang.trim() || 'code';
    const cleanCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    const encodedCode = encodeURIComponent(cleanCode);

    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-lang-label">${language.toUpperCase()}</span>
          <button class="copy-code-btn" data-code="${encodedCode}">📋 Copy Code</button>
        </div>
        <pre><code class="language-${language}">${escapeHtml(cleanCode)}</code></pre>
      </div>
    `;
  });

  // 3. Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 4. LaTeX Math ($O(N)$ or $$...$$)
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-block">$1</div>');
  html = html.replace(/\$([^\$\n]+)\$/g, '<span class="math-inline">$1</span>');

  // 5. Headings (# H1, ## H2, ### H3, #### H4)
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 6. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 7. Blockquotes (> text)
  html = html.replace(/^&gt;\s?(.*$)/gim, '<blockquote>$1</blockquote>');

  // 8. Lists (- or * or 1.)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // 9. Line breaks / Paragraphs
  html = html.replace(/\n\n+/g, '<br/><br/>');

  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
