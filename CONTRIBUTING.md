## Contributing to ATProto Social

### Development install (temporary)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and choose `manifest.json` inside the
   `extension/` directory.
3. Pin the "ATProto Social" toolbar button if you want quick access.

> This method is ideal while iterating; Firefox forgets the add-on on restart.

### Development tips

- Inspect background/service-worker logs from `about:debugging` → **Inspect**.
- The UI scripts (`popup.js` and `options.js`) log to the DevTools console
  attached to their respective documents.
- When packaging for distribution, zip the contents of the `extension/`
  directory (see workflow below).
- Licensed under the [Apache License 2.0](./LICENSE).

### Implementation notes

- The background worker discovers the user's PDS by resolving the handle
  (`com.atproto.identity.resolveHandle` + PLC lookup).
- Sessions are refreshed automatically via `com.atproto.server.refreshSession`
  when the access JWT expires.
- All data stays in `browser.storage.local`; nothing is transmitted to
  third-party services beyond the ATProto endpoints.
- Margin records use the `at.margin.annotation` and `at.margin.highlight`
  lexicons with a `TextQuoteSelector` for text targeting.
- Maximum lengths follow the current Frontpage limits (120 characters for the
  title, 2048 for URLs).

### Self-distribution pipeline

This repository includes `.github/workflows/package-extension.yml` which builds
(and optionally signs) the add-on using
[`web-ext`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).

1. Configure `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repository secrets with your
   AMO API credentials if you want automatic signing. Without the secrets, the
   workflow still produces an unsigned ZIP you can download.
2. Trigger the workflow manually (`Actions` → **package-extension** →
   **Run workflow**).
3. Download the artifacts:
   - `frontpage-extension-unsigned` contains the ZIP that `web-ext build`
     generates.
   - `frontpage-extension-signed` (only when secrets are present) contains the
     signed `.xpi` from AMO for self-hosting.
4. Each run also publishes a GitHub Release (tagged `v<version>-<run-id>`) that
   ships the same ZIP/XPI assets, so you can share a permanent download link.
   - Mozilla requires every signed upload to have a unique version number. Bump
     `version` in `extension/manifest.json` before rerunning the workflow if you
     need a new signed package.

These artifacts can be hosted directly for self-distribution as described in the
[Mozilla documentation](https://extensionworkshop.com/documentation/publish/self-distribution/).

### Tangled mirror

The `mirror-to-tangled.yml` workflow pushes every commit on `main` to Tangled, a
federated Git hosting platform built on ATProto. Browse the mirror at
<https://tangled.org/anton.galiglobal.com/frontpage_firefox_plugin>. Add a
deploy key with write access as the `TANGLED_DEPLOY_KEY` repository secret so
the mirror stays up to date.
