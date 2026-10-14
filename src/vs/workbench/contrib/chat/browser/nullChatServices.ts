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
import { IChatOutputRendererService } from './chatOutputItemRenderer.js';
import { IAgentPluginService } from '../common/plugins/agentPluginService.js';
import { IPluginInstallService } from '../common/plugins/pluginInstallService.js';
import { IPromptsService } from '../common/promptSyntax/service/promptsService.js';
import { IChatMicrosoftSignInProbeService } from './chatSetup/chatSetupMicrosoftProbe.js';
import { IInlineChatSessionService } from '../../inlineChat/browser/inlineChatSessionService.js';
import { IChatEditingService } from '../common/editing/chatEditingService.js';
import { ILanguageModelsService } from '../common/languageModels.js';
import { ILanguageModelIgnoredFilesService } from '../common/ignoredFiles.js';
import { IAgentHostImportConversationStore } from './agentSessions/agentHost/agentHostImportConversationStore.js';
import { ContributionEnablementState, IEnablementModel } from '../common/enablement.js';
import { IChatDebugService } from '../common/chatDebugService.js';
import { CodeMapperService, ICodeMapperService } from '../common/editing/chatCodeMapperService.js';
import { ICustomizationHarnessService } from '../common/customizationHarnessService.js';
import { IChatSessionsService, SessionType } from '../common/chatSessionsService.js';
import { IAgentSessionsService } from './agentSessions/agentSessionsService.js';
import { IAgentSessionsModel } from './agentSessions/agentSessionsModel.js';
import { IChatTodoListService } from '../common/tools/chatTodoListService.js';
import { IChatArtifactsService, IChatArtifacts } from '../common/tools/chatArtifactsService.js';
import { Target } from '../common/promptSyntax/promptTypes.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { URI } from '../../../../base/common/uri.js';

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

// ---------------------------------------------------------------------------
// Sweep 2: every remaining id that lived only in chat.shared.contribution.ts
// (or in the dropped mainThread glue) and still has kept consumers in the
// twin lane — each error below was observed live in the stripped build.

class NullChatOutputRendererService implements IChatOutputRendererService {

	declare readonly _serviceBrand: undefined;

	registerRenderer() { return Disposable.None; }
	hasCodeBlockRenderer() { return false; }
	renderOutputPart(): Promise<never> { return Promise.reject(notSupported()); }
	renderCodeBlock(): Promise<never> { return Promise.reject(notSupported()); }
}

const nullEnablementModel: IEnablementModel = {
	readEnabled: () => ContributionEnablementState.EnabledWorkspace,
	readProfileEnabled: () => true,
	setEnabled: () => { },
	remove: () => { },
};

class NullAgentPluginService implements IAgentPluginService {

	declare readonly _serviceBrand: undefined;

	readonly plugins = constObservable([]);
	readonly enablementModel = nullEnablementModel;
}

class NullPluginInstallService implements IPluginInstallService {

	declare readonly _serviceBrand: undefined;

	installPlugin() { return Promise.resolve(); }
	installPluginFromSource() { return Promise.resolve({ success: false, message: 'Plugin installation is not available in this build' }); }
	validatePluginSource() { return undefined; }
	ensureMarketplaceTrusted() { return Promise.resolve(true); }
	uninstallPlugin() { return Promise.resolve(false); }
	updateAllPlugins() { return Promise.resolve({ updatedNames: [], failedNames: [] }); }
	updatePlugin() { return Promise.resolve(false); }
	getPluginInstallUri() { return notSupported(); }
}

class NullPromptsService implements IPromptsService {

	declare readonly _serviceBrand: undefined;

	dispose() { }

	readonly onDidChangeSlashCommands = Event.None;
	readonly onDidChangeCustomAgents = Event.None;
	readonly onDidChangeInstructions = Event.None;
	readonly onDidChangeAgentInstructions = Event.None;
	readonly onDidChangeSkills = Event.None;
	readonly onDidChangeHooks = Event.None;

