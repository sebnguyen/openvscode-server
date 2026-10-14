/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// DSH strip: the twin ships without chat UI — the chat/inlineChat contribution
// imports are removed from workbench.*.main.ts. Kept workbench features still
// DI-inject chat services though: IChatService / IChatWidgetService (tasks,
// quick symbol access, terminal decorations), IChatContextPickService
// (terminal decorations, scm/markers/search chat context, mcp, debug),
// IChatAgentService (tasks, quick access, editor + cell hints, notebook
// diagnostics), IChatCodeBlockContextProviderService (accessible view),
// IChatSpeechToTextService (editor dictation) and ILanguageModelToolsService
// (mcp, extensions). No-op implementations keep the service container wired.
// The sessions lanes (src/vs/sessions/*.main.ts) register the real services;
// this module is only reachable from the stripped twin lanes.

import { Event } from '../../../../base/common/event.js';
import { Disposable, IDisposable } from '../../../../base/common/lifecycle.js';
import { constObservable } from '../../../../base/common/observable.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IChatAgentService } from '../common/participants/chatAgents.js';
import { IChatService } from '../common/chatService/chatService.js';
import { IToolData, IToolSet, ILanguageModelToolsService, ToolDataSource, ToolSet, ToolAndToolSetEnablementMap } from '../common/tools/languageModelToolsService.js';
import { IChatContextPickService } from './attachments/chatContextPickService.js';
import { IChatCodeBlockContextProviderService, IChatWidgetService } from './chat.js';
import { ChatDictationSurface, ChatSpeechToTextState, IChatSpeechToTextService } from './speechToText/chatSpeechToTextService.js';

function notSupported(): never {
	throw new Error('Chat is not available in this build');
}

class NullChatService implements IChatService {

	declare readonly _serviceBrand: undefined;

	transferredSessionResource = undefined;

	readonly onDidSubmitRequest = Event.None;
	readonly onDidAcceptRequest = Event.None;
	readonly onDidCreateModel = Event.None;
	readonly onDidPerformUserAction = Event.None;
	readonly onDidReceiveQuestionCarouselAnswer = Event.None;
	readonly onDidDisposeSession = Event.None;

	readonly chatModels = constObservable([]);
	readonly requestInProgressObs = constObservable(false);
	readonly editingSessions = [];

	isEnabled(): boolean { return false; }
	hasSessions(): boolean { return false; }

	startNewLocalSession(): never { return notSupported(); }
	getSession() { return undefined; }
	acquireExistingSession() { return undefined; }
	acquireOrLoadSession() { return Promise.resolve(undefined); }
	loadSessionFromData(): never { return notSupported(); }
	getChatModelReferenceDebugInfo() {
		return { totalModels: 0, totalReferences: 0, models: [] };
	}

	sendRequest(): Promise<never> { return Promise.reject(new Error('Chat is not available in this build')); }

	getSessionTitle() { return undefined; }
	setSessionTitle(): void { }

	appendProgress(): void { }
	resendRequest() { return Promise.resolve(); }
	adoptRequest() { return Promise.resolve(); }
	removeRequest() { return Promise.resolve(); }
	cancelCurrentRequestForSession() { return Promise.resolve(); }
	migrateRequests(): void { }
	setYieldRequested(): void { }
	removePendingRequest(): void { }
	setPendingRequests(): void { }
	syncPendingRequestsFromRemote(): void { }
	processPendingRequests(): void { }
	sendPendingRequestImmediately() { return Promise.resolve(); }
	addCompleteRequest(): void { }
	setChatSessionTitle(): void { }
	getLocalSessionHistory() { return Promise.resolve([]); }
	clearAllHistoryEntries() { return Promise.resolve(); }
	removeHistoryEntry() { return Promise.resolve(); }
	getChatStorageFolder(): never { return notSupported(); }
	logChatIndex(): void { }
	getLiveSessionItems() { return Promise.resolve([]); }
	getHistorySessionItems() { return Promise.resolve([]); }
	getMetadataForSession() { return Promise.resolve(undefined); }

