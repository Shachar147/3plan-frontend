import { EventStore } from '../stores/events-store';
import { SidebarEvent } from '../utils/interfaces';
import TranslateService from './translate-service';

export interface LocationData {
	latitude: number;
	longitude: number;
	address?: string;
}

export interface ClusteringOptions {
	algorithm: 'distance-based' | 'kmeans' | 'dbscan';
	maxClusters?: number;
	minClusterSize?: number;
	distanceThreshold?: number; // in meters
	drivingThresholdMinutes?: number;
	walkingThresholdMinutes?: number;
	useAirDistanceFallback?: boolean;
	maxAirDistance?: number; // in meters
}

export interface Cluster {
	id: string;
	events: SidebarEvent[];
	center: LocationData;
	radius: number; // in meters
	name?: string;
	color?: string; // Assigned color for the cluster
}

export class ClusteringService {
	// Color palette for clusters (priority order)
	private static readonly COLOR_PALETTE = [
		'#E74C3C', // red
		'#A3CB38', // green (soft)
		'#3498DB', // blue (sky)
		'#9B59B6', // purple (violet)
		'#F1C40F', // yellow (amber)
		'#E67E22', // orange
		'#8D6E63', // brown
		'#a70000', // royal blue
		'#000000', // black
		'#f8ccd9', // pink
		'#808080', // gray
		'#16A085', // teal (turquoise)
		'#4169E1', // periwinkle blue
		'#32CD32', // lime green
		'#000080', // navy
		'#FF7F50', // coral
		'#FFD700', // gold
		'#27AE60', // green (darker)
		'#1ABC9C', // turquoise
	];

	/**
	 * Main clustering method that delegates to specific algorithms
	 */
	static clusterEvents(
		events: SidebarEvent[],
		options: ClusteringOptions,
		distanceResults?: Map<string, any>
	): Cluster[] {
		// Filter events with valid location data
		const eventsWithLocation = events.filter(
			(event) =>
				event.location &&
				typeof event.location === 'object' &&
				event.location.latitude != null &&
				event.location.longitude != null
		);

		if (eventsWithLocation.length === 0) {
			return [];
		}

		let clusters: Cluster[];
		switch (options.algorithm) {
			// case 'kmeans':
			// 	clusters = this.kMeansClustering(eventsWithLocation, options);
			// 	break;
			// case 'dbscan':
			// 	clusters = this.dbscanClustering(eventsWithLocation, options, distanceResults);
			// 	break;
			case 'distance-based':
			default:
				clusters = this.distanceBasedClustering(eventsWithLocation, options, distanceResults);
				break;
		}

		// Assign colors to clusters
		return this.assignColorsToClusters(clusters);
	}

