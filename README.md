## ATProto Social — Firefox extension

A Firefox WebExtension for publishing to ATProto-based social platforms directly
from your browser.

> ℹ️ This repository is hosted on
> [tangled](https://tangled.org/anton.galiglobal.com/frontpage_firefox_plugin)
> (PRs, issues) and [GitHub](https://github.com/antonmry/atproto_firefox_plugin)
> (CI/CD, releases).

### Features

- **Margin tab** — select text on any page and publish it as a highlight or
  annotation to [margin.at](https://margin.at):
  - No comment → creates an `at.margin.highlight` record.
  - With comment → creates an `at.margin.annotation` record
    (`motivation: commenting`).
  - Uses the W3C `TextQuoteSelector` (exact text + surrounding context) for
    precise targeting.
- **Frontpage tab** — share the current tab to
  [frontpage.fyi](https://frontpage.fyi) by creating a `fyi.frontpage.feed.post`
  record on your ATProto account.
  - Auto-fills the active tab's title and URL.
  - Title length indicator (120 character limit).
- Background service worker handles ATProto login, token refresh, and record
  creation for both services.
- Options page for storing your handle, app password, and optional PDS override.

### Prerequisites

- An ATProto account (Bluesky or self-hosted PDS).
- An app password for that account (create one at
  <https://bsky.app/settings/app-passwords> or via your own PDS).

### Install on Firefox (desktop)

1. Visit the
   [Releases](https://github.com/antonmry/atproto_firefox_plugin/releases) page
   and download the latest `frontpage-submitter-<version>.xpi` (signed) or
   `.zip` (unsigned) asset.
2. In Firefox, open `about:addons`, click the gear icon, and choose
   **Install Add-on From File…**.
3. Select the downloaded `.xpi` (preferred) or `.zip` to complete the
   installation and approve the permissions prompt.

### Install on Firefox for Android

Firefox for Android requires enabling the **"Install from file"** option first:

1. Open Firefox for Android → tap the three-dot menu → **Settings** →
   **About Firefox**.
2. Tap the Firefox logo **5 times** to unlock debug options.
3. Go back to **Settings** — a new **Install extension from file** option now
   appears at the bottom.
4. Download the signed `.xpi` from the
   [Releases](https://github.com/antonmry/atproto_firefox_plugin/releases) page
   to your device.
5. Tap **Install extension from file**, select the downloaded `.xpi`, and
   approve the permissions prompt.

> The extension must be signed by Mozilla. Unsigned `.xpi` files are rejected on
> Android. Use the signed asset from the releases page.

### Configure credentials

1. Open the add-on pop-up and press the gear icon (or use `about:addons` →
   **Preferences**).
2. Enter your handle and app password. Supply a PDS URL only if you run a custom
   server.
3. Click **Save credentials**. A success message confirms that the session
   tokens are stored locally.
4. Use **Log out** at any time to remove stored tokens (you can also revoke the
   app password server-side).

### Publish a highlight or annotation (Margin)

1. Select text on any webpage.
2. Open the ATProto Social pop-up — the **Margin** tab opens by default with the
   selected text pre-filled.
3. Optionally add a comment (turns a highlight into an annotation).
4. Click **Highlight on Margin** or **Annotate on Margin**.

### Submit a link (Frontpage)

1. Browse to the page you want to share.
2. Open the ATProto Social pop-up and switch to the **Frontpage** tab; the title
   and URL are pre-filled.
3. Adjust the text if necessary and click **Post to Frontpage**.
4. On success, the pop-up reports the record URI returned by
   `com.atproto.repo.createRecord`.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, build pipeline,
and implementation notes.
