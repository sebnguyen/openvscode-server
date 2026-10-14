# DSH Strip Playbook — Removing Subsystems from the Twin

How to strip an vscode subsystem (the chat/UI-strip used for Copilot chat is
the reference implementation) without leaving DI craters behind. Written for
future agents doing the same thing to another subsystem.

## Mental model

The workbench has **no plugin loader for core features**. Everything is one
static TypeScript import tree, and a feature exists in a build lane if and
only if some file reachable from that lane's entry imports it:

- **Entry mains assemble lanes by listing imports.**
  `src/vs/workbench/workbench.common.main.ts` is a file whose only job is a
  long list of `import './contrib/...'`. Import order matters little;
  presence is everything.
- **Imports are side effects.** Importing `chat.contribution.js` runs its
  top-level code, which registers the views, commands, actions, menus, and DI
  singletons (`registerSingleton`) that make chat exist. Delete the import and
  none of that code ever runs — or bundles.
- **The dist is one giant blob per lane.** esbuild walks the import graph
  from each entry (`vs/workbench/workbench.web.main.internal` for the
  REH-web twin, exactly one entry, no code splitting — see
  `build/next/index.ts`). Removing an import removes the whole unreachable
  subtree from the bundle. The blob is assembled *from* the source graph, so
  the source graph is the strip point.
- **Source files stay on disk.** Other lanes still reference them. Strip =
  change who references what, never delete the subsystem's sources.

## The lanes (know which one you edit)

| Lane | Main files | Used by |
|---|---|---|
| Twin (stripped) | `src/vs/workbench/workbench.{common,web,desktop}.main.ts` | the REH-web twin + desktop twin |
| Sessions (full) | `src/vs/sessions/sessions.*.main.ts` | the sessions window — **do not touch** |

`sessions.common.main.ts` is a *separate* main that re-imports the full
feature set (including `chat.shared.contribution.js`); nulls and twin edits
never reach it. Verify with `grep "workbench.common.main" src/vs/sessions/`
— sessions lanes do **not** import the workbench common main.

Shared list files are another trap: `src/vs/workbench/contrib/terminal/terminal.all.ts`
is imported by **both** lanes. When a shared list must differ, fork it
(`terminal.all.twin.ts` in the Chat strip) and point only the twin main at
the fork.

## Frontend strip recipe

1. **Map the subsystem's registration surface.** Its contribution files
  (`*.contribution.ts`) are where UI parts register; `registerSingleton(IFoo, ...)`
  calls are where its services register. In the chat strip every chat service
  lived in `chat.shared.contribution.ts` / `chatSessions.contribution.ts` —
  deleting the line unregisters the services too.
2. **Delete the side-effect imports** from the twin mains
  (`workbench.common.main.ts`, `workbench.desktop.main.ts`, …). Also check
  `src/vs/workbench/api/browser/extensionHost.contribution.ts` for the
  subsystem's `mainThread*` glue files (chat had ~14).
3. **Audit DI consumers left behind** — this is where strips die. Every kept
   file may inject the removed services:

   ```sh
   grep -rn "@IChatAgentService\|@IChatContextPickService\|..." src/vs \
     --include=*.ts | grep -v contrib/chat | grep -v sessions | grep -v test
   ```

   Constructor injection is resolved **lazily at instantiation**: the workbench
   boots fine and the feature dies on first use. The terminal broke exactly
   like this — `DecorationAddon` (built per terminal, `xtermTerminal.ts`)
   injected `IChatContextPickService`, which no longer existed anywhere.
