import { useContext, useEffect, useState } from 'react';
import { eventStoreContext } from '../stores/events-store';
import { DataServices } from '../services/data-handlers/data-handler-base';
import { runInAction } from 'mobx';

// Hook
export default function useWindowSize() {
	// Initialize state with undefined width/height so server and client renders match
	// Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
	const [windowSize, setWindowSize] = useState({
		width: undefined,
		height: undefined,
	});
	useEffect(() => {
		// Handler to call on window resize
		function handleResize() {
			// Set window width/height to state
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		}
		// Add event listener
		window.addEventListener('resize', handleResize);
		// Call handler right away so state gets updated with initial window size
		handleResize();
		// Remove event listener on cleanup
		return () => window.removeEventListener('resize', handleResize);
	}, []); // Empty array ensures that effect is only run on mount
	return windowSize;
}

export function useHandleWindowResize() {
	const eventStore = useContext(eventStoreContext);
	const windowResolution = useWindowSize();
	useEffect(() => {
		const { width = 1000, height = 1000 } = windowResolution;
		const isMobile = width <= 600 || height <= 600;

		runInAction(() => {
			if (!eventStore.isMobile && isMobile) {
				eventStore.setMobileViewMode(
					DataServices.LocalStorageService.getLastViewMode(eventStore.mobileViewMode)
				);
			}
			eventStore.setIsMobile(isMobile);
		});
	}, [windowResolution]);
}
