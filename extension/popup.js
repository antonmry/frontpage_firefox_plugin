const api = globalThis.browser ?? globalThis.chrome;
const MAX_TITLE = 120;

const form = document.getElementById("submit-form");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const statusEl = document.getElementById("status");
const titleCountEl = document.getElementById("title-count");
const submitBtn = document.getElementById("submit-btn");
const openOptionsBtn = document.getElementById("open-options");
const openFrontpageLink = document.getElementById("open-frontpage");

// Tabs
const tabFrontpage = document.getElementById("tab-frontpage");
const tabMargin = document.getElementById("tab-margin");
const panelFrontpage = document.getElementById("panel-frontpage");
const panelMargin = document.getElementById("panel-margin");

// Margin panel
const marginForm = document.getElementById("margin-form");
const marginSelectionEl = document.getElementById("margin-selection");
const marginCommentEl = document.getElementById("margin-comment");
const marginSubmitBtn = document.getElementById("margin-submit-btn");
const marginStatusEl = document.getElementById("margin-status");
const openMarginLink = document.getElementById("open-margin");

let activeTab = null; // the browser tab object

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? "status error" : "status success";
}

function updateTitleCounter() {
  const value = titleInput.value ?? "";
  titleCountEl.textContent = `${value.length}/${MAX_TITLE}`;
  if (value.length > MAX_TITLE) {
    titleCountEl.classList.add("over-limit");
  } else {
    titleCountEl.classList.remove("over-limit");
  }
}

async function populateFromTab() {
  try {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    const tab = tabs?.[0];
    if (!tab) return;
    activeTab = tab;
    if (tab.title) {
      titleInput.value = tab.title.trim().slice(0, MAX_TITLE);
    }
    if (tab.url && /^https?:/i.test(tab.url)) {
      urlInput.value = tab.url;
    }
    updateTitleCounter();
  } catch (error) {
    console.error("Unable to read active tab", error);
  }
}

function showMarginStatus(message, isError = false) {
  marginStatusEl.textContent = message;
  marginStatusEl.className = isError ? "status error" : "status success";
}

async function loadMarginSelection() {
  marginSelectionEl.value = "";
  showMarginStatus("");
  if (!activeTab?.id) return;
  if (!/^https?:/i.test(activeTab.url ?? "")) {
    showMarginStatus("Margin annotations require an http/https page.", true);
    return;
  }
  try {
    const response = await api.tabs.sendMessage(activeTab.id, { type: "margin-get-selection" });
    if (response?.selection?.exact) {
      marginSelectionEl.value = response.selection.exact;
    } else {
      showMarginStatus("No text selected. Select text on the page and reopen.", true);
    }
  } catch {
    showMarginStatus("Could not read selection. Try reloading the page.", true);
  }
}

function switchTab(tab) {
  if (tab === "margin") {
    tabFrontpage.classList.remove("active");
    tabFrontpage.setAttribute("aria-selected", "false");
    tabMargin.classList.add("active");
    tabMargin.setAttribute("aria-selected", "true");
    panelFrontpage.hidden = true;
    panelMargin.hidden = false;
    loadMarginSelection();
  } else {
    tabMargin.classList.remove("active");
    tabMargin.setAttribute("aria-selected", "false");
    tabFrontpage.classList.add("active");
    tabFrontpage.setAttribute("aria-selected", "true");
    panelMargin.hidden = true;
    panelFrontpage.hidden = false;
  }
}

let hasAuth = false;

async function checkAuth() {
  try {
    const response = await api.runtime.sendMessage({ type: "frontpage-get-auth" });
    hasAuth = Boolean(response?.auth);
    if (!hasAuth) {
      showStatus("Configure your Frontpage credentials in the options page.", true);
    } else {
      showStatus("");
    }
  } catch (error) {
    console.error("Failed to query auth state", error);
    showStatus("Unable to read authentication state.", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasAuth) {
    showStatus("Configure your Frontpage credentials in the options page.", true);
    return;
  }
  showStatus("");
  submitBtn.disabled = true;
  try {
    const payload = {
      title: titleInput.value,
      url: urlInput.value
    };
    const response = await api.runtime.sendMessage({
      type: "frontpage-submit",
      payload
    });
    if (!response?.ok) {
      throw new Error(response?.error ?? "Unknown error");
    }
    const uri = response?.result?.uri;
    showStatus(uri ? `Posted! ${uri}` : "Posted to Frontpage!", false);
  } catch (error) {
    console.error("Submission failed", error);
    showStatus(error.message, true);
  } finally {
    submitBtn.disabled = false;
  }
});

titleInput.addEventListener("input", updateTitleCounter);

openOptionsBtn.addEventListener("click", () => {
  api.runtime.openOptionsPage();
});

openFrontpageLink.addEventListener("click", (event) => {
  event.preventDefault();
  api.tabs.create({ url: "https://frontpage.fyi" });
});

tabFrontpage.addEventListener("click", () => switchTab("frontpage"));
tabMargin.addEventListener("click", () => switchTab("margin"));

marginCommentEl.addEventListener("input", () => {
  marginSubmitBtn.textContent = marginCommentEl.value.trim() ? "Annotate on Margin" : "Highlight on Margin";
});

marginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasAuth) {
    showMarginStatus("Configure your credentials in the options page.", true);
    return;
  }
  const exact = marginSelectionEl.value.trim();
  if (!exact) {
    showMarginStatus("No text selected. Select text on the page and reopen.", true);
    return;
  }
  showMarginStatus("");
  marginSubmitBtn.disabled = true;
  try {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    const tab = tabs?.[0];
    let selectionData = { exact, prefix: "", suffix: "" };
    try {
      const res = await api.tabs.sendMessage(tab.id, { type: "margin-get-selection" });
      if (res?.selection) selectionData = res.selection;
    } catch {
      // use what we have
    }
    const payload = {
      url: tab?.url ?? "",
      title: tab?.title ?? "",
      exact: selectionData.exact,
      prefix: selectionData.prefix,
      suffix: selectionData.suffix,
      comment: marginCommentEl.value
    };
    const response = await api.runtime.sendMessage({ type: "margin-submit", payload });
    if (!response?.ok) {
      throw new Error(response?.error ?? "Unknown error");
    }
    const type = payload.comment.trim() ? "Annotation" : "Highlight";
    showMarginStatus(`${type} published to Margin!`);
    marginCommentEl.value = "";
  } catch (error) {
    console.error("Margin submission failed", error);
    showMarginStatus(error.message, true);
  } finally {
    marginSubmitBtn.disabled = false;
  }
});

openMarginLink.addEventListener("click", (event) => {
  event.preventDefault();
  api.tabs.create({ url: "https://margin.at" });
});

populateFromTab().then(() => switchTab("margin"));
checkAuth();
