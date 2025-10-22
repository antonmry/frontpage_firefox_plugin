## frontpage.fyi Firefox extension

This repository provides a Firefox WebExtension that lets you share the current tab to [frontpage.fyi](https://frontpage.fyi) with minimal effort.  
Links are submitted by creating `fyi.unravel.frontpage.post` records on your ATProto account, the same mechanism the official Frontpage site uses.

> ℹ️ The Frontpage source code lives at <https://tangled.org/did:plc:klmr76mpewpv7rtm3xgpzd7x/frontpage>.

### Features

- Pop-up form that auto-fills the active tab’s title and URL.
- Title length indicator (120 characters, matching the Frontpage UI).
- Background service worker handles ATProto login, token refresh, and record creation.
- Options page for storing your handle, app password, and optional PDS override.
- Convenience links to open frontpage.fyi or the options page from the pop-up.

### Prerequisites

- An ATProto account that Frontpage can read.
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

### Submit a link

1. Browse to the page you want to share.
2. Open the Frontpage pop-up; the title and URL are pre-filled.
3. Adjust the text if necessary and click **Post to Frontpage**.
4. On success, the pop-up reports the record URI returned by `com.atproto.repo.createRecord`.

### Implementation notes

- The background worker discovers the user’s PDS by resolving the handle (`com.atproto.identity.resolveHandle` + PLC lookup).
- Sessions are refreshed automatically via `com.atproto.server.refreshSession` when the access JWT expires.
- All data stays in `browser.storage.local`; nothing is transmitted to third-party services beyond the ATProto endpoints.
- Maximum lengths follow the current Frontpage limits (120 characters for the title, 2048 for URLs).

### Development tips

- Inspect background/service-worker logs from `about:debugging` → **Inspect**.
- The UI scripts (`popup.js` and `options.js`) log to the DevTools console attached to their respective documents.
- When packaging for distribution, zip the contents of the `extension/` directory (see workflow below).
- Licensed under the [Apache License 2.0](./LICENSE).

### Development install (temporary)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and choose `manifest.json` inside the `extension/` directory.
3. Pin the “Frontpage” toolbar button if you want quick access.

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
