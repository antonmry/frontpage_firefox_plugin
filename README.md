## ATProto Social — Firefox extension

A Firefox WebExtension for publishing to ATProto-based social platforms directly from your browser.

> ℹ️ This repository is hosted on [tangled](https://tangled.org/anton.galiglobal.com/frontpage_firefox_plugin) (PRs, issues) and [GitHub](https://github.com/antonmry/frontpage_firefox_plugin) (CI/CD, releases).

### Features

- **Margin tab** — select text on any page and publish it as a highlight or annotation to [margin.at](https://margin.at):
  - No comment → creates an `at.margin.highlight` record.
  - With comment → creates an `at.margin.annotation` record (`motivation: commenting`).
  - Uses the W3C `TextQuoteSelector` (exact text + surrounding context) for precise targeting.
- **Frontpage tab** — share the current tab to [frontpage.fyi](https://frontpage.fyi) by creating a `fyi.frontpage.feed.post` record on your ATProto account.
  - Auto-fills the active tab's title and URL.
  - Title length indicator (120 character limit).
- Background service worker handles ATProto login, token refresh, and record creation for both services.
- Options page for storing your handle, app password, and optional PDS override.

### Prerequisites

- An ATProto account (Bluesky or self-hosted PDS).
- An app password for that account (create one at <https://bsky.app/settings/app-passwords> or via your own PDS).

### Install a packaged build

1. Visit the [Releases](https://github.com/antonmry/frontpage_firefox_plugin/releases) page and download the latest `frontpage-submitter-<version>.xpi` (signed) or `.zip` (unsigned) asset.
2. In Firefox, open `about:addons`, click the gear icon, and choose **Install Add-on From File…**.
3. Select the downloaded `.xpi` (preferred) or `.zip` to complete the installation and approve the permissions prompt.

### Configure credentials

1. Open the add-on pop-up and press the gear icon (or use `about:addons` → **Preferences**).
2. Enter your handle and app password. Supply a PDS URL only if you run a custom server.
3. Click **Save credentials**. A success message confirms that the session tokens are stored locally.
4. Use **Log out** at any time to remove stored tokens (you can also revoke the app password server-side).

### Publish a highlight or annotation (Margin)

1. Select text on any webpage.
2. Open the ATProto Social pop-up — the **Margin** tab opens by default with the selected text pre-filled.
3. Optionally add a comment (turns a highlight into an annotation).
4. Click **Highlight on Margin** or **Annotate on Margin**.

### Submit a link (Frontpage)

1. Browse to the page you want to share.
2. Open the ATProto Social pop-up and switch to the **Frontpage** tab; the title and URL are pre-filled.
3. Adjust the text if necessary and click **Post to Frontpage**.
4. On success, the pop-up reports the record URI returned by `com.atproto.repo.createRecord`.

### Implementation notes

- The background worker discovers the user's PDS by resolving the handle (`com.atproto.identity.resolveHandle` + PLC lookup).
- Sessions are refreshed automatically via `com.atproto.server.refreshSession` when the access JWT expires.
- All data stays in `browser.storage.local`; nothing is transmitted to third-party services beyond the ATProto endpoints.
- Margin records use the `at.margin.annotation` and `at.margin.highlight` lexicons with a `TextQuoteSelector` for text targeting.
- Maximum lengths follow the current Frontpage limits (120 characters for the title, 2048 for URLs).

### Development tips

- Inspect background/service-worker logs from `about:debugging` → **Inspect**.
- The UI scripts (`popup.js` and `options.js`) log to the DevTools console attached to their respective documents.
- When packaging for distribution, zip the contents of the `extension/` directory (see workflow below).
- Licensed under the [Apache License 2.0](./LICENSE).

### Development install (temporary)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and choose `manifest.json` inside the `extension/` directory.
3. Pin the "ATProto Social" toolbar button if you want quick access.

> This method is ideal while iterating; Firefox forgets the add-on on restart.

### Self-distribution pipeline

This repository includes `.github/workflows/package-extension.yml` which builds (and optionally signs) the add-on using [`web-ext`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).

1. Configure `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repository secrets with your AMO API credentials if you want automatic signing.
   Without the secrets, the workflow still produces an unsigned ZIP you can download.
2. Trigger the workflow manually (`Actions` → **package-extension** → **Run workflow**).
3. Download the artifacts:
   - `frontpage-extension-unsigned` contains the ZIP that `web-ext build` generates.
   - `frontpage-extension-signed` (only when secrets are present) contains the signed `.xpi` from AMO for self-hosting.
4. Each run also publishes a GitHub Release (tagged `v<version>-<run-id>`) that ships the same ZIP/XPI assets, so you can share a permanent download link.
   - Mozilla requires every signed upload to have a unique version number. Bump `version` in `extension/manifest.json` before rerunning the workflow if you need a new signed package.

These artifacts can be hosted directly for self-distribution as described in the [Mozilla documentation](https://extensionworkshop.com/documentation/publish/self-distribution/).

### Tangled mirror

The `mirror-to-tangled.yml` workflow pushes every commit on `main` to Tangled, a federated Git hosting platform built on ATProto.
Browse the mirror at <https://tangled.org/anton.galiglobal.com/frontpage_firefox_plugin>.
Add a deploy key with write access as the `TANGLED_DEPLOY_KEY` repository secret so the mirror stays up to date.