	/**
	 * Distance-based clustering using travel time thresholds
	 */
	private static distanceBasedClustering(
		events: SidebarEvent[],
		options: ClusteringOptions,
		distanceResults?: Map<string, any>
	): Cluster[] {
		// Performance optimization: Limit the number of events to process
		const MAX_EVENTS_TO_PROCESS = 1000;
		const eventsToProcess = events.length > MAX_EVENTS_TO_PROCESS ? events.slice(0, MAX_EVENTS_TO_PROCESS) : events;

		console.log(`Processing ${eventsToProcess.length} events (limited from ${events.length} for performance)`);

		const clusters: Cluster[] = [];
		const drivingThresholdSeconds = (options.drivingThresholdMinutes || 10) * 60;
		const walkingThresholdSeconds = (options.walkingThresholdMinutes || 20) * 60;
		const maxClusters = Math.min(options.maxClusters || 10, 20); // Cap at 20 for performance

		// Use air distance threshold when fallback is enabled
		// Convert time-based thresholds to approximate distance equivalents
		const drivingThresholdMeters = this.convertTimeToApproximateDistance(drivingThresholdSeconds, 'driving');
		const walkingThresholdMeters = this.convertTimeToApproximateDistance(walkingThresholdSeconds, 'walking');

		const distanceThreshold = options.useAirDistanceFallback
			? options.maxAirDistance || 5000
			: Math.min(drivingThresholdMeters, walkingThresholdMeters);

		console.log(
			`Distance-based clustering using ${
				options.useAirDistanceFallback ? 'air distance' : 'converted travel time'
			} threshold: ${distanceThreshold}m (driving: ${drivingThresholdMeters}m, walking: ${walkingThresholdMeters}m)`
		);

		// Start with spatial pre-clustering to group nearby events immediately
		const initialClusters = this.createInitialSpatialClusters(eventsToProcess, distanceThreshold, options);
		clusters.push(...initialClusters);

		// Performance optimization: Use a more efficient clustering approach
		// Instead of O(n²) nested loops, use spatial indexing for large datasets
		if (clusters.length > 100) {
			return this.spatialClustering(clusters, distanceThreshold, maxClusters, options);
		}

		// For smaller datasets, use the original approach but with early termination
		let iterations = 0;
		const MAX_ITERATIONS = 50; // Prevent infinite loops

		while (clusters.length > maxClusters && iterations < MAX_ITERATIONS) {
			let closestPair = null;
			let minDistance = Infinity;

			// Find the closest pair of clusters with early termination
			for (let i = 0; i < clusters.length; i++) {
				for (let j = i + 1; j < clusters.length; j++) {
					const distance = this.getDistanceBetweenClusters(
						clusters[i],
						clusters[j],
						distanceResults,
						options
					);
					if (distance < minDistance) {
						minDistance = distance;
						closestPair = { cluster1: clusters[i], cluster2: clusters[j], distance };
					}
				}
			}

			if (!closestPair || minDistance > distanceThreshold) {
				break; // Stop if no close clusters found
			}

			// Merge the closest clusters
			const mergedCluster = this.mergeClusters(closestPair.cluster1, closestPair.cluster2);
			clusters.splice(clusters.indexOf(closestPair.cluster1), 1);
			clusters.splice(clusters.indexOf(closestPair.cluster2), 1);
			clusters.push(mergedCluster);
			iterations++;
		}

		// Calculate radius for each cluster
		return clusters.map((cluster) => ({
			...cluster,
			radius: this.calculateClusterRadius(cluster.events, cluster.center),
		}));
	}

	/**
	 * Convert time-based thresholds to approximate distance equivalents
	 */
	private static convertTimeToApproximateDistance(timeInSeconds: number, mode: 'driving' | 'walking'): number {
		// Approximate speeds for conversion
		const averageDrivingSpeed = 30; // km/h in city traffic
		const averageWalkingSpeed = 5; // km/h walking speed

		const speedKmh = mode === 'driving' ? averageDrivingSpeed : averageWalkingSpeed;
		const timeInHours = timeInSeconds / 3600; // Convert seconds to hours
		const distanceKm = speedKmh * timeInHours; // Distance = Speed × Time
		const distanceMeters = distanceKm * 1000; // Convert km to meters

		return Math.round(distanceMeters);
	}

	/**
	 * Create initial spatial clusters by grouping nearby events immediately
	 */
	private static createInitialSpatialClusters(
		events: SidebarEvent[],
		distanceThreshold: number,
		options: ClusteringOptions
	): Cluster[] {
		const clusters: Cluster[] = [];
		const processed = new Set<string>();

		// Shuffle events to avoid processing by original order (color/priority)
		const shuffledEvents = [...events].sort(() => Math.random() - 0.5);

		for (const event of shuffledEvents) {
			if (processed.has(event.id)) continue;

			// Start a new cluster with this event
			const cluster: Cluster = {
				id: `cluster_${clusters.length}`,
				events: [event],
				center: {
					latitude: (event.location as LocationData).latitude,
					longitude: (event.location as LocationData).longitude,
					address: (event.location as LocationData).address,
				},
				radius: 0,
			};
			processed.add(event.id);

			// Find all nearby events to add to this cluster
			for (const otherEvent of shuffledEvents) {
				if (processed.has(otherEvent.id)) continue;

				const distance = this.getDistanceBetweenEvents(event, otherEvent, undefined, options);
				if (distance <= distanceThreshold) {
					cluster.events.push(otherEvent);
					processed.add(otherEvent.id);
				}
			}

			// Update cluster center to be the centroid of all events
			cluster.center = this.calculateCentroid(cluster.events);
			clusters.push(cluster);
		}

		console.log(`Created ${clusters.length} initial spatial clusters from ${events.length} events`);
		return clusters;
	}

