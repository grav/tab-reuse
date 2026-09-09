# Tab Reuse

A Chrome extension that sends a clicked link to the first pinned tab with the
same hostname. For example, clicking `https://github.com/foobar` focuses and
navigates a pinned tab currently showing `https://github.com/baz`.

Clicks within the current hostname are left to the website, preserving in-app
actions and navigation. For links to other hostnames, clicks canceled by the
website are also left alone.

Links opened into Chrome from other applications—such as Terminal, Slack, or
Mail—are handled too. Chrome briefly creates a new tab; the extension routes
its URL to the matching pinned tab and closes the redundant tab.

Only pinned tabs in the window where the link opens are considered, from left
to right. Pinned tabs in other windows are never reused. Matching is exact, so
`github.com` and `gist.github.com` are different hostnames.

## Install

Download the ZIP from the
[latest automated build](https://github.com/grav/tab-reuse/releases/tag/latest),
extract it, then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the extracted directory.

The extension handles HTTP and HTTPS links clicked in webpages, including links
that normally open in a new tab. It also handles new tabs opened by external
applications. Pages where Chrome does not allow content scripts, such as
`chrome://` pages and the Chrome Web Store, are still covered when they open a
new tab.

## Test

For local development, copy the runtime files to
`~/.local/share/chromium-extensions/tab-reuse`:

```sh
npm run copy-extension
```

The script replaces an existing destination symlink with a regular directory.
Load that directory as an unpacked extension. After each code change, run the
script again, reload the extension in `chrome://extensions`, and refresh the
affected pages.

```sh
npm test
```

## Release

Update the version in `manifest.json` and `package.json`, commit it, then push a
matching tag:

```sh
git tag v0.2.0
git push origin v0.2.0
```

Every pushed commit runs the tests, packages only the extension runtime files,
and uploads the ZIP and its SHA-256 checksum as a workflow artifact. Pushes to
`main` also update the rolling `latest` prerelease. A matching version tag
publishes a stable, versioned GitHub Release. Tagged builds fail if the tag and
manifest versions do not match.