	getParsedPromptFile(): never { return notSupported(); }
	getPromptSlashCommands() { return Promise.resolve([]); }
	getPromptSlashCommandName(): Promise<string> { return Promise.reject(notSupported()); }
	getCustomAgents() { return Promise.resolve([]); }
	parseNew() { return Promise.reject(notSupported()); }
	registerContributedFile() { return Disposable.None; }
	getPromptLocationLabel() { return ''; }
	listNestedAgentMDs() { return Promise.resolve([]); }
	listAgentInstructions() { return Promise.resolve([]); }
	getVoiceInstructions() { return Promise.resolve(undefined); }
	getDictationInstructions() { return Promise.resolve(undefined); }
	getAgentFileURIFromModeFile() { return undefined; }
	getDisabledPromptFiles() { return notSupported(); }
	setDisabledPromptFiles() { return Promise.resolve(); }
	listPromptFiles() { return Promise.resolve([]); }
	listPromptFilesForStorage() { return Promise.resolve([]); }
	getSourceFolders() { return Promise.resolve([]); }
	getResolvedSourceFolders() { return Promise.resolve([]); }
	isValidSlashCommandName() { return false; }
	hasPromptSlashCommand() { return false; }
	resolvePromptSlashCommand() { return Promise.resolve(undefined); }
	registerPromptFileProvider() { return Disposable.None; }
	findAgentSkills() { return Promise.resolve(undefined); }
	getHooks() { return Promise.resolve(undefined); }
	getInstructionFiles() { return Promise.resolve([]); }
	getDiscoveryInfo() { return notSupported(); }
}

class NullChatMicrosoftSignInProbeService implements IChatMicrosoftSignInProbeService {

	declare readonly _serviceBrand: undefined;

	readonly offerMicrosoftSignIn = constObservable(false);
	notifySignInShown(): void { }
}

class NullInlineChatSessionService implements IInlineChatSessionService {

	declare readonly _serviceBrand: undefined;

	readonly onWillStartSession = Event.None;
	readonly onDidChangeSessions = Event.None;

	createSession(): Promise<never> { return Promise.reject(notSupported()); }
	getSessionByTextModel() { return undefined; }
	getSessionBySessionUri() { return undefined; }
}

class NullChatEditingService implements IChatEditingService {

	declare readonly _serviceBrand: undefined;

	readonly editingSessionsObs = constObservable([]);

	startOrContinueGlobalEditingSession(): never { return notSupported(); }
	getEditingSession() { return undefined; }
	createEditingSession(): never { return notSupported(); }
	registerEditReviewSession() { return Disposable.None; }
	transferEditingSession(): never { return notSupported(); }
	registerEditingSessionProvider() { return Disposable.None; }
}

class NullLanguageModelsService implements ILanguageModelsService {

	declare readonly _serviceBrand: undefined;

	readonly onDidChangeLanguageModelVendors = Event.None;
	readonly onDidChangeLanguageModels = Event.None;
	readonly onDidChangeModelVisibility = Event.None;
	readonly onDidChangeModelsControlManifest = Event.None;
	readonly restrictedChatParticipants = constObservable({});

	getLanguageModelIds() { return []; }
	getVendors() { return []; }
	lookupLanguageModel() { return undefined; }
	lookupLanguageModelByQualifiedName() { return undefined; }
	getLanguageModelGroups() { return []; }
	hasResolvedVendor() { return true; }
	selectLanguageModels() { return Promise.resolve([]); }
	registerLanguageModelProvider() { return Disposable.None; }
	deltaLanguageModelChatProviderDescriptors(): void { }
	sendChatRequest(): Promise<never> { return Promise.reject(notSupported()); }
	computeTokenLength() { return Promise.resolve(0); }
	getModelConfiguration() { return undefined; }
	setModelConfiguration() { return Promise.resolve(); }
	getModelConfigurationActions() { return []; }
	addLanguageModelsProviderGroup() { return Promise.resolve(); }
	removeLanguageModelsProviderGroup() { return Promise.resolve(); }
	configureLanguageModelsProviderGroup() { return Promise.resolve(); }
	renameLanguageModelsProviderGroup() { return Promise.resolve(); }
	updateLanguageModelsProviderGroupApiKey() { return Promise.resolve(); }
	addLanguageModelsProviderGroupModel() { return Promise.resolve(); }
	openLanguageModelsProviderGroupSettings() { return Promise.resolve(); }
	configureModel() { return Promise.resolve(); }
	migrateLanguageModelsProviderGroup() { return Promise.resolve(); }
	getRecentlyUsedModelIds() { return []; }
	addToRecentlyUsedList(): void { }
	clearRecentlyUsedList(): void { }
	getPinnedModelIds() { return []; }
	pinModel(): void { }
	unpinModel(): void { }
	isModelPinned() { return false; }
	readonly onDidChangePinnedModels = Event.None;
	isModelHidden() { return false; }
	isGroupHidden() { return false; }
	setModelHidden(): void { }
	setModelsHidden(): void { }
	setGroupHidden(): void { }
	getHiddenModelIds() { return []; }
	getModelsControlManifest() { return { free: {}, paid: {} }; }
}

class NullLanguageModelIgnoredFilesService implements ILanguageModelIgnoredFilesService {

	declare readonly _serviceBrand: undefined;