	/**
	 * Spatial clustering for large datasets - truly spatial-based approach
	 */
	private static spatialClustering(
		clusters: Cluster[],
		distanceThreshold: number,
		maxClusters: number,
		options: ClusteringOptions
	): Cluster[] {
		console.log(`Using spatial clustering for ${clusters.length} clusters`);

		// Shuffle clusters to avoid processing by original order
		const shuffledClusters = [...clusters].sort(() => Math.random() - 0.5);

		// Use a more sophisticated spatial approach
		const result: Cluster[] = [];
		const processed = new Set<string>();

		// Process clusters in random order to avoid bias
		for (const cluster of shuffledClusters) {
			if (processed.has(cluster.id)) continue;

			let currentCluster = cluster;
			processed.add(cluster.id);

			// Find all nearby clusters within distance threshold
			const nearbyClusters: Cluster[] = [];
			for (const otherCluster of shuffledClusters) {
				if (processed.has(otherCluster.id)) continue;

				const distance = this.getDistanceBetweenClusters(currentCluster, otherCluster, undefined, options);
				if (distance <= distanceThreshold) {
					nearbyClusters.push(otherCluster);
					processed.add(otherCluster.id);
				}
			}

			// Merge all nearby clusters into one
			for (const nearbyCluster of nearbyClusters) {
				currentCluster = this.mergeClusters(currentCluster, nearbyCluster);
			}

			result.push(currentCluster);
		}

		// If we still have too many clusters, merge the closest ones
		if (result.length > maxClusters) {
			return this.mergeClosestClusters(result, maxClusters, distanceThreshold, options);
		}

		return result.map((cluster) => ({
			...cluster,
			radius: this.calculateClusterRadius(cluster.events, cluster.center),
		}));
	}

	/**
	 * Merge the closest clusters until we reach the target number
	 */
	private static mergeClosestClusters(
		clusters: Cluster[],
		targetCount: number,
		distanceThreshold: number,
		options: ClusteringOptions
	): Cluster[] {
		let currentClusters = [...clusters];

		while (currentClusters.length > targetCount) {
			let closestPair = null;
			let minDistance = Infinity;

			// Find the closest pair of clusters
			for (let i = 0; i < currentClusters.length; i++) {
				for (let j = i + 1; j < currentClusters.length; j++) {
					const distance = this.getDistanceBetweenClusters(
						currentClusters[i],
						currentClusters[j],
						undefined,
						options
					);
					if (distance < minDistance) {
						minDistance = distance;
						closestPair = { cluster1: currentClusters[i], cluster2: currentClusters[j] };
					}
				}
			}

			if (!closestPair) break;

			// Merge the closest pair
			const merged = this.mergeClusters(closestPair.cluster1, closestPair.cluster2);
			currentClusters = currentClusters.filter(
				(c) => c.id !== closestPair.cluster1.id && c.id !== closestPair.cluster2.id
			);
			currentClusters.push(merged);
		}

		return currentClusters.map((cluster) => ({
			...cluster,
			radius: this.calculateClusterRadius(cluster.events, cluster.center),
		}));
	}

	/**
	 * Merge clusters that are within the distance threshold
	 */
	private static mergeNearbyClusters(
		clusters: Cluster[],
		distanceThreshold: number,
		options: ClusteringOptions
	): Cluster[] {
		if (clusters.length <= 1) return clusters;

		const result: Cluster[] = [];
		const used = new Set<string>();

		for (let i = 0; i < clusters.length; i++) {
			if (used.has(clusters[i].id)) continue;

			let currentCluster = clusters[i];
			used.add(currentCluster.id);

			// Find and merge nearby clusters
			for (let j = i + 1; j < clusters.length; j++) {
				if (used.has(clusters[j].id)) continue;

				const distance = this.getDistanceBetweenClusters(currentCluster, clusters[j], undefined, options);
				if (distance <= distanceThreshold) {
					currentCluster = this.mergeClusters(currentCluster, clusters[j]);
					used.add(clusters[j].id);
				}
			}

			result.push(currentCluster);
		}

		return result;
	}

