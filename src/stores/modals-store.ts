import { createContext } from 'react';
import { observable } from 'mobx';

export class ModalsStore {
	@observable viewOrEdit: 'view' | 'edit' = 'view';
}

export const modalsStoreContext = createContext(new ModalsStore());
