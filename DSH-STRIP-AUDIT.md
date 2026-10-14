# DSH Strip Audit — What the Twin Lane Actually Lost

Status of the DSH strip series as of `d87a5b5e` (push state `origin/dsh-build`).
Complements `DSH-STRIP.md` (the playbook for future strips): this is the ledger
of what already happened, what broke along the way, and what is still open.

## The strip series, oldest → newest

| Commit | Type | One-line |
|---|---|---|
| `5735069b` | build/product | lean OSS twin lane: copilot pipeline out, builtin extensions slimmed, Open VSX gallery |
| `175b792e` | build | tolerate missing Electron pins in root `.npmrc` |
| `d7c73905` | build | skip `@vscode/deviceid` in the remote install |
| `08be9bc2` | build | `.npmrc` retargets natives from Electron to nothing; root `allowScripts` all false |
| `29cb8d4f` | product | drop copilot `product.json` config; guard its readers; restore mermaid + media-preview |
| `cc19a372` | source | **the frontend strip**: chat/inlineChat contributions + chat mainThread glue out of the twin mains |
| `a829b10b` | fix | null chat-service singletons (5 ids) + `terminal.all.twin.ts` fork |
| `760ca4ca` | build | single-pass extension-resource minify (node 24 stall; unrelated to DI) |
| `2b002302` | docs | strip playbook (`DSH-STRIP.md`) |
| `d87a5b5e` | fix | null terminal chat services (2 ids) — terminal view unbroken |

Backend lane (`serverServices.ts` channels) was **not** touched — the strip is
frontend + product + build tooling only. Sessions lanes
(`src/vs/sessions/*.main.ts`) are untouched everywhere and keep the full chat
feature set.

## Inventory per commit

### `5735069b` — lean twin lane (build/product baseline)

- **Gulp REH composition**: removed `compileCopilotExtensionBuildTask` and the
  `prepareCopilotRipgrepShimTaskREH` packaging hook from `build/gulpfile.reh.ts`.
- **Builtin extensions dropped** (`excludedExtensions` in `build/lib/extensions.ts`):
  `emmet, extension-editing, grunt, gulp, jake, ipynb, media-preview,
  merge-conflict, mermaid-markdown-features, microsoft-authentication,
  notebook-renderers, npm, php-language-features, references-view,
  search-result, simple-browser, terminal-suggest, tunnel-forwarding`.
- **Webview esbuild media scripts trimmed** to markdown preview + math only.
- **`product.json`**: extensionsGallery → Open VSX.

### `175b792e` / `d7c73905` / `08be9bc2` — native-module direction change

- `.npmrc` `disturl`/`runtime` repointed from Electron 43 headers to `node`.
- Root `package.json` `allowScripts` set **false for every native package**
  (`node-pty`, `@vscode/spdlog`, `@vscode/native-watchdog`, `@parcel/watcher`,
  `@vscode/ripgrep`, sqlite3, keymap, deviceid, …).
- `remote/package.json` drops `@vscode/deviceid` (its script expects Electron
  headers).
- **Side effect**: root `node_modules` has **no native bindings built**. Dev
  runs after a fresh `npm ci` need manual `node-gyp rebuild` (spdlog, node-pty;
  `@vscode/native-watchdog` still unbuilt → ext-host console error, non-fatal).

### `29cb8d4f` — copilot out of `product.json`

- Deleted: `defaultChatAgent: GitHub.copilot`, `trustedExtensionAuthAccess`,
  `voiceWsUrl`, `builtInExtensionsEnabledWithAutoUpdates`.
- **Guarded readers** that dereferenced `defaultChatAgent` unconditionally:
  gallery query deprecation map, uninstall paths, `BlockStartup` default-account
  contribution, onboarding module assert, chat welcome message
  (`abstractExtensionManagementService.ts`, `extensionGalleryService.ts`,
  `chatWidget.ts`, `extensionsWorkbenchService.ts`, `onboardingVariationA.ts`,
  `defaultAccount.ts` — the guard patch layer documented in `DSH-BUILD.md`).
- **Restored** `mermaid-markdown-features` + `media-preview` to the shipped set
  (removed 2 entries from the `5735069b` drop list).

### `cc19a372` — the frontend chat/inlineChat strip (the drastic one)

Removed side-effect imports from the twin mains
(`workbench.common.main.ts`, `workbench.desktop.main.ts`):