	// /**
	//  * K-Means clustering algorithm
	//  */
	// private static kMeansClustering(events: SidebarEvent[], options: ClusteringOptions): Cluster[] {
	// 	const k = Math.min(options.maxClusters || 5, events.length);
	// 	const maxIterations = 100;
	// 	const tolerance = 0.001;

	// 	// Initialize centroids randomly
	// 	let centroids = this.initializeCentroids(events, k);
	// 	let clusters: Cluster[] = [];
	// 	let iterations = 0;

	// 	while (iterations < maxIterations) {
	// 		// Assign events to nearest centroid
	// 		clusters = this.assignEventsToCentroids(events, centroids);

	// 		// Update centroids
	// 		const newCentroids = this.updateCentroids(clusters);

	// 		// Check for convergence
	// 		if (this.hasConverged(centroids, newCentroids, tolerance)) {
	// 			break;
	// 		}

	// 		centroids = newCentroids;
	// 		iterations++;
	// 	}

	// 	// Filter out empty clusters and calculate radius
	// 	return clusters
	// 		.filter((cluster) => cluster.events.length > 0)
	// 		.map((cluster) => ({
	// 			...cluster,
	// 			radius: this.calculateClusterRadius(cluster.events, cluster.center),
	// 		}));
	// }

	// /**
	//  * DBSCAN clustering algorithm (Density-Based Spatial Clustering)
	//  */
	// private static dbscanClustering(
	// 	events: SidebarEvent[],
	// 	options: ClusteringOptions,
	// 	distanceResults?: Map<string, any>
	// ): Cluster[] {
	// 	const minPts = options.minClusterSize || 2;
	// 	const eps = options.distanceThreshold || 1000; // 1km default
	// 	const maxClusters = options.maxClusters || 10;

	// 	const visited = new Set<string>();
	// 	const clustered = new Set<string>();
	// 	const clusters: Cluster[] = [];
	// 	let clusterId = 0;

	// 	for (const event of events) {
	// 		if (visited.has(event.id)) continue;

	// 		visited.add(event.id);
	// 		const neighbors = this.getNeighbors(event, events, eps, distanceResults, options);

	// 		if (neighbors.length < minPts) {
	// 			// Mark as noise (we'll handle this later)
	// 			continue;
	// 		}

	// 		// Create new cluster
	// 		const cluster: Cluster = {
	// 			id: `cluster_${clusterId++}`,
	// 			events: [event],
	// 			center: {
	// 				latitude: (event.location as LocationData).latitude,
	// 				longitude: (event.location as LocationData).longitude,
	// 				address: (event.location as LocationData).address,
	// 			},
	// 			radius: 0,
	// 		};

	// 		clustered.add(event.id);

	// 		// Expand cluster
	// 		const seedSet = [...neighbors];
	// 		let i = 0;
	// 		while (i < seedSet.length) {
	// 			const neighbor = seedSet[i];
	// 			if (!visited.has(neighbor.id)) {
	// 				visited.add(neighbor.id);
	// 				const neighborNeighbors = this.getNeighbors(neighbor, events, eps, distanceResults, options);
	// 				if (neighborNeighbors.length >= minPts) {
	// 					seedSet.push(...neighborNeighbors);
	// 				}
	// 			}
	// 			if (!clustered.has(neighbor.id)) {
	// 				cluster.events.push(neighbor);
	// 				clustered.add(neighbor.id);
	// 			}
	// 			i++;
	// 		}

	// 		// Update cluster center and radius
	// 		cluster.center = this.calculateCentroid(cluster.events);
	// 		cluster.radius = this.calculateClusterRadius(cluster.events, cluster.center);
	// 		clusters.push(cluster);

	// 		// Stop if we've reached max clusters
	// 		if (clusters.length >= maxClusters) {
	// 			break;
	// 		}
	// 	}

	// 	// Add remaining events as individual clusters if we haven't reached max
	// 	for (const event of events) {
	// 		if (!clustered.has(event.id) && clusters.length < maxClusters) {
	// 			clusters.push({
	// 				id: `cluster_${clusterId++}`,
	// 				events: [event],
	// 				center: {
	// 					latitude: (event.location as LocationData).latitude,
	// 					longitude: (event.location as LocationData).longitude,
	// 					address: (event.location as LocationData).address,
	// 				},
	// 				radius: 0,
	// 			});
	// 		}
	// 	}

