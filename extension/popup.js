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

populateFromTab();
checkAuth();
