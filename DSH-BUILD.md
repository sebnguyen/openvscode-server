# DSH Editor Build — Scope Document

Branch: `dsh-build` — lean, extension-adaptable OSS VS Code twin (Cursor-IDE posture: stock editor parts + language servers + git + debug + terminal, marketplace = Open VSX).

## Twin artifacts (the pair every release ships)

| Artifact | Lane | Output dir |
|---|---|---|
| REH-web (server **plus** the web workbench it serves) | `gulp vscode-reh-web-linux-x64` | `../vscode-reh-web-linux-x64` |

Twin rule: build the twin from one commit (`f6a70e2a…` upstream pin + our patch layer).
The lane name matters: `vscode-reh-linux-x64` (esbuild target `server`) is
headless — it has no `out/vs/code/browser/workbench/workbench.{js,css}`, so it
404s the workbench assets; `vscode-reh-web-linux-x64` (target `server-web`)
bundles and serves them. `vscode-web-linux-x64` / `vscode-web` are the
disconnected static-web-client lanes and are not what the REH serves.

## No Electron native build

This branch does not compile desktop natives. Root `.npmrc` has no Electron
`target`, so `build/npm/preinstall.ts` does not download Electron headers, and
root `allowScripts` is false, so `npm ci` does not node-gyp the root tree.
`remote/.npmrc` stays `runtime=node` and `remote/package.json` still builds the
server natives (`node-pty`, `kerberos`, `spdlog`, `sqlite3`, ripgrep, watcher,
watchdog, `fs-copyfile`, `policy-watcher`). `gulp vscode-reh-web-*` packages
that remote tree, not `node_modules` at the repo root.

## Dark first paint (harness embedding)

The twin mounts inside a dark host page, so stock white boot states flash
against it. Two source-level patches cover the two flash windows:

- `src/vs/code/browser/workbench/workbench.html` — `color-scheme: dark` plus an
  inline `html, body { background: #121618 }` so the document canvas never
  renders white while scripts load. Durable (carries through every build).
- `src/vs/server/node/webClientServer.ts` — `initialColorTheme` on the
  workbench web configuration with DO Harness Dark boot colors, so the theme
  service paints dark until `configurationDefaults` merge and the real theme
  takes over (this is exactly what the upstream hook is for, per web.api.ts).

Both land via rebuilds; the currently staged `../.vscode-twin/dist` carries
the same html patch applied directly to its built copy.

## Kept functionality

### Workbench core (client bundle)
- File explorer, tabs, multi-cursor editing, search / find-replace, quick open
- Problems panel, comment threads API, hover/intellisense UI
- Settings, keymaps, themes, command palette, workspaces
- Real **terminal** (pty on server via `node-pty`, xterm.js front end, stock bottom panel)
- **Debugger** core UI (breakpoints, watch, call stack, variables)

### Debugger ships
- `ms-vscode.js-debug` — Node/browser/VS Code debugging
- `ms-vscode.js-debug-companion`
- `ms-vscode.vscode-js-profile-table`
- `debug-auto-launch`, `debug-server-ready` (JS debugging helpers)

### Language / LSP
- `typescript-language-features` (TS/JS intellisense)
- `json-language-features`, `css-language-features`, `html-language-features` (+ their servers)
- All bundled grammar packs (syntax highlighting for most languages)

### Source control
- `git` + `git-base` — stage/commit/diff/blame, SCM view, merge states

### Markdown
- `markdown-language-features` — preview, outline, links
- `markdown-math` — KaTeX in preview

### Configuration
- `configuration-editing` — settings.json intellisense

### Media bundles
- Only markdown preview + math media (notebook, mermaid, simple-browser webviews stripped — ~47 MB saved)

### Extension ecosystem
- Extension host with full extension API (stable + workspace-kind extensions run server-side on the REH)
- **Gallery: Open VSX** (`https://open-vsx.org`) — extensions installable from the marketplace UI in-product

## Removed

