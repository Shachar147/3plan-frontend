import { createContext } from 'react';
import { action, computed, observable } from 'mobx';

export class WalkthroughStore {
	@observable hasCompletedWalkthrough = false;
	@observable isRunning = false;

	constructor() {
		// Check if user has completed walkthrough before
		this.hasCompletedWalkthrough = localStorage.getItem('triplan-walkthrough-completed') === 'true';
	}

	@action
	startWalkthrough() {
		this.isRunning = true;
	}

	@action
	completeWalkthrough() {
		this.isRunning = false;
		this.hasCompletedWalkthrough = true;
		localStorage.setItem('triplan-walkthrough-completed', 'true');
	}

	@action
	skipWalkthrough() {
		this.isRunning = false;
	}

	@computed
	get shouldAutoStart() {
		return !this.hasCompletedWalkthrough;
	}
}

export const walkthroughStoreContext = createContext(new WalkthroughStore());
