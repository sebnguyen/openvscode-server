/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// DSH strip: the twin ships without chat UI — the chat/inlineChat contribution
// imports are removed from workbench.*.main.ts. A few kept workbench features
// (tasks, quick symbol access, terminal decorations) still DI-inject
// IChatService / IChatWidgetService, so no-op implementations keep the service
// container wired. The sessions lanes (src/vs/sessions/*.main.ts) register the
// real services; this module is only reachable from the stripped twin lanes.

import { Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { constObservable } from '../../../../base/common/observable.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IChatService } from '../common/chatService/chatService.js';
import { IChatWidgetService } from './chat.js';

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

registerSingleton(IChatService, NullChatService, InstantiationType.Delayed);
registerSingleton(IChatWidgetService, NullChatWidgetService, InstantiationType.Delayed);
