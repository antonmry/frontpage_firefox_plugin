const CONTEXT_CHARS = 150;

browser.runtime.onMessage.addListener((message) => {
  if (message.type !== "margin-get-selection") return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return Promise.resolve({ selection: null });
  }

  const exact = selection.toString().trim();
  if (!exact) return Promise.resolve({ selection: null });

  let prefix = "";
  let suffix = "";
  try {
    const range = selection.getRangeAt(0);

    const prefixRange = document.createRange();
    prefixRange.selectNodeContents(document.body);
    prefixRange.setEnd(range.startContainer, range.startOffset);
    prefix = prefixRange.toString().slice(-CONTEXT_CHARS);

    const suffixRange = document.createRange();
    suffixRange.selectNodeContents(document.body);
    suffixRange.setStart(range.endContainer, range.endOffset);
    suffix = suffixRange.toString().slice(0, CONTEXT_CHARS);
  } catch {
    // context extraction failed, proceed without it
  }

  return Promise.resolve({ selection: { exact, prefix, suffix } });
});