| Removed | Reason |
|---|---|
| `copilot` (in-tree GitHub Copilot pipeline incl. ripgrep-shim packaging hook) | Was the failing packaging step; AI comes from the DSH harness |
| `github`, `microsoft-authentication` | MS auth providers; plain git works without them |
| `ipynb`, `notebook-renderers` | Notebook surfaces out of scope |
| `mermaid-markdown-features`, `media-preview`, `simple-browser` | Heavy webview renderers |
| `php-language-features`, `extension-editing` | Language extras out of scope |
| `grunt`, `gulp`, `jake`, `npm`, `search-result`, `references-view`, `merge-conflict`, `terminal-suggest`, `tunnel-forwarding`, `emmet` | Slimming scope |
| `js-debug` had been dropped once — restored as part of scope | — |

## Patch layer (the entire delta vs upstream `f6a70e2a`)

| File | Change |
|---|---|
| `build/gulpfile.reh.ts` | Removed `compileCopilotExtensionBuildTask` from REH composition and the `prepareCopilotRipgrepShimTaskREH` hook from packageTasks |
| `build/lib/extensions.ts` | `excludedExtensions` extended with the drop list above |
| `product.json` | `builtInExtensions` = js-debug trio (restored from upstream); `extensionsGallery` added → Open VSX |
| `src/vs/code/browser/workbench/workbench.html` | Dark first paint: `color-scheme: dark` + inline body `#121618` |
| `src/vs/server/node/webClientServer.ts` | `initialColorTheme` boot colors; `configurationDefaults` block with startup-critical identity keys (`workbench.startupEditor: none`, `workbench.tips.enabled`, `workbench.secondarySideBar.defaultVisibility: hidden`, `chat.disableAIFeatures`, `workbench.experimental.modernUI: true`) — the extension channel races LayoutStateModel construction and would flash the welcome page / open the aux bar once per fresh profile |
| `src/vs/workbench/browser/parts/editor/media/letterpress-*.svg` (×4) | OSS letterpress replaced with the DO twinkle pixel mark (big 24-grid `pixel-do-twinkle.svg`, `fill #7bb4bc` dark / `#2e565e` light), the only mark in the empty editor |
| `src/vs/workbench/browser/parts/titlebar/titlebarPart.ts` + `media/titlebarpart.css` | OSS titlebar-left `window-appicon` (35px OSS code icon) deleted — element never created, rules removed |
| `src/vs/workbench/browser/media/floatingPanels.css` | DSH block: `--vscode-cornerRadius-large: 14px` (the react frame's `--dsh-frame-card-radius`) and the ocean-scene backdrop (sea, god rays, two-pitch dot grid, depth fog) on `.monaco-workbench.floating-panels` + grid view; slow `dsh-ocean-drift` drift animation |

The empty editor therefore shows exactly one mark — the big DO twinkle —
and the workbench runs the floating-window architecture: parts as rounded
cards over the ambient ocean scene, matching `ui-layout`'s AppFrame. The
identity extension (`packages/api/ide/src/twin-theme.ts`) enables
`workbench.experimental.modernUI` and supplies `modernUI.shellBackground
#0e1214` / `surface.border #f7f8f81f`; the staged `../.vscode-twin/dist`
carries all of the above applied to its built copies (workbench.css,
server-main.js, letterpress files, staged extension package.json + theme
JSON).

## Static-asset cache trap (release ritual)

The REH serves every product asset under `/oss-<commit>/` with
`Cache-Control: max-age=31536000`. `product.json`'s `commit` is pinned to the
upstream `f6a70e2a…`, so a rebuilt twin with the same pin reuses every URL —
browsers that visited before keep the OLD css/svg for a year and
hard-reloads inside the harness page don't always reach cached iframe
subresources. Any release that changes `out/` content must bump the product `commit`
to invalidate the year-cached product URLs — but bump it **consistently or
not at all**: the commit is compiled into `workbench.js`, `server-main.js`,
the extension-host mains and the bin shims, and the server refuses any
client whose commit differs (`remoteExtensionHostAgentServer.ts`
"Client refused: version mismatch"). A `product.json`-only bump leaves the
compiled client at the old id and bricks every boot. Either rebuild, or
replace the old hash in all ~9 stamped files (product.json, out/server-main.js,
out/vs/code/browser/workbench/workbench.js, out/vs/platform/{agentHost/node/agentHostMain.js,
terminal/node/ptyHostMain.js}, out/vs/workbench/api/{node/extensionHostProcess.js,
worker/extensionHostWorkerMain.js}, bin/helpers/browser.sh, bin/remote-cli/code-oss)
and drop `.dsh/user/.../extensions.*.cache`. Since every gulp lane stamps
`commit` from git HEAD (`build/gulpfile.vscode.ts` → `getVersion`), a normal
rebuild already rotates the namespace whenever HEAD moved; the running
`.vscode-twin/dist` currently ships `696dcfb0b9e49842e49de9f2b2b0cf84fa8da5b1`
(built 2026-10-13 from working tree: HEAD 696dcfb0 + uncommitted patch layer).

## Build procedure (this machine)

```sh
cd /home/snguyen/dev/digitalocean/idk/vscode
source ~/.nvm/nvm.sh && nvm use 24.18.0        # repo requires node 24.18.0+
# one-time deps: npm ci at root, then postinstall subdirs (npm ci per dir), then:
CC=gcc CXX=g++ npm_config_devdir=$PWD/.node-gyp-cache \
  npm run compile                                # dev compile (needed for code-web.sh)
CC=gcc CXX=g++ npm_config_devdir=$PWD/.node-gyp-cache \
  node --experimental-strip-types --max-old-space-size=8192 \
  ./node_modules/gulp/bin/gulp.js vscode-reh-web-linux-x64
```

Machine gotcha notes restraints:
- `libkrb5-dev` required (remote `kerberos` gyp build)
- npm cache/home must be writable (`--cache` / tmp inside workspace used here)
- `npm_config_devdir` redirected into workspace for node-gyp headers
- If local g++-11 is referenced, keep `CC=gcc CXX=g++` exported

## Harness integration (scaffold, wired in `deepseek-harness-web-editor-m1`)

- **`packages/api/ide`** — `@deepseek-ai/dsh-api-ide` host row: owns the
  `ideBridge` Remote namespace and spawns one `code-server-oss` child per
  session (`--host 127.0.0.1`, free port, per-spawn `--connection-token`,
  twin-local `--server-data-dir`/`--user-data-dir`/`--extensions-dir` under
  `<dist>/.dsh/`). `ideBridge.status(sessionId)` lazily spawns and answers
  `{ enabled, ready, url, tkn, workspaceRoot }`.
- **`packages/client/ui-vscode`** — `@deepseek-ai/dsh-client-ui-vscode`:
  right-sidebar tab type `vscode` at the `extension` band (above the builtin
  CodeMirror editor) for `dsh-resource://file/**`; its body polls status and
  mounts the twin iframe *under* the boot hero, lifting the hero only after
  the iframe's `load` event + `BOOT_SETTLE_MS` (1.2s) — the anti-flash wait
  that keeps the twin's unstyled boot window out of the pane.
- **Twin dist** — `../scripts/prepare-vscode-twin.sh` stages
  `vscode-reh-web-linux-x64` as `.vscode-twin/dist` (the REH-web artifact is
  self-contained: server binary plus the workbench it serves).

```sh
cd deepseek-harness-web-editor-m1
DSH_VSCODE_TWIN_DIST=/home/snguyen/dev/digitalocean/idk/.vscode-twin/dist pnpm dsh web --no-open
```

## License / hosting posture

OSS Code OSS *source*; never Microsoft's branded VS Code Server binary (its license forbids hosting as a service). Open VSX replaces the Microsoft VS Marketplace (whose terms bind official builds only).
