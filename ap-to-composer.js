console.log("AP → Composer loader running.");

/* Small marker to ensure the script is actually executing */
(function(){

  const isAP = location.hostname.includes('newsroom.ap.org');
  const isARC = location.hostname.includes('advancelocal.arcpublishing.com');

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

  const stripDateline = t =>
    (t || '').replace(/^[A-Z\s.,'’()-]+—\s+/, '').trim();

  if (isAP) {
    const body = document.querySelector("#P_body");
    if (!body) {
      alert("AP → Composer: Could not find story body (#P_body).");
      return;
    }

    const rawText = body.innerText.trim();
    if (!rawText) {
      alert("AP → Composer: Story body was empty.");
      return;
    }

    let paras = rawText.split(/\n+/).map(t => t.trim()).filter(Boolean);
    if (!paras.length) {
      alert("AP → Composer: No paragraphs found.");
      return;
    }

    const headlineNode = document.querySelector("#h1_headline") || document.querySelector("h1");
    const headline = headlineNode ? headlineNode.innerText.trim() : "";

    const sumNode = document.querySelector("#p_summary");
    let summary = sumNode ? sumNode.innerText.trim() : "";
    summary = stripDateline(summary);

    const byNode = document.querySelector("#spn_byline") || document.querySelector(".byline");
    const byline = cleanByline(byNode ? byNode.innerText : "");

    paras[0] = paras[0].replace(/\(AP\)\s*—/i, "—");

    let bodyHTML = paras.map(p => `<p>${p}</p>`).join("\n");
    if (byline) bodyHTML += `\n<p><em>By ${byline}</em></p>`;

    window.name = "AP_TO_COMPOSER::" + JSON.stringify({ headline, summary, bodyHTML });

    alert("AP → Composer: Story captured. Open Composer and click bookmarklet again.");
    return;
  }

  if (isARC) {
    if (!window.name.startsWith("AP_TO_COMPOSER::")) {
      alert("AP → Composer: No stored AP story. Run on AP page first.");
      return;
    }

    let data;
    try {
      data = JSON.parse(window.name.replace("AP_TO_COMPOSER::", ""));
    } catch (e) {
      alert("AP → Composer: Failed to parse payload.");
      return;
    }

    function setValue(selector, val) {
      const el = document.querySelector(selector);
      if (!el) return;
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      if (desc && desc.set) desc.set.call(el, val);
      else el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    setValue("[data-testid='headlines-basic-field'], #lexical-editor--headline", data.headline);
    setValue("[data-testid='templates-planning--story-description'], #lexical-editor--subheadline", data.summary);

    const editor = document.querySelector("[data-lexical-editor='true'][contenteditable='true'], div[role='textbox'][contenteditable='true']");
    if (editor) {
      editor.focus();
      document.execCommand("selectAll");
      document.execCommand("insertHTML", false, data.bodyHTML);
    }

    alert("AP → Composer: Story imported.");
    return;
  }

  alert("AP → Composer: Run on AP Newsroom or Arc Composer.");

})();