- `chat/browser/chat.shared.contribution.js`
- `chat/browser/chat.contribution.js`
- `chat/browser/agentSessions/agentHost/agentHost.contribution.js`
- `chat/browser/remoteAgentHost/remoteAgentHost.contribution.js`
- `chat/browser/chat.view.contribution.js`
- `inlineChat/browser/inlineChat.contribution.js`
- `chat/browser/chatSessions/chatSessions.contribution.js`
- `chat/browser/contextContrib/chatContext.contribution.js`
- `chat/browser/onboarding/modelPickerTryout.contribution.js`
- `chat/electron-browser/chat.contribution.js`, `chat/electron-browser/tunnelHost.contribution.js`

Removed chat mainThread glue from `api/browser/extensionHost.contribution.ts`
(and the notebook cell-chat controller from `notebook.contribution.ts`):

- `mainThreadLanguageModels.js`, `mainThreadChatAgents2.js`,
  `mainThreadChatCodeMapper.js`, `mainThreadLanguageModelTools.js`,
  `mainThreadChatContext.js`, `mainThreadChatDebug.js`, `mainThreadChatStatus.js`,
  `mainThreadChatQuota.js`, `mainThreadChatInputNotification.js`,
  `mainThreadChatOutputRenderer.js`, `mainThreadChatSessions.js`,
  `controller/chat/notebook.chat.contribution.js`

Compensation shipped in the same commit: `nullChatServices.ts` with no-op
singletons for `IChatService` + `IChatWidgetService` (tasks, quick symbol
access still inject those).

### `a829b10b` — null fix, wave 1

`nullChatServices.ts` gained nulls for `IChatAgentService`,
`IChatContextPickService`, `IChatCodeBlockContextProviderService`,
`IChatSpeechToTextService`, `ILanguageModelToolsService` — the first terminal
break (`DecorationAddon` per-terminal injection) and latent tasks/hints/
accessible-view/dictation/MCP injections. Also forked `terminal.all.ts` →
`terminal.all.twin.ts` (drops chat/chatAgentTools/voice terminal contributions).

### `d87a5b5e` — null fix, wave 2 (the terminal, for real)

`TerminalTabbedView` (1.142 redesign) injects **terminal's own** chat ids.
New `nullTerminalChatServices.ts` registers `ITerminalChatService` +
`ITerminalChatSessionResolver` nulls, imported only by `terminal.all.twin.ts`.
Verified live: terminal view renders, xterm paints.

## Breakage ledger

Observed in the headless-browser repro of the twin (and in your sessions).
Root cause is always the same mechanic: **contribution removed from the twin
mains, kept code still DI-injects its services, resolution is lazy, failure
lands on first use**.

| # | Error (console) | Missing id | Where it registered | Status |
|---|---|---|---|---|
| 1 | `DecorationAddon` etc. — chat service ids unregistered | `IChatContextPickService` +4 | `chat.shared.contribution.js` (cc19a372) | **fixed** `a829b10b` |
| 2 | `Fail to render view terminal … TerminalTabbedView depends on UNKNOWN service terminalChatService` | `ITerminalChatService`, resolver | `terminalContrib/chat` (dropped by twin lane fork) | **fixed** `d87a5b5e` |
| 3 | `MainThreadChatOutputRenderer depends on UNKNOWN service chatOutputRendererService` (per ext-host start, via `MainThreadWebviewManager`) | `IChatOutputRendererService` | `chat.shared.contribution.js` | **open** — noisy at every ext-host boot; webview manager instantiates it unconditionally |
| 4 | `Missing proxy instance MainThreadLanguageModels` (github auth/account flows) | mainThread language-models actor | `extensionHost.contribution.ts` import (cc19a372) | **open** |
| 5 | `Unknown actor MainThreadChatSkills` (pageerror, ext-host RPC) | mainThread chat-skills actor | same | **open** |
| 6 | `PluginMcpDiscovery depends on UNKNOWN service agentPluginService` | `IAgentPluginService` | `chat.shared.contribution.js` | **open** |
| 7 | `ExtensionsContributions depends on UNKNOWN service pluginInstallService` | `IPluginInstallService` | `chat.shared.contribution.js` | **open** |
| 8 | `agentsVoiceConnectedKey` / `agentsVoiceOnboarding` contributions fail | `IPromptsService` | `chat.shared.contribution.js` | **open** |
| 9 | `startupPageRunner` fails: `onboardingService → chatMicrosoftSignInProbeService` | `IChatMicrosoftSignInProbeService` | `chat.shared.contribution.js` | **open** |