	fileIsIgnored() { return Promise.resolve(false); }
	registerIgnoredFileProvider() { return Disposable.None; }
}

class NullAgentHostImportConversationStore implements IAgentHostImportConversationStore {

	declare readonly _serviceBrand: undefined;

	set(): void { }
	take() { return undefined; }
	rename(): void { }
}

class NullChatDebugService extends Disposable implements IChatDebugService {
	declare readonly _serviceBrand: undefined;
	readonly onDidAddEvent = Event.None;
	readonly onDidClearProviderEvents = Event.None;
	readonly onDidEndSession = Event.None;
	readonly onDidChangeAvailableSessionResources = Event.None;
	log(): void { }
	addEvent(): void { }
	addProviderEvent(): void { }
	getEvents() { return []; }
	getSessionResources() { return []; }
	activeSessionResource = undefined;
	clear(): void { }
	registerProvider() { return Disposable.None; }
	hasInvokedProviders() { return false; }
	async invokeProviders(): Promise<void> { }
	endSession(): void { }
	async resolveEvent() { return undefined; }
	async exportLog() { return undefined; }
	async importLog() { return undefined; }
	isCoreEvent() { return true; }
	setImportedSessionTitle(): void { }
	getImportedSessionTitle() { return undefined; }
	addAvailableSessionResources(): void { }
	getAvailableSessionResources() { return []; }
	registerAvailableSessionsFetcher() { return Disposable.None; }
	getHistoricalSessionTitle() { return undefined; }
}

const NULL_HARNESS_DESCRIPTOR = { id: '', label: '', icon: Codicon.sparkle };

class NullCustomizationHarnessService implements ICustomizationHarnessService {
	declare readonly _serviceBrand: undefined;
	readonly activeSessionResource = constObservable(URI.from({ scheme: SessionType.Local, path: '/untitled-1' }));
	readonly activeHarness = constObservable(SessionType.Local);
	readonly availableHarnesses = constObservable([]);
	findHarnessById() { return undefined; }
	setActiveSession(): void { }
	getActiveDescriptor() { return NULL_HARNESS_DESCRIPTOR; }
	registerExternalHarness(): IDisposable { return Disposable.None; }
	readonly onDidChangeSlashCommands = Event.None;
	readonly onDidChangeCustomAgents = Event.None;
	async getSlashCommands() { return []; }
	async getCustomAgents() { return []; }
	async resolvePromptSlashCommand() { return undefined; }
	getSessionResourceForHarness(_sessionType: string) { return this.activeSessionResource.get(); }
}

const NULL_AGENT_SESSIONS_MODEL: IAgentSessionsModel = {
	onWillResolve: Event.None,
	onDidResolve: Event.None,
	onDidChangeSessions: Event.None,
	onDidChangeSessionArchivedState: Event.None,
	resolved: true,
	sessions: [],
	getSession: () => undefined,
	observeSession: () => constObservable(undefined),
	resolve: () => Promise.resolve(),
};

class NullAgentSessionsService implements IAgentSessionsService {
	declare readonly _serviceBrand: undefined;
	readonly model = NULL_AGENT_SESSIONS_MODEL;
	readonly onDidChangeSessionArchivedState = Event.None;
	getSession() { return undefined; }
}

class NullChatTodoListService implements IChatTodoListService {
	declare readonly _serviceBrand: undefined;
	readonly onDidUpdateTodos = Event.None;
	getTodos() { return []; }
	setTodos(): void { }
	migrateTodos(): void { }
}

const NULL_CHAT_ARTIFACTS: IChatArtifacts = {
	artifactGroups: constObservable([]),
	setAgentArtifacts(): void { },
	setSubagentArtifacts(): void { },
	setRuleOverrides(): void { },
	clearAgentArtifacts(): void { },
	clearSubagentArtifacts(): void { },
	migrate(): void { },
};

class NullChatArtifactsService implements IChatArtifactsService {
	declare readonly _serviceBrand: undefined;
	getArtifacts() { return NULL_CHAT_ARTIFACTS; }
}

