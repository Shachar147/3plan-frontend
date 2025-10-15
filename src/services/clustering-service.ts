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
		'#E67E22', // orange
		'#A3CB38', // green (soft)
		'#3498DB', // blue (sky)
		'#9B59B6', // purple (violet)
		'#F1C40F', // yellow (amber)
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
			case 'kmeans':
				clusters = this.kMeansClustering(eventsWithLocation, options);
				break;
			case 'dbscan':
				clusters = this.dbscanClustering(eventsWithLocation, options, distanceResults);
				break;
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
		const clusters: Cluster[] = [];
		const drivingThresholdSeconds = (options.drivingThresholdMinutes || 10) * 60;
		const walkingThresholdSeconds = (options.walkingThresholdMinutes || 20) * 60;
		const maxClusters = options.maxClusters || 10;

		// Start with each event as its own cluster
		for (const event of events) {
			clusters.push({
				id: `cluster_${clusters.length}`,
				events: [event],
				center: {
					latitude: (event.location as LocationData).latitude,
					longitude: (event.location as LocationData).longitude,
					address: (event.location as LocationData).address,
				},
				radius: 0,
			});
		}

		// Merge clusters based on travel time until we reach maxClusters
		while (clusters.length > maxClusters) {
			let closestPair = null;
			let minDistance = Infinity;

			// Find the closest pair of clusters
			for (let i = 0; i < clusters.length; i++) {
				for (let j = i + 1; j < clusters.length; j++) {
					const distance = this.getDistanceBetweenClusters(clusters[i], clusters[j], distanceResults);
					if (distance < minDistance) {
						minDistance = distance;
						closestPair = { cluster1: clusters[i], cluster2: clusters[j], distance };
					}
				}
			}

			if (!closestPair || minDistance > Math.min(drivingThresholdSeconds, walkingThresholdSeconds)) {
				break; // Stop if no close clusters found
			}

			// Merge the closest clusters
			const mergedCluster = this.mergeClusters(closestPair.cluster1, closestPair.cluster2);
			clusters.splice(clusters.indexOf(closestPair.cluster1), 1);
			clusters.splice(clusters.indexOf(closestPair.cluster2), 1);
			clusters.push(mergedCluster);
		}

		// Calculate radius for each cluster
		return clusters.map((cluster) => ({
			...cluster,
			radius: this.calculateClusterRadius(cluster.events, cluster.center),
		}));
	}

	/**
	 * K-Means clustering algorithm
	 */
	private static kMeansClustering(events: SidebarEvent[], options: ClusteringOptions): Cluster[] {
		const k = Math.min(options.maxClusters || 5, events.length);
		const maxIterations = 100;
		const tolerance = 0.001;

		// Initialize centroids randomly
		let centroids = this.initializeCentroids(events, k);
		let clusters: Cluster[] = [];
		let iterations = 0;

		while (iterations < maxIterations) {
			// Assign events to nearest centroid
			clusters = this.assignEventsToCentroids(events, centroids);

			// Update centroids
			const newCentroids = this.updateCentroids(clusters);

			// Check for convergence
			if (this.hasConverged(centroids, newCentroids, tolerance)) {
				break;
			}

			centroids = newCentroids;
			iterations++;
		}

		// Filter out empty clusters and calculate radius
		return clusters
			.filter((cluster) => cluster.events.length > 0)
			.map((cluster) => ({
				...cluster,
				radius: this.calculateClusterRadius(cluster.events, cluster.center),
			}));
	}

	/**
	 * DBSCAN clustering algorithm (Density-Based Spatial Clustering)
	 */
	private static dbscanClustering(
		events: SidebarEvent[],
		options: ClusteringOptions,
		distanceResults?: Map<string, any>
	): Cluster[] {
		const minPts = options.minClusterSize || 2;
		const eps = options.distanceThreshold || 1000; // 1km default
		const maxClusters = options.maxClusters || 10;

		const visited = new Set<string>();
		const clustered = new Set<string>();
		const clusters: Cluster[] = [];
		let clusterId = 0;

		for (const event of events) {
			if (visited.has(event.id)) continue;

			visited.add(event.id);
			const neighbors = this.getNeighbors(event, events, eps, distanceResults);

			if (neighbors.length < minPts) {
				// Mark as noise (we'll handle this later)
				continue;
			}

			// Create new cluster
			const cluster: Cluster = {
				id: `cluster_${clusterId++}`,
				events: [event],
				center: {
					latitude: (event.location as LocationData).latitude,
					longitude: (event.location as LocationData).longitude,
					address: (event.location as LocationData).address,
				},
				radius: 0,
			};

			clustered.add(event.id);

			// Expand cluster
			const seedSet = [...neighbors];
			let i = 0;
			while (i < seedSet.length) {
				const neighbor = seedSet[i];
				if (!visited.has(neighbor.id)) {
					visited.add(neighbor.id);
					const neighborNeighbors = this.getNeighbors(neighbor, events, eps, distanceResults);
					if (neighborNeighbors.length >= minPts) {
						seedSet.push(...neighborNeighbors);
					}
				}
				if (!clustered.has(neighbor.id)) {
					cluster.events.push(neighbor);
					clustered.add(neighbor.id);
				}
				i++;
			}

			// Update cluster center and radius
			cluster.center = this.calculateCentroid(cluster.events);
			cluster.radius = this.calculateClusterRadius(cluster.events, cluster.center);
			clusters.push(cluster);

			// Stop if we've reached max clusters
			if (clusters.length >= maxClusters) {
				break;
			}
		}

		// Add remaining events as individual clusters if we haven't reached max
		for (const event of events) {
			if (!clustered.has(event.id) && clusters.length < maxClusters) {
				clusters.push({
					id: `cluster_${clusterId++}`,
					events: [event],
					center: {
						latitude: (event.location as LocationData).latitude,
						longitude: (event.location as LocationData).longitude,
						address: (event.location as LocationData).address,
					},
					radius: 0,
				});
			}
		}

		return clusters;
	}

	/**
	 * Helper methods
	 */
	private static initializeCentroids(events: SidebarEvent[], k: number): LocationData[] {
		const centroids: LocationData[] = [];
		const usedIndices = new Set<number>();

		for (let i = 0; i < k; i++) {
			let randomIndex;
			do {
				randomIndex = Math.floor(Math.random() * events.length);
			} while (usedIndices.has(randomIndex));

			usedIndices.add(randomIndex);
			const eventLocation = events[randomIndex].location;
			if (eventLocation && typeof eventLocation === 'object') {
				centroids.push({
					latitude: eventLocation.latitude,
					longitude: eventLocation.longitude,
					address: eventLocation.address,
				});
			}
		}

		return centroids;
	}

	private static assignEventsToCentroids(events: SidebarEvent[], centroids: LocationData[]): Cluster[] {
		const clusters: Cluster[] = centroids.map((centroid, index) => ({
			id: `cluster_${index}`,
			events: [],
			center: centroid,
			radius: 0,
		}));

		for (const event of events) {
			let closestClusterIndex = 0;
			let minDistance = Infinity;

			for (let i = 0; i < centroids.length; i++) {
				const distance = this.calculateHaversineDistance(
					(event.location as LocationData).latitude,
					(event.location as LocationData).longitude,
					centroids[i].latitude,
					centroids[i].longitude
				);
				if (distance < minDistance) {
					minDistance = distance;
					closestClusterIndex = i;
				}
			}

			clusters[closestClusterIndex].events.push(event);
		}

		return clusters;
	}

	private static updateCentroids(clusters: Cluster[]): LocationData[] {
		return clusters.map((cluster) => this.calculateCentroid(cluster.events));
	}

	private static hasConverged(
		oldCentroids: LocationData[],
		newCentroids: LocationData[],
		tolerance: number
	): boolean {
		for (let i = 0; i < oldCentroids.length; i++) {
			const distance = this.calculateHaversineDistance(
				oldCentroids[i].latitude,
				oldCentroids[i].longitude,
				newCentroids[i].latitude,
				newCentroids[i].longitude
			);
			if (distance > tolerance) {
				return false;
			}
		}
		return true;
	}

	private static getNeighbors(
		event: SidebarEvent,
		events: SidebarEvent[],
		eps: number,
		distanceResults?: Map<string, any>
	): SidebarEvent[] {
		return events.filter((otherEvent) => {
			if (otherEvent.id === event.id) return false;
			const distance = this.getDistanceBetweenEvents(event, otherEvent, distanceResults);
			return distance <= eps;
		});
	}

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
		distanceResults?: Map<string, any>
	): number {
		// Use the distance between cluster centers
		return this.calculateHaversineDistance(
			cluster1.center.latitude,
			cluster1.center.longitude,
			cluster2.center.latitude,
			cluster2.center.longitude
		);
	}

	private static getDistanceBetweenEvents(
		event1: SidebarEvent,
		event2: SidebarEvent,
		distanceResults?: Map<string, any>
	): number {
		// Try to use cached distance results first
		if (distanceResults) {
			// This would need to be implemented based on your distance key format
			// For now, fall back to Haversine distance
		}

		// Fall back to Haversine distance
		const location1 = event1.location as LocationData;
		const location2 = event2.location as LocationData;
		return this.calculateHaversineDistance(
			location1.latitude,
			location1.longitude,
			location2.latitude,
			location2.longitude
		);
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
