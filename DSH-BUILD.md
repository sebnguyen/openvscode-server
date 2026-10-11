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
  mounts an iframe at `<url>/?tkn=<token>&folder=<workspaceRoot>`.
- **Twin dist** — `../scripts/prepare-vscode-twin.sh` stages
  `vscode-reh-web-linux-x64` as `.vscode-twin/dist` (the REH-web artifact is
  self-contained: server binary plus the workbench it serves).

```sh
cd deepseek-harness-web-editor-m1
DSH_VSCODE_TWIN_DIST=/home/snguyen/dev/digitalocean/idk/.vscode-twin/dist pnpm dsh web --no-open
```

## License / hosting posture

OSS Code OSS *source*; never Microsoft's branded VS Code Server binary (its license forbids hosting as a service). Open VSX replaces the Microsoft VS Marketplace (whose terms bind official builds only).