All five open service ids (#3, #6–#9) were registered **exclusively** in
`chat.shared.contribution.ts`. Their consumers (MCP, extensions,
voice/onboarding, webview manager) were kept — those are not chat UI, so the
strip was too coarse to drop the whole `chat.shared` registration bank without
splitting service registration out of it first.

## Assessment — too drastic, and what's salvageable

The commit's premise — "the twin shipped every chat contribution gated only by
`chat.disableAIFeatures`, so deforce-import the UI" — is fine for
`chat.contribution`, `chat.view.contribution`, `inlineChat`, `chatSessions`,
`contextContrib`, `modelPickerTryout`. The two overreach calls were:

1. **`chat.shared.contribution.js`** — it's not UI; it's the registration bank
   for ~50 chat/AI services, and kept features (MCP, extensions, voice,
   onboarding, account/default-flow, terminal chat ids) depend on slices of it.
   Cost so far: two fix commits + five open errors + ext-host log spam.
2. **The chat mainThread batch in `extensionHost.contribution.ts`** — dropping
   all chat mainThread glue assumed no ext-host RPC names chat actors. The
   account/copilot-adjacent flows do (`MainThreadLanguageModels`,
   `MainThreadChatSkills`), and `MainThreadWebviewManager` eagerly creates
   `MainThreadChatOutputRenderer`.

Recommended recovery order (cheapest first, each independently shippable):

1. **Extend `nullChatServices.ts`** with null singletons for the five open ids
   (`IChatOutputRendererService`, `IAgentPluginService`, `IPluginInstallService`,
   `IPromptsService`, `IChatMicrosoftSignInProbeService`) — same playbook
   pattern, kills #3 and #6–#9.
2. **Stub the mainThread actors** (#4, #5): re-import *minimal* glue or add
   guarded registration in `extensionHost.contribution.ts` so the RPC surface
   exists without chat.
3. Only if chat-adjacent features (MCP discovery, plugin installs) need real
   behavior in the twin: extract a `chat.services.contribution.ts` that
   registers the service bank without any UI — the cleanest long-term answer,
   turning `DSH-STRIP.md`'s "nulls for ids the twin still needs" escape hatch
   into a permanent services/UI split.

### What's the *real* mechanism that killed the markdown viewer

Added during debugging of the md preview outage: the breakage was not DI
noise at all but a one-line assertion. `mainThreadExtensionService.ts`
(unchanged by the strip) hands the ext-host manager the complete
`MainContext.*` enum as `mainProxyIdentifiers`, and
`extensionHostManager#_createExtensionHostCustomers` asserts — **outside**
the per-customer try/catch, after all customers instantiate — that every
one of them was registered:

```ts
this._rpcProtocol.assertRegistered(mainProxyIdentifiers);
```

A single missing named customer throws, the ext-host proxy rejects, and
from then on `ExtensionHostManager#activate` / `activateByEvent` resolve to
`null` for every request: **all extension activation on that host silently
stops** (`onLanguage:markdown`, `onCommand`, `onView…`, everything).
Verified by bisect: `0ae75644` activates `vscode.markdown-language-features`
and renders previews; `cc19a372` dispatches nothing at all for language
activation (remote ext-host logs show zero `_doActivateExtension` lines),
while showing the same set of console errors the nulls eventually cleaned
up — the two layers were independent symptoms of the same missing set.

That recasts the mainThread batch: those imports were never optional
glue — they are the *satisfiers* of a workbench-side invariant that every
`MainContext.*` constant maps to a registered actor. The right strip-safe
recovery is therefore: **re-import all removed mainThread chat actors and
null the services their constructors inject** in `nullChatServices.ts`
(`customizationHarnessService`, `chatDebugService`, `codeMapperService`,
`agentSessions`, `chatTodoListService`, `chatArtifactsService`,
`chatSessionsService` plus the earlier sweep). The actors exist as RPC
ends, the ext-host assertion passes, and calls through them no-op into
nulls. Shipped in the follow-up commit; md preview, markdown-math and the
toggle-terminal all verified green headless.

## Non-issues, verified separate

- The stale REH-web dist after `a829b10b` (dist Oct 13 vs commit Oct 14) —
  red herring; rebuilds now flow from the bootstrap script's cache.
- dsh-glass transparency series (`ca301b60` … `c611e7ee`) — visual only, not
  part of terminal/DI breakage. The terminal failure reproduced identically
  pre- and post-glass until `d87a5b5e`.
- Dev-environment native modules absent (spdlog/node-pty/watchdog) — expected
  from `08be9bc2`, not a regression.
