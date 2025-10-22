const api = globalThis.browser ?? globalThis.chrome;

const form = document.getElementById("login-form");
const handleInput = document.getElementById("handle");
const passwordInput = document.getElementById("password");
const pdsInput = document.getElementById("pds");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const statusEl = document.getElementById("auth-status");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? "status error" : "status success";
}

async function refreshAuthStatus() {
  try {
    const response = await api.runtime.sendMessage({ type: "frontpage-get-auth" });
    if (!response?.auth) {
      setStatus("Not connected. Save your handle and app password to enable posting.");
      logoutBtn.disabled = true;
      return;
    }
    const auth = response.auth;
    handleInput.value = auth.handle ?? "";
    pdsInput.value = auth.pds ?? "";
    passwordInput.value = "";
    logoutBtn.disabled = false;
    setStatus(`Connected as ${auth.handle} (${auth.did}).`);
  } catch (error) {
    console.error("Unable to read auth state", error);
    setStatus("Could not read authentication state.", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Signing in…");
  loginBtn.disabled = true;
  try {
    const payload = {
      handle: handleInput.value,
      password: passwordInput.value,
      pds: pdsInput.value
    };
    const response = await api.runtime.sendMessage({
      type: "frontpage-login",
      payload
    });
    if (!response?.ok) {
      throw new Error(response?.error ?? "Unknown error");
    }
    passwordInput.value = "";
    setStatus("Credentials saved.");
    await refreshAuthStatus();
  } catch (error) {
    console.error("Login failed", error);
    setStatus(error.message, true);
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  try {
    await api.runtime.sendMessage({ type: "frontpage-logout" });
    passwordInput.value = "";
    pdsInput.value = "";
    setStatus("Logged out.");
  } catch (error) {
    console.error("Logout failed", error);
    setStatus(error.message, true);
  } finally {
    await refreshAuthStatus();
  }
});

refreshAuthStatus();