class NullChatSessionsService implements IChatSessionsService {
	declare readonly _serviceBrand: undefined;
	readonly onDidChangeItemsProviders = Event.None;
	readonly onDidChangeSessionItems = Event.None;
	readonly onDidCommitSession = Event.None;
	readonly onDidChangeAvailability = Event.None;
	readonly onDidChangeInProgress = Event.None;
	readonly onDidChangeContentProviderSchemes = Event.None;
	readonly onDidChangeSessionOptions = Event.None;
	readonly onDidChangeOptionGroups = Event.None;
	readonly onDidChangeCustomizations = Event.None;
	getChatSessionContribution() { return undefined; }
	getAllChatSessionContributions() { return []; }
	async getChatSessionHistory() { return []; }
	registerChatSessionContribution(): IDisposable { return Disposable.None; }
	registerChatSessionItemController(): IDisposable { return Disposable.None; }
	getRegisteredChatSessionItemProviders() { return []; }
	async activateChatSessionItemProvider(): Promise<void> { }
	async *getChatSessionItems(_filter: readonly string[] | undefined, _token: import('../../../../base/common/cancellation.js').CancellationToken): AsyncIterable<{ readonly chatSessionType: string; readonly items: readonly never[] }> { }
	async refreshChatSessionItems(): Promise<void> { }
	/** @deprecated */
	getInProgress() { return []; }
	async resolveChatSessionItem() { return undefined; }
	canSetChatSessionItemArchived() { return false; }
	setChatSessionItemArchived(): void { }
	canSetChatSessionItemRead() { return false; }
	setChatSessionItemRead(): void { }
	getContentProviderSchemes() { return []; }
	registerChatSessionContentProvider(): IDisposable { return Disposable.None; }
	async canResolveChatSession() { return false; }
	getOrCreateChatSession(): never { return notSupported(); }
	updateChatSessionMetadata() { return false; }
	resolveChatResponseUri(_sessionResource: import('../../../../base/common/uri.js').URI, href: string) { return href; }
	async provideChatInputCompletions() { return undefined; }
	async getChatInputCompletionTriggerCharacters() { return undefined; }
	getSessionOptions() { return undefined; }
	getSessionOption() { return undefined; }
	setSessionOption() { return false; }
	updateSessionOptions() { return false; }
	getCapabilitiesForSessionType() { return undefined; }
	getCustomAgentTargetForSessionType() { return Target.Undefined; }
	requiresCustomModelsForSessionType() { return false; }
	supportsAutoModelForSessionType() { return true; }
	requiresCopilotSignInForSessionType() { return false; }
	supportsDelegationForSessionType() { return true; }
	sessionSupportsFork() { return false; }
	forkChatSession(): Promise<never> { return Promise.reject(notSupported()); }
	sessionSupportsRename() { return false; }
	async renameChatSession(): Promise<void> { }
	getOptionGroupsForSessionType() { return undefined; }
	setOptionGroupsForSessionType(): void { }
	async getNewChatSessionInputState() { return undefined; }
	async createNewChatSessionItem() { return undefined; }
	deleteChatSessionItem(): Promise<never> { return Promise.reject(notSupported()); }
	registerSessionResourceAlias(): void { }
	setMaterializedSessionResource(): void { }
	getMaterializedSessionResource() { return undefined; }
	clearMaterializedSessionResource(): void { }
	fireSessionCommitted(): void { }
	registerCustomizationsProvider(): IDisposable { return Disposable.None; }
	hasCustomizationsProvider() { return false; }
	async getCustomizations() { return undefined; }
}

registerSingleton(IChatArtifactsService, NullChatArtifactsService, InstantiationType.Delayed);
registerSingleton(IChatSessionsService, NullChatSessionsService, InstantiationType.Delayed);
registerSingleton(IChatTodoListService, NullChatTodoListService, InstantiationType.Delayed);
registerSingleton(IAgentSessionsService, NullAgentSessionsService, InstantiationType.Delayed);
registerSingleton(ICodeMapperService, CodeMapperService, InstantiationType.Delayed);
registerSingleton(IChatDebugService, NullChatDebugService, InstantiationType.Delayed);
registerSingleton(ICustomizationHarnessService, NullCustomizationHarnessService, InstantiationType.Delayed);
registerSingleton(IChatOutputRendererService, NullChatOutputRendererService, InstantiationType.Delayed);
registerSingleton(IAgentPluginService, NullAgentPluginService, InstantiationType.Delayed);
registerSingleton(IPluginInstallService, NullPluginInstallService, InstantiationType.Delayed);
registerSingleton(IPromptsService, NullPromptsService, InstantiationType.Delayed);
registerSingleton(IChatMicrosoftSignInProbeService, NullChatMicrosoftSignInProbeService, InstantiationType.Delayed);
registerSingleton(IInlineChatSessionService, NullInlineChatSessionService, InstantiationType.Delayed);
registerSingleton(IChatEditingService, NullChatEditingService, InstantiationType.Delayed);
registerSingleton(ILanguageModelsService, NullLanguageModelsService, InstantiationType.Delayed);
registerSingleton(ILanguageModelIgnoredFilesService, NullLanguageModelIgnoredFilesService, InstantiationType.Delayed);
registerSingleton(IAgentHostImportConversationStore, NullAgentHostImportConversationStore, InstantiationType.Delayed);
