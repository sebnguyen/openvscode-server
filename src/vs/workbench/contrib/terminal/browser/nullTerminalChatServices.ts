/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// DSH strip: the twin lane drops `terminal.chat.contribution.js` (see
// `terminal.all.twin.ts`), which owns the only registrations of
// ITerminalChatService and ITerminalChatSessionResolver. Kept terminal code
// still DI-injects them — `TerminalTabbedView` (built per terminal view) and
// `TerminalTabsChatEntry` both take `ITerminalChatService`, and the chat
// session resolver feeds the inline-chat surface. Without these nulls the
// terminal view pane's `renderBody` throws and the whole terminal view never
// populates. The sessions lanes get the real `terminal.chat.contribution.js`
// registrations via the full `terminal.all.js`; this module is only imported
// from the twin lane (`terminal.all.twin.ts`).

import { Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { ITerminalChatService } from './terminal.js';
import type { IAhpTerminalCommandSource, IChatTerminalOutputSource, IChatTerminalToolProgressPart, ITerminalInstance } from './terminal.js';
import type { ToolConfirmationAction } from '../../chat/common/tools/languageModelToolsService.js';
import { ITerminalChatSessionResolver } from '../terminalContribChatExports.js';
import type { ITerminalChatSessionResolution } from '../terminalContribChatExports.js';
import { URI } from '../../../../base/common/uri.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { OperatingSystem } from '../../../../base/common/platform.js';

class NullTerminalChatService implements ITerminalChatService {

	declare readonly _serviceBrand: undefined;

	readonly onDidRegisterTerminalInstanceWithToolSession = Event.None;

	registerTerminalInstanceWithToolSession(_terminalToolSessionId: string | undefined, _instance: ITerminalInstance): void { }
	getTerminalInstanceByToolSessionId(_terminalToolSessionId: string): Promise<ITerminalInstance | undefined> { return Promise.resolve(undefined); }

	registerTerminalInstanceWithExecutionId(_terminalExecutionId: string, _instance: ITerminalInstance) { return Disposable.None; }
	getTerminalInstanceByExecutionId(_terminalExecutionId: string): ITerminalInstance | undefined { return undefined; }

	getToolSessionTerminalInstances(_hiddenOnly?: boolean): readonly ITerminalInstance[] { return []; }
	getToolSessionIdForInstance(_instance: ITerminalInstance): string | undefined { return undefined; }

	registerTerminalInstanceWithChatSession(_chatSessionResource: URI, _instance: ITerminalInstance): void { }
	getChatSessionResourceForInstance(_instance: ITerminalInstance): URI | undefined { return undefined; }

	isBackgroundTerminal(_terminalToolSessionId?: string): boolean { return false; }

	registerOutputSource(_terminalToolSessionId: string, _source: IChatTerminalOutputSource) { return Disposable.None; }
	getOutputSource(_terminalToolSessionId: string | undefined): IChatTerminalOutputSource | undefined { return undefined; }

	registerProgressPart(_part: IChatTerminalToolProgressPart) { return Disposable.None; }
	setFocusedProgressPart(_part: IChatTerminalToolProgressPart): void { }
	clearFocusedProgressPart(_part: IChatTerminalToolProgressPart): void { }
	getFocusedProgressPart(): IChatTerminalToolProgressPart | undefined { return undefined; }
	getMostRecentProgressPart(): IChatTerminalToolProgressPart | undefined { return undefined; }

	setChatSessionAutoApproval(_chatSessionResource: URI, _enabled: boolean): void { }
	hasChatSessionAutoApproval(_chatSessionResource: URI): boolean { return false; }

	addSessionAutoApproveRule(_chatSessionResource: URI, _key: string, _value: boolean | { approve: boolean; matchCommandLine?: boolean }): void { }
	getSessionAutoApproveRules(_chatSessionResource: URI): Readonly<Record<string, boolean | { approve: boolean; matchCommandLine?: boolean }>> { return {}; }

	getAutoApproveActions(_commandLine: string, _language: 'shellscript' | 'powershell'): Promise<ToolConfirmationAction[] | undefined> { return Promise.resolve(undefined); }

	continueInBackground(_terminalToolSessionId: string): void { }
	readonly onDidContinueInBackground = Event.None;

	registerAhpCommandSource(_terminalToolSessionId: string, _source: IAhpTerminalCommandSource, _promisedTerminal: Promise<ITerminalInstance>) { return Disposable.None; }
	getAhpCommandSource(_terminalToolSessionId: string): IAhpTerminalCommandSource | undefined { return undefined; }
}

class NullTerminalChatSessionResolver implements ITerminalChatSessionResolver {

	declare readonly _serviceBrand: undefined;

	resolve(_token: CancellationToken, _shellType: string | undefined, _os: OperatingSystem): Promise<ITerminalChatSessionResolution | undefined> { return Promise.resolve(undefined); }
}

registerSingleton(ITerminalChatService, NullTerminalChatService, InstantiationType.Delayed);
registerSingleton(ITerminalChatSessionResolver, NullTerminalChatSessionResolver, InstantiationType.Delayed);
