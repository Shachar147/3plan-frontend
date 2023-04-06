import { createContext } from 'react';
import { action, computed, observable } from 'mobx';

export class ModalsStore {
	@observable viewOrEdit: 'view' | 'edit' = 'view';

	@computed
	get isEditMode() {
		return this.viewOrEdit === 'edit';
	}

	@computed
	get isViewMode() {
		return this.viewOrEdit === 'view';
	}

	@action
	switchToViewMode() {
		this.viewOrEdit = 'view';
	}

	@action
	switchToEditMode() {
		this.viewOrEdit = 'edit';
	}
}

export const modalsStoreContext = createContext(new ModalsStore());