	notifyUserAction(): void { }
	notifyQuestionCarouselAnswer(): void { }

	transferChatSession() { return Promise.resolve(); }

	activateDefaultAgent() { return Promise.resolve(); }

	getPendingRequestSessionTypes() { return []; }

	setSaveModelsEnabled(): void { }
	waitForModelDisposals() { return Promise.resolve(); }
}

class NullChatWidgetService implements IChatWidgetService {

	declare readonly _serviceBrand: undefined;

	readonly lastFocusedWidget = undefined;

	readonly onDidAddWidget = Event.None;
	readonly onDidRemoveWidget = Event.None;
	readonly onDidChangeWidgetVisibility = Event.None;
	readonly onDidBackgroundSession = Event.None;
	readonly onDidChangeFocusedWidget = Event.None;
	readonly onDidChangeFocusedSession = Event.None;

	reveal() { return Promise.resolve(false); }
	revealWidget() { return Promise.resolve(undefined); }

	getAllWidgets() { return []; }
	getWidgetByInputUri() { return undefined; }
	openSession() { return Promise.resolve(undefined); }
	getWidgetBySessionResource() { return undefined; }
	getWidgetsByLocations() { return []; }

	register() { return Disposable.None; }
}

class NullChatAgentService implements IChatAgentService {

	declare readonly _serviceBrand: undefined;

	readonly onDidChangeAgents = Event.None;
	readonly onWillInvokeAgent = Event.None;
	readonly hasToolsAgent = false;

	registerAgent() { return Disposable.None; }
	registerAgentImplementation() { return Disposable.None; }
	registerDynamicAgent() { return Disposable.None; }
	registerAgentCompletionProvider() { return Disposable.None; }
	getAgentCompletionItems() { return Promise.resolve([]); }
	registerChatParticipantDetectionProvider() { return Disposable.None; }
	detectAgentOrCommand() { return Promise.resolve(undefined); }
	hasChatParticipantDetectionProviders() { return false; }

	invokeAgent(): Promise<never> { return Promise.reject(new Error('Chat is not available in this build')); }
	setRequestTools(): void { }
	setYieldRequested(): void { }

	getFollowups() { return Promise.resolve([]); }
	getChatTitle() { return Promise.resolve(undefined); }
	getChatSummary() { return Promise.resolve(undefined); }

	getAgent() { return undefined; }
	getAgentByFullyQualifiedId() { return undefined; }
	getAgents() { return []; }
	getActivatedAgents() { return []; }
	getAgentsByName() { return []; }
	agentHasDupeName() { return false; }
	getDefaultAgent() { return undefined; }
	getContributedDefaultAgent() { return undefined; }
	updateAgent(): void { }
}

class NullChatContextPickService implements IChatContextPickService {

	declare readonly _serviceBrand: undefined;

	readonly items: Iterable<never> = [];

	registerChatContextItem() { return Disposable.None; }
}

class NullChatCodeBlockContextProviderService implements IChatCodeBlockContextProviderService {

	declare readonly _serviceBrand: undefined;

	readonly providers = [];

	registerProvider() { return Disposable.None; }
}

class NullChatSpeechToTextService implements IChatSpeechToTextService {

	declare readonly _serviceBrand: undefined;

	readonly onDidChangeState = Event.None;
	readonly state = ChatSpeechToTextState.Idle;
	readonly isBusy = false;
	readonly currentSurface: ChatDictationSurface = 'chat';
	readonly onDidUpdateTranscript = Event.None;

	readonly showTranscriptWhileDictating = false;

	readonly analyserNode = undefined;

	switchMicrophone() { return Promise.resolve(undefined); }

	readonly isConfigured = false;

	readonly onDidChangePreparingModel = Event.None;
	readonly isPreparingModel = false;

	readonly onDidChangeDownloadingModel = Event.None;
	readonly isDownloadingModel = false;

	readonly onDidChangeModelDownloadProgress = Event.None;

	readonly modelDownloadProgress = undefined;

	start() { return Promise.resolve(); }

