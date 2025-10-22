const browser = globalThis.browser ?? globalThis.chrome;
const STORAGE_KEY = "frontpageAuth";
const FRONTPAGE_COLLECTION = "fyi.unravel.frontpage.post";
const RECORD_TYPE = "fyi.unravel.frontpage.post";
const DEFAULT_MAX_TITLE = 120;
const DEFAULT_MAX_URL = 2048;

async function getStoredAuth() {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  return stored[STORAGE_KEY] ?? null;
}

async function setStoredAuth(auth) {
  await browser.storage.local.set({ [STORAGE_KEY]: auth });
}

async function clearStoredAuth() {
  await browser.storage.local.remove(STORAGE_KEY);
}

async function resolveHandle(handle) {
  const endpoint = "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle";
  const url = `${endpoint}?handle=${encodeURIComponent(handle)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Handle resolution failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.did) {
    throw new Error("Handle resolution response missing DID");
  }
  return data.did;
}

async function lookupPds(did) {
  const url = `https://plc.directory/${encodeURIComponent(did)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`PLC lookup failed (${res.status})`);
  }
  const doc = await res.json();
  const services = Array.isArray(doc.service) ? doc.service : [];
  const pds = services.find((s) => s.type === "AtprotoPersonalDataServer")?.serviceEndpoint;
  if (!pds) {
    throw new Error("Unable to determine personal data server");
  }
  return pds.replace(/\/+$/, "");
}

async function createSession({ identifier, password, pds }) {
  const res = await fetch(`${pds}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Login failed (${res.status}): ${errorText || res.statusText}`);
  }
  return res.json();
}

async function refreshSession(auth) {
  const res = await fetch(`${auth.pds}/xrpc/com.atproto.server.refreshSession`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.refreshJwt}`
    }
  });
  if (!res.ok) {
    throw new Error(`Session refresh failed (${res.status})`);
  }
  const data = await res.json();
  const updated = {
    ...auth,
    accessJwt: data.accessJwt,
    refreshJwt: data.refreshJwt,
    did: data.did ?? auth.did,
    handle: data.handle ?? auth.handle
  };
  await setStoredAuth(updated);
  return updated;
}

function decodeJwt(token) {
  try {
    const payloadPart = token.split(".")[1];
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isExpired(token, skewSeconds = 30) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  const expiresAt = payload.exp * 1000;
  return Date.now() + skewSeconds * 1000 >= expiresAt;
}

async function ensureSession() {
  let auth = await getStoredAuth();
  if (!auth) {
    throw new Error("Not authenticated. Set up your credentials in the add-on options.");
  }
  if (isExpired(auth.accessJwt)) {
    auth = await refreshSession(auth);
  }
  return auth;
}

async function createFrontpageRecord({ title, url }, authOverride) {
  const trimmedTitle = (title ?? "").trim().slice(0, DEFAULT_MAX_TITLE);
  const trimmedUrl = (url ?? "").trim().slice(0, DEFAULT_MAX_URL);
  if (!trimmedTitle) {
    throw new Error("Title is required.");
  }
  try {
    new URL(trimmedUrl);
  } catch {
    throw new Error("URL is invalid.");
  }

  const auth = authOverride ?? (await ensureSession());
  const body = {
    repo: auth.did,
    collection: FRONTPAGE_COLLECTION,
    record: {
      $type: RECORD_TYPE,
      title: trimmedTitle,
      url: trimmedUrl,
      createdAt: new Date().toISOString()
    }
  };

  const res = await fetch(`${auth.pds}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessJwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (res.status === 401 && !authOverride) {
    // Attempt one refresh
    const refreshed = await refreshSession(auth);
    return createFrontpageRecord({ title: trimmedTitle, url: trimmedUrl }, refreshed);
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Post failed (${res.status}): ${errorText || res.statusText}`);
  }

  return res.json();
}

browser.runtime.onMessage.addListener((message) => {
  switch (message?.type) {
    case "frontpage-submit":
      return createFrontpageRecord(message.payload).then(
        (result) => ({ ok: true, result }),
        (error) => ({ ok: false, error: error.message })
      );
    case "frontpage-login":
      return handleLogin(message.payload).then(
        () => ({ ok: true }),
        (error) => ({ ok: false, error: error.message })
      );
    case "frontpage-logout":
      return clearStoredAuth().then(() => ({ ok: true }));
    case "frontpage-get-auth":
      return getStoredAuth().then((auth) => ({ ok: true, auth: auth ?? null }));
    default:
      return false;
  }
});

async function handleLogin(payload) {
  if (!payload?.handle || !payload?.password) {
    throw new Error("Handle and app password are required.");
  }
  const handle = payload.handle.trim().toLowerCase();
  const password = payload.password.trim();
  const pds =
    payload.pds?.trim().replace(/\/+$/, "") ||
    (await lookupPds(await resolveHandle(handle)));
  const session = await createSession({ identifier: handle, password, pds });
  const stored = {
    handle: session.handle ?? handle,
    did: session.did,
    accessJwt: session.accessJwt,
    refreshJwt: session.refreshJwt,
    email: session.email ?? null,
    pds,
    createdAt: new Date().toISOString()
  };
  await setStoredAuth(stored);
}