	// 	return clusters;
	// }

	// /**
	//  * Helper methods
	//  */
	// private static initializeCentroids(events: SidebarEvent[], k: number): LocationData[] {
	// 	const centroids: LocationData[] = [];
	// 	const usedIndices = new Set<number>();

	// 	for (let i = 0; i < k; i++) {
	// 		let randomIndex;
	// 		do {
	// 			randomIndex = Math.floor(Math.random() * events.length);
	// 		} while (usedIndices.has(randomIndex));

	// 		usedIndices.add(randomIndex);
	// 		const eventLocation = events[randomIndex].location;
	// 		if (eventLocation && typeof eventLocation === 'object') {
	// 			centroids.push({
	// 				latitude: eventLocation.latitude,
	// 				longitude: eventLocation.longitude,
	// 				address: eventLocation.address,
	// 			});
	// 		}
	// 	}

	// 	return centroids;
	// }

	// private static assignEventsToCentroids(events: SidebarEvent[], centroids: LocationData[]): Cluster[] {
	// 	const clusters: Cluster[] = centroids.map((centroid, index) => ({
	// 		id: `cluster_${index}`,
	// 		events: [],
	// 		center: centroid,
	// 		radius: 0,
	// 	}));

	// 	for (const event of events) {
	// 		let closestClusterIndex = 0;
	// 		let minDistance = Infinity;

	// 		for (let i = 0; i < centroids.length; i++) {
	// 			const distance = this.calculateHaversineDistance(
	// 				(event.location as LocationData).latitude,
	// 				(event.location as LocationData).longitude,
	// 				centroids[i].latitude,
	// 				centroids[i].longitude
	// 			);
	// 			if (distance < minDistance) {
	// 				minDistance = distance;
	// 				closestClusterIndex = i;
	// 			}
	// 		}

	// 		clusters[closestClusterIndex].events.push(event);
	// 	}

	// 	return clusters;
	// }

	// private static updateCentroids(clusters: Cluster[]): LocationData[] {
	// 	return clusters.map((cluster) => this.calculateCentroid(cluster.events));
	// }

	// private static hasConverged(
	// 	oldCentroids: LocationData[],
	// 	newCentroids: LocationData[],
	// 	tolerance: number
	// ): boolean {
	// 	for (let i = 0; i < oldCentroids.length; i++) {
	// 		const distance = this.calculateHaversineDistance(
	// 			oldCentroids[i].latitude,
	// 			oldCentroids[i].longitude,
	// 			newCentroids[i].latitude,
	// 			newCentroids[i].longitude
	// 		);
	// 		if (distance > tolerance) {
	// 			return false;
	// 		}
	// 	}
	// 	return true;
	// }

	// private static getNeighbors(
	// 	event: SidebarEvent,
	// 	events: SidebarEvent[],
	// 	eps: number,
	// 	distanceResults?: Map<string, any>,
	// 	options?: ClusteringOptions
	// ): SidebarEvent[] {
	// 	return events.filter((otherEvent) => {
	// 		if (otherEvent.id === event.id) return false;
	// 		const distance = this.getDistanceBetweenEvents(event, otherEvent, distanceResults, options);
	// 		return distance <= eps;
	// 	});
	// }

	private static mergeClusters(cluster1: Cluster, cluster2: Cluster): Cluster {
		const mergedEvents = [...cluster1.events, ...cluster2.events];
		const center = this.calculateCentroid(mergedEvents);
		const radius = this.calculateClusterRadius(mergedEvents, center);

		return {
			id: `cluster_${Date.now()}`,
			events: mergedEvents,
			center,
			radius,
		};
	}

	private static getDistanceBetweenClusters(
		cluster1: Cluster,
		cluster2: Cluster,
		distanceResults?: Map<string, any>,
		options?: ClusteringOptions
	): number {
		// Calculate air distance between cluster centers
		const airDistance = this.calculateHaversineDistance(
			cluster1.center.latitude,
			cluster1.center.longitude,
			cluster2.center.latitude,
			cluster2.center.longitude
		);

		console.log('hereeee', airDistance, 'between ', cluster1.events[0].title, 'and', cluster2.events[0].title);

		// If air distance fallback is enabled, use it with the max distance limit
		if (options?.useAirDistanceFallback && options?.maxAirDistance) {
			// Return the air distance if it's within the max limit, otherwise return a very large distance
			const result = airDistance <= options.maxAirDistance ? airDistance : Number.MAX_SAFE_INTEGER;
			return result;
		}

		// If air distance fallback is not enabled, return a very large distance to prevent clustering
		// This forces the system to rely on travel time data only
		return Number.MAX_SAFE_INTEGER;
	}