4. **Install null services for ids the twin still needs.** One file,
   `src/vs/workbench/contrib/chat/browser/nullChatServices.ts`, is the
   exemplar:

   - one `Null*` class per id, `implements` the real interface (the compiler
     becomes your completeness check),
    - constants as `Event.None` for events, `[]`/`undefined`/`false` for
      state, `Disposable.None` for register methods,
   - `Promise.resolve(undefined)` for queries, and **reject** (don't `throw`)
     for operations that must produce a value (`invokeAgent`, `sendRequest`),
     so a forgotten caller dies loudly instead of corrupting state,
   - `registerSingleton(IFoo, NullFoo, InstantiationType.Delayed)` — delayed,
     so nothing pays for the null until something injects it,
   - constructor DI is allowed on nulls too (see `NullLanguageModelToolsService`
     injecting `IContextKeyService` to build a real inert `ToolSet`).

   Current null coverage (chat strip): `IChatService`, `IChatWidgetService`,
   `IChatAgentService`, `IChatContextPickService`,
   `IChatCodeBlockContextProviderService`, `IChatSpeechToTextService`,
   `ILanguageModelToolsService`. Extend the same file if you strip further and
   new ids surface in step 3's grep.
5. **Mirror eslint's import-pattern config.** `eslint.config.js` has an
   explicit `code-import-patterns` entry per main/lane file
   (see the `terminal.all.ts` / `workbench.common.main.ts` blocks). A new lane
   file errors with *"Missing definition in code-import-patterns"* and a main
   importing an unlisted path errors as a restriction violation — add twin
   entries, don't loosen the general patterns.
6. **Verify the gates the repo gives you:**

   ```sh
   npm run compile-client          # gulp compile — full type check, 0 errors required
   npx eslint --max-warnings 0 <touched files>
   ```

   A clean compile does **not** prove the runtime works — DI registration
   gaps are invisible to tsc. Symptoms are per-feature lazy throwers
   (`unknown service IFoo` in the workbench console). Boot the twin and
   exercise the neighbors of the removed subsystem (terminal, quick access,
   tasks, MCP, dictation) before calling it done.

## Backend (REH server) strip recipe

The remote server is assembled differently: no import-list mains, services
are wired **explicitly** in `src/vs/server/node/serverServices.ts` by
hand-filling a `ServiceCollection` with `SyncDescriptor`s, and feature
channels are registered on the IPC server in the same file (e.g.
`RemoteTerminalChannel` for terminal, `RemoteAgentEnvironmentChannel`). To
strip a backend feature, remove its channel/service registration lines there
— downstream clients then need to tolerate the absence, so grep the frontend
consumers first, same as step 3.

`src/vs/server/node/webClientServer.ts` serves the twin's blob; leave it
alone unless the strip changes what the client needs served.

## Extensions strip

Extensions are the *other* half of the dist (not in the blob):

- **Bundled locally** from every folder in `extensions/` by
  `build/lib/extensions.ts` (`packageAllLocalExtensionsStream`, per
  `build/gulpfile.vscode.web.ts` → `.build/web/extensions`). Note
  `extensions/copilot/` — a chat strip that only edits workbench mains still
  ships it.
- **`product.json`** lists marketplace-fetched extensions in
  `builtInExtensions` (currently 3 js-debug entries) and
  `builtInExtensionsEnabledWithAutoUpdates`.

Stripping an extension = delete its `extensions/<name>/` folder (or exclude
it in `build/lib/extensions.ts`) and remove its `product.json` entries.
Extension-side service registrations die with the extension; audit frontend
callers of its contributed commands/settings the same way as step 3.

## Pitfalls encountered (check your work against these)

- **Null-service completeness**: the first chat strip nulled 2 services and
  the terminal still died on `IChatContextPickService`. Always run the grep
  in recipe step 3 over src minus the stripped subtree.
- **Shared contribution lists**: editing `terminal.all.ts` would have killed
  the sessions lane's terminal. Fork as `*.twin.ts`.
- **Sessions lane is self-contained**: 299 imports in
  `sessions.common.main.ts`, registering its own real services. Never
  "share" twin edits into it.
- **`IChatEntitlementService` survived** because
  `workbench.common.main.ts` also imports `services/chat/common/chatEntitlementService.js`
  directly (line ~142) — check *all* registration sites before concluding an
  id is gone.
- **eslint is a second compiler here**: `local/code-import-patterns`,
  `local/code-no-in-operator` (`instanceof` or a cast instead), plus the
  hygiene file header on new `.ts` files. Run it on every touched file.
