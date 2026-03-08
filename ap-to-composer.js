(function () {

  /* ================= ENV DETECTION ================= */
  const isAP = location.hostname.includes('newsroom.ap.org');
  const isARC = location.hostname.includes('advancelocal.arcpublishing.com');

  /* ================= HELPERS ================= */
  const titleCase = s =>
    s.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase());

  const cleanByline = raw =>
    titleCase(
      (raw || '')
        .replace(/^by\s+/i, '')
        .replace(/associated press/i, '')
        .replace(/\d+\s*words?/i, '')
        .replace(/\s+/g, ' ')
        .trim()
    );

  const stripDateline = text =>
    (text || '').replace(/^[A-Z\s.,'’()-]+—\s+/, '').trim();

  /* ================= AP EXTRACT ================= */
  function extractAP() {

    const body = document.querySelector('#P_body');
    if (!body) {
      alert('AP → Composer: Could not find story body (#P_body).');
      return null;
    }

    // Text-first extraction (robust against malformed <p><p>)
    const rawText = body.innerText.trim();
    if (!rawText) {
      alert('AP → Composer: Story body was empty.');
      return null;
    }

    let paragraphs = rawText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    if (!paragraphs.length) {
      alert('AP → Composer: No paragraphs extracted.');
      return null;
    }

    // Headline
    const headlineNode =
      document.querySelector('#h1_headline') ||
      document.querySelector('h1');
    const headline = headlineNode ? headlineNode.innerText.trim() : '';

    // Summary / dek
    const summaryNode = document.querySelector('#p_summary');
    let summary = summaryNode ? summaryNode.innerText.trim() : '';
    summary = stripDateline(summary);

    // Byline
    const byNode =
      document.querySelector('#spn_byline') ||
      document.querySelector('.byline');
    const byline = cleanByline(byNode ? byNode.innerText : '');

    // Remove (AP) only from first paragraph
    paragraphs[0] = paragraphs[0].replace(/\(AP\)\s*—/i, '—');

    // Rebuild clean HTML
    let bodyHTML = paragraphs.map(p => `<p>${p}</p>`).join('\n');
    if (byline) {
      bodyHTML += `\n<p><em>By ${byline}</em></p>`;
    }

    return { headline, summary, bodyHTML };
  }

  /* ================= COMPOSER FILL ================= */
  function fillComposer(data) {

    function setValue(selector, value) {
      const el = document.querySelector(selector);
      if (!el) return;
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set) desc.set.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setValue(
      '[data-testid="headlines-basic-field"], #lexical-editor--headline',
      data.headline
    );

    setValue(
      '[data-testid="templates-planning--story-description"], #lexical-editor--subheadline',
      data.summary
    );

    const editor = document.querySelector(
      '[data-lexical-editor="true"][contenteditable="true"], div[role="textbox"][contenteditable="true"]'
    );

    if (editor) {
      editor.focus();
      document.execCommand('selectAll');
      document.execCommand('insertHTML', false, data.bodyHTML);
    }

    alert('AP → Composer: Story imported successfully.');
  }

  /* ================= ROUTER ================= */
  if (isAP) {
    const data = extractAP();
    if (!data) return;

    // Cross-origin safe transfer
    window.name = 'AP_TO_COMPOSER::' + JSON.stringify(data);

    alert('AP → Composer: Story captured.\nOpen Composer and click bookmarklet again.');
    return;
  }

  if (isARC) {
    if (!window.name.startsWith('AP_TO_COMPOSER::')) {
      alert('AP → Composer: No AP story found.\nRun bookmarklet on AP story first.');
      return;
    }

    let data;
    try {
      data = JSON.parse(window.name.replace('AP_TO_COMPOSER::', ''));
    } catch {
      alert('AP → Composer: Failed to read stored story.');
      return;
    }

    fillComposer(data);
    return;
  }

  alert('AP → Composer: This page is not AP Newsroom or Arc Composer.');

})();
``