	stopAndTranscribe() { return Promise.resolve(undefined); }

	cancel() { return Promise.resolve(); }

	readonly currentBackend = '';

	logDictationAccuracy(): void { }
}

class NullLanguageModelToolsService implements ILanguageModelToolsService {

	declare readonly _serviceBrand: undefined;

	private readonly _nullToolSet: ToolSet;

	readonly onDidChangeTools = Event.None;
	readonly onDidPrepareToolCallBecomeUnresponsive = Event.None;
	readonly onDidInvokeTool = Event.None;

	readonly toolSets = constObservable<Iterable<IToolSet>>([]);

	constructor(
		@IContextKeyService private readonly _contextKeyService: IContextKeyService,
	) {
		this._nullToolSet = this._createToolSet(ToolDataSource.Internal, 'null', 'null');
	}

	get vscodeToolSet() { return this._nullToolSet; }
	get executeToolSet() { return this._nullToolSet; }
	get readToolSet() { return this._nullToolSet; }
	get agentToolSet() { return this._nullToolSet; }

	registerToolData() { return Disposable.None; }
	registerToolImplementation() { return Disposable.None; }
	registerTool() { return Disposable.None; }
	getTools() { return []; }
	observeTools() { return constObservable<readonly IToolData[]>([]); }
	getAllToolsIncludingDisabled() { return []; }
	getTool() { return undefined; }
	getToolByName() { return undefined; }

	beginToolCall() { return undefined; }
	updateToolStream() { return Promise.resolve(); }
	invokeTool(): Promise<never> { return Promise.reject(new Error('Chat is not available in this build')); }
	cancelToolCallsForRequest(): void { }
	flushToolUpdates(): void { }

	getToolSetsForModel() { return []; }
	getToolSet() { return undefined; }
	getToolSetByName() { return undefined; }
	createToolSet(source: ToolDataSource, id: string, referenceName: string, options?: { icon?: ThemeIcon; description?: string; detail?: string; legacyFullNames?: string[]; deprecated?: boolean; hiddenInToolsPicker?: boolean }): ToolSet & IDisposable {
		return Object.assign(this._createToolSet(source, id, referenceName, options), { dispose: () => { } });
	}

	private _createToolSet(source: ToolDataSource, id: string, referenceName: string, options?: { icon?: ThemeIcon; description?: string; detail?: string; legacyFullNames?: string[]; deprecated?: boolean; hiddenInToolsPicker?: boolean }): ToolSet {
		return new ToolSet(id, referenceName, options?.icon ?? ThemeIcon.fromId('tools'), source, options?.description, options?.detail, options?.legacyFullNames, options?.deprecated, options?.hiddenInToolsPicker, this._contextKeyService);
	}

	getFullReferenceNames() { return []; }
	getFullReferenceName(tool: IToolData | IToolSet) { return tool instanceof ToolSet ? tool.referenceName : (tool as IToolData).toolReferenceName ?? tool.id; }
	getFullReferenceNameMap() { return new Map(); }
	getToolByFullReferenceName() { return undefined; }
	getDeprecatedFullReferenceNames() { return new Map(); }
	toToolAndToolSetEnablementMap() { return ToolAndToolSetEnablementMap.fromEntries([]); }
	toFullReferenceNames() { return []; }
	toToolReferences() { return []; }
}

registerSingleton(IChatAgentService, NullChatAgentService, InstantiationType.Delayed);
registerSingleton(IChatContextPickService, NullChatContextPickService, InstantiationType.Delayed);
registerSingleton(IChatCodeBlockContextProviderService, NullChatCodeBlockContextProviderService, InstantiationType.Delayed);
registerSingleton(IChatSpeechToTextService, NullChatSpeechToTextService, InstantiationType.Delayed);
registerSingleton(ILanguageModelToolsService, NullLanguageModelToolsService, InstantiationType.Delayed);

registerSingleton(IChatService, NullChatService, InstantiationType.Delayed);
registerSingleton(IChatWidgetService, NullChatWidgetService, InstantiationType.Delayed);
