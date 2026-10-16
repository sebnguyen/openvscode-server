/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------------------------------------------
 *  DO Harness patch — the checkpoint timeline bar.
 *
 *  A slim bar mounted at the top of each editor group whenever the active
 *  editor names a file with checkpoint stops. The bar itself renders no
 *  checkpoint state: it asks the bridge extension through commands.
 *
 *    data:  `do-harness.timeline.describe(path)` → stop model for the file
 *    click: `do-harness.timeline.prev/next/openStop` ({ path } args)
 *    ping:  the extension fires `do-harness.timeline.barRefresh` when the
 *           playhead or slots change; this contribution re-reads then.
 *
 *  Whole-fork modification inventory (keep small on purpose): this file plus
 *  one import in workbench.common.main.ts. No edits inside vscode.core.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import {
  Extensions as WorkbenchExtensions,
  IWorkbenchContributionsRegistry,
  IWorkbenchContribution,
} from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import {
  IEditorGroupsService,
  IEditorGroup,
} from '../../../services/editor/common/editorGroupsService.js';
import { FileEditorInput } from '../../files/browser/editors/fileEditorInput.js';
import { URI } from '../../../../base/common/uri.js';

const DESCRIBE_COMMAND = 'do-harness.timeline.describe';
const PREV_COMMAND = 'do-harness.timeline.prev';
const NEXT_COMMAND = 'do-harness.timeline.next';
const OPEN_COMMAND = 'do-harness.timeline.openStop';
const REFRESH_COMMAND = 'do-harness.timeline.barRefresh';

interface TimelineBarModel {
  readonly ok: true;
  readonly path: string;
  readonly index: number;
  readonly total: number;
  readonly tool: string;
  readonly turn: string;
}

interface TimelineBarVoid {
  readonly ok: false;
}

type TimelineBarResult = TimelineBarModel | TimelineBarVoid;

const BAR_CSS = `
.dsh-checkpoints-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 11px;
  line-height: 18px;
  color: var(--vscode-editorWidget-foreground, #cccccc);
  background: var(--vscode-editorWidget-background, #1f2327);
  border-bottom: 1px solid var(--vscode-contrastBorder, var(--vscode-panel-border, #3c3f41));
  user-select: none;
}
.dsh-checkpoints-bar[hidden] { display: none; }
.dsh-checkpoints-bar .dsh-action {
  display: inline-flex;
  align-items: center;
  border: 0;
  padding: 0 6px;
  height: 18px;
  border-radius: 3px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font: inherit;
}
.dsh-checkpoints-bar .dsh-action:hover { background: var(--vscode-toolbar-hoverBackground, rgba(90,93,94,.31)); }
.dsh-checkpoints-bar .dsh-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: center;
  opacity: .95;
}
`;

class DshCheckpointBarContribution extends Disposable implements IWorkbenchContribution {
  static readonly ID = 'workbench.contrib.dshCheckpointBar';

  private readonly bars = new Map<string, { readonly root: HTMLElement; readonly label: HTMLElement }>();
  private refreshing = false;

  constructor(
    @IEditorGroupsService private readonly editorGroupsService: IEditorGroupsService,
    @ICommandService private readonly commandService: ICommandService,
    @IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
  ) {
    super();
    const style = document.createElement('style');
    style.textContent = BAR_CSS;
    document.head.appendChild(style);
    this._register({ dispose: () => style.remove() });

    this._register(CommandsRegistry.registerCommand(REFRESH_COMMAND, async () => { await this.refreshAll(); }));
    for (const group of this.editorGroupsService.groups) {
      this.trackGroup(group);
    }
    this._register(this.editorGroupsService.onDidAddGroup(group => { this.trackGroup(group); }));
    this._register(this.editorGroupsService.onDidChangeActiveGroup(() => { void this.refreshAll(); }));
  }

  private trackGroup(group: IEditorGroup): void {
    const key = String(group.id);
    if (this.bars.has(key)) return;
    const root = document.createElement('div');
    root.className = 'dsh-checkpoints-bar';
    root.hidden = true;
    const label = document.createElement('span');
    label.className = 'dsh-label';
    label.textContent = '';
    const container = (group as unknown as { element?: HTMLElement }).element;
    if (container === undefined) return;

    const prev = this.makeButton('◀', 'Previous checkpoint stop', PREV_COMMAND);
    const next = this.makeButton('▶', 'Next checkpoint stop', NEXT_COMMAND);
    label.addEventListener('click', () => {
      const path = this.relativePath(group);
      void this.commandService.executeCommand(OPEN_COMMAND, { path });
    });
    label.style.cursor = 'pointer';
    label.style.padding = '0 6px';
    label.style.borderRadius = '3px';

    root.appendChild(prev);
    root.appendChild(label);
    root.appendChild(next);

    container.insertBefore(root, container.firstChild);
    this.bars.set(key, { root, label });
    this._register(group.onDidActiveEditorChange(() => { void this.refreshGroup(group); }));
    void this.refreshGroup(group);
  }

  private makeButton(text: string, title: string, command: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'dsh-action';
    button.textContent = text;
    button.title = title;
    button.addEventListener('click', event => {
      void this.commandService.executeCommand(command, { path: (event.currentTarget as HTMLButtonElement).dataset['path'] });
    });
    return button;
  }

  private async refreshAll(): Promise<void> {
    for (const group of this.editorGroupsService.groups) {
      await this.refreshGroup(group);
    }
  }

  private relativePath(group: IEditorGroup): string | undefined {
    const editor = group.activeEditor;
    if (!(editor instanceof FileEditorInput)) return undefined;
    const resource: URI = editor.resource;
    const folders = this.workspaceContextService.getWorkspace().folders;
    const root = folders.length === 0 ? undefined : folders[0].uri;
    if (root === undefined || resource.scheme !== root.scheme) return undefined;
    const prefix = `${root.path}/`;
    if (!resource.path.startsWith(prefix)) return undefined;
    return resource.path.slice(prefix.length);
  }

  private async refreshGroup(group: IEditorGroup): Promise<void> {
    const bar = this.bars.get(String(group.id));
    if (bar === undefined || this.refreshing) return;
    const path = this.relativePath(group);
    if (path === undefined) {
      bar.root.hidden = true;
      return;
    }
    this.refreshing = true;
    try {
      const model = await this.commandService.executeCommand<TimelineBarResult | undefined>(DESCRIBE_COMMAND, path);
      if (model === undefined || model.ok !== true) {
        bar.root.hidden = true;
        return;
      }
      bar.label.textContent = `stop ${model.index + 1}/${model.total} · ${model.tool} · turn ${model.turn}`;
      bar.root.hidden = false;
      for (const button of Array.from(bar.root.querySelectorAll('button'))) {
        (button as HTMLButtonElement).dataset['path'] = path;
      }
    } catch {
      bar.root.hidden = true;
    } finally {
      this.refreshing = false;
    }
  }
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(
  DshCheckpointBarContribution,
  LifecyclePhase.Restored,
);
