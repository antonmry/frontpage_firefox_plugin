# Contributing to ATProto Social

## Development install (temporary)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and choose `manifest.json` inside the
   `extension/` directory.
3. Pin the "ATProto Social" toolbar button if you want quick access.

> This method is ideal while iterating; Firefox forgets the add-on on restart.

## Development tips

- Inspect background/service-worker logs from `about:debugging` → **Inspect**.
- The UI scripts (`popup.js` and `options.js`) log to the DevTools console
  attached to their respective documents.
- When packaging for distribution, zip the contents of the `extension/`
  directory (see workflow below).
- Licensed under the [Apache License 2.0](./LICENSE).

## Implementation notes

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

## Cutting a release

Mozilla requires every signed upload to have a unique version number, so the
first step is always bumping the version.

**1. Bump the version in `extension/manifest.json`:**

```json
"version": "0.1.7"
```

**2. Commit and push to `main`:**

```sh
git add extension/manifest.json
git commit -m "Bump version to 0.1.7"
git push
```

**3. Trigger the `package-extension` workflow:**

Via the GitHub UI (`Actions` → **package-extension** → **Run workflow**), or
with the `gh` CLI:

```sh
gh workflow run package-extension.yml --repo antonmry/atproto_firefox_plugin
```

**4. Monitor the run:**

```sh
gh run list --workflow=package-extension.yml --repo antonmry/atproto_firefox_plugin
gh run watch --repo antonmry/atproto_firefox_plugin
```

**5. Check the resulting release:**

```sh
gh release list --repo antonmry/atproto_firefox_plugin
gh release view --repo antonmry/atproto_firefox_plugin
```

The workflow publishes a GitHub Release tagged `v<version>-<run-id>` with the
signed `.xpi` (when `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` secrets are set) and
an unsigned `.zip`. These artifacts can be hosted directly for self-distribution
as described in the
[Mozilla documentation](https://extensionworkshop.com/documentation/publish/self-distribution/).

## Tangled mirror

The `mirror-to-tangled.yml` workflow pushes every commit on `main` to Tangled, a
federated Git hosting platform built on ATProto. Browse the mirror at
<https://tangled.org/anton.galiglobal.com/frontpage_firefox_plugin>. Add a
deploy key with write access as the `TANGLED_DEPLOY_KEY` repository secret so
the mirror stays up to date.