	private static getDistanceBetweenEvents(
		event1: SidebarEvent,
		event2: SidebarEvent,
		distanceResults?: Map<string, any>,
		options?: ClusteringOptions
	): number {
		// Calculate air distance between events
		const location1 = event1.location as LocationData;
		const location2 = event2.location as LocationData;
		const airDistance = this.calculateHaversineDistance(
			location1.latitude,
			location1.longitude,
			location2.latitude,
			location2.longitude
		);

		// If air distance fallback is enabled, use it with the max distance limit
		if (options?.useAirDistanceFallback && options?.maxAirDistance) {
			// Return the air distance if it's within the max limit, otherwise return a very large distance
			const result = airDistance <= options.maxAirDistance ? airDistance : Number.MAX_SAFE_INTEGER;
			return result;
		}

		// If air distance fallback is not enabled, return a very large distance to prevent clustering
		// This forces the system to rely on travel time data only
		return Number.MAX_SAFE_INTEGER;
	}

	private static calculateCentroid(events: SidebarEvent[]): LocationData {
		if (events.length === 0) {
			return { latitude: 0, longitude: 0 };
		}

		const sumLat = events.reduce((sum, event) => sum + (event.location as LocationData).latitude, 0);
		const sumLng = events.reduce((sum, event) => sum + (event.location as LocationData).longitude, 0);

		return {
			latitude: sumLat / events.length,
			longitude: sumLng / events.length,
			address: (events[0].location as LocationData).address, // Use first event's address as reference
		};
	}

	private static calculateClusterRadius(events: SidebarEvent[], center: LocationData): number {
		if (events.length === 0) return 0;

		let maxDistance = 0;
		for (const event of events) {
			const eventLocation = event.location as LocationData;
			const distance = this.calculateHaversineDistance(
				eventLocation.latitude,
				eventLocation.longitude,
				center.latitude,
				center.longitude
			);
			maxDistance = Math.max(maxDistance, distance);
		}

		return maxDistance;
	}

	private static calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371e3; // Earth's radius in meters
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c; // Distance in meters
	}

	/**
	 * Generate a human-readable name for a cluster
	 */
	static generateClusterName(eventStore: EventStore, cluster: Cluster, index: number): string {
		if (cluster.events.length === 0) {
			return TranslateService.translate(eventStore, 'AREA_X', {
				X: index + 1,
			});
		}

		// Try to find a common location name
		const addresses = cluster.events
			.map((event) => (event.location as LocationData).address)
			.filter((address) => address && address.trim())
			.map((address) => address.split(',')[0].trim()); // Get first part of address

		if (addresses.length > 0) {
			// Find the most common address prefix
			const addressCounts = addresses.reduce((counts, address) => {
				counts[address] = (counts[address] || 0) + 1;
				return counts;
			}, {} as Record<string, number>);

			const mostCommonAddress = Object.entries(addressCounts).sort(([, a], [, b]) => b - a)[0][0];

			return TranslateService.translate(eventStore, 'AREA_X', {
				X: mostCommonAddress,
			});
		}

		// Fallback to generic name
		return TranslateService.translate(eventStore, 'AREA_X', {
			X: index + 1,
		});
	}

	/**
	 * Assign colors to clusters based on priority (largest clusters get priority colors)
	 */
	private static assignColorsToClusters(clusters: Cluster[]): Cluster[] {
		// Sort clusters by size (largest first) to assign priority colors
		const sortedClusters = [...clusters].sort((a, b) => b.events.length - a.events.length);

		return sortedClusters.map((cluster, index) => ({
			...cluster,
			color: this.COLOR_PALETTE[index % this.COLOR_PALETTE.length],
		}));
	}
}

export default ClusteringService;
