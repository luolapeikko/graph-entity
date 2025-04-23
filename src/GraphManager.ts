import {EventEmitter} from 'events';
import type {GraphEdgeStructure, GraphManagerEventMapping, GraphStructure, IGraphEntityNode, IGraphManager} from '@luolapeikko/graph-entity-types';

/**
 * GraphManager is a local graph class that manages a graph of nodes and edges. It allows adding, removing, and querying nodes and edges.
 * @example
 * const graphManager = new GraphManager<ExpressNode | NodeJSNode>();
 * @template Entity The type of the nodes in the graph. It should extend IGraphEntityNode.
 * @fires graphUpdate event when the graph is updated
 * @fires nodeUpdate event when a node is updated
 * @fires nodeRemove event when a node is removed
 * @fires edgeAdd event when an edge is added
 * @fires edgeRemove event when an edge is removed
 * @since v0.0.1
 */
export class GraphManager<Entity extends IGraphEntityNode<number, Record<string, unknown>>>
	extends EventEmitter<GraphManagerEventMapping<Entity>>
	implements IGraphManager<Entity>
{
	private sourceLinkIndex = new Map<Entity, Set<Entity>>();
	private targetLinkIndex = new Map<Entity, Set<Entity>>();
	private nodeTypeIndex = new Map<Entity['nodeType'], Set<Entity>>();
	private nodes = new Map<string, Entity>();
	private eventCallbacks = new Map<Entity, () => void>();

	/**
	 * Add a node to the graph. If the node already exists, it will be updated.
	 * @example
	 * graphManager.addNode(nodeJs);
	 * @param {Entity} node The node to add to the graph
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the node was added or updated, false if it already existed
	 * @fires nodeUpdated event if the node was added or updated
	 */
	public addNode(node: Entity, emitGraphUpdate = true) {
		return this.handleAddNode(node, emitGraphUpdate);
	}

	/**
	 * Removes a node from the graph. If the node does not exist, it will be ignored.
	 * @example
	 * graphManager.removeNode(mongooseService);
	 * @param {Entity} node The node to remove from the graph.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the node was removed, false if it did not exist.
	 * @fires nodeRemoved event if the node was removed
	 */
	public removeNode(node: Entity, emitGraphUpdate = true) {
		return this.handleRemoveNode(node, true, emitGraphUpdate);
	}

	/**
	 * Adds an edge between two nodes. If either node does not exist, it will be added to the graph.
	 * @example
	 * graphManager.addEdge(nodeJs, expressService);
	 * @param {Entity} source The source node of the edge.
	 * @param {Entity} target The target node of the edge.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the edge was added, false if it already existed.
	 * @fires edgeAdded event if the edge was added
	 * @fires nodeUpdated event if the source or target node was added
	 */
	public addEdge(source: Entity, target: Entity, emitGraphUpdate = true) {
		let isAdded = false;
		isAdded = this.addNode(source, emitGraphUpdate) || isAdded;
		isAdded = this.addNode(target, emitGraphUpdate) || isAdded;
		isAdded = this.addSourceLink(source, target) || isAdded;
		isAdded = this.addTargetLink(source, target) || isAdded;
		if (isAdded) {
			this.emit('edgeAdd', source, target);
			if (emitGraphUpdate) {
				this.emit('graphUpdate');
			}
		}
		return isAdded;
	}

	/**
	 * Adds edges between two sets of nodes. If either node does not exist, it will be added to the graph.
	 * @example
	 * graphManager.addEdges([nodeJs], [expressService, mongooseService]);
	 * @param {Iterable<Entity>} source The source nodes of the edges.
	 * @param {Iterable<Entity>} target The target nodes of the edges.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if any edge was added, false if none were added.
	 * @fires nodeAdded event if any source or target node was added
	 * @fires edgeAdded event if any edge was added
	 * @fires graphUpdate event if any edge was added
	 */
	public addEdges(source: Iterable<Entity>, target: Iterable<Entity>, emitGraphUpdate = true) {
		let isAdded = false;
		for (const sourceNode of source) {
			for (const targetNode of target) {
				isAdded = this.addEdge(sourceNode, targetNode, false) || isAdded;
			}
		}
		if (emitGraphUpdate && isAdded) {
			this.emit('graphUpdate');
		}
		return isAdded;
	}

	/**
	 * Removes an edge between two nodes. If either node does not exist, it will be removed from the graph.
	 * @example
	 * graphManager.removeEdge(nodeJs, expressService);
	 * @param {Entity} source The source node of the edge.
	 * @param {Entity} target The target node of the edge.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the edge was removed, false if it did not exist.
	 * @fires edgeRemoved event if the edge was removed
	 */
	public removeEdge(source: Entity, target: Entity, emitGraphUpdate = true) {
		let isRemoved = false;
		isRemoved = this.removeSourceLink(source, target) || isRemoved;
		isRemoved = this.removeTargetLink(source, target) || isRemoved;
		if (isRemoved) {
			this.emit('edgeRemove', source, target);
			if (emitGraphUpdate) {
				this.emit('graphUpdate');
			}
		}
		return isRemoved;
	}

	/**
	 * Removes an edge between two nodes. If either node does not exist, it will be removed from the graph.
	 * @example
	 * graphManager.removeEdges([nodeJs], [expressService, mongooseService]);
	 * @param {Iterable<Entity>} source The source nodes of the edges.
	 * @param {Iterable<Entity>} target The target nodes of the edges.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if any edge was removed, false if none were removed.
	 * @fires edgeRemoved event if any edge was removed
	 * @fires graphUpdate event if any edge was removed
	 */
	public removeEdges(source: Iterable<Entity>, target: Iterable<Entity>, emitGraphUpdate = true) {
		let isRemoved = false;
		for (const sourceNode of source) {
			for (const targetNode of target) {
				isRemoved = this.removeEdge(sourceNode, targetNode, false) || isRemoved;
			}
		}
		if (emitGraphUpdate && isRemoved) {
			this.emit('graphUpdate');
		}
		return isRemoved;
	}

	/**
	 * Get current node targets (children links).
	 * @param {Entity} node The node to get targets for.
	 * @returns {Iterable<Entity>} list of target nodes
	 */
	public getTargets(node: Entity) {
		return this.targetLinkIndex.get(node)?.values() ?? [];
	}

	/**
	 * Get current node sources (parent links).
	 * @param {Entity} node The node to get sources for.
	 * @returns {Iterable<Entity>} list of source nodes
	 */
	public getSources(node: Entity) {
		return this.sourceLinkIndex.get(node)?.values() ?? [];
	}

	/**
	 * Get all nodes in the graph.
	 * @returns {Iterable<Entity>} list of all nodes
	 */
	public getAllNodes() {
		return this.nodes.values();
	}

	/**
	 * Get a node by its ID.
	 * @param {string} id The ID of the node to get.
	 * @returns {Entity | undefined} The node with the specified ID, or undefined if it does not exist.
	 */
	public getNodeById(id: string) {
		return this.nodes.get(id);
	}

	/**
	 * Get all nodes of a specific type.
	 * @template T The type of the node to get.
	 * @param {T} nodeType The type of the node to get.
	 * @returns {Iterable<Extract<Entity, {nodeType: T}>>} An iterable of nodes of the specified type.
	 */
	public getNodesByType<T extends Entity['nodeType']>(nodeType: T) {
		return (this.nodeTypeIndex.get(nodeType)?.values() ?? []) as Iterable<Extract<Entity, {nodeType: T}>>;
	}

	/**
	 * Count the number of edges all source link nodes have.
	 * @returns {number} The number of edges all source link nodes have.
	 */
	public getSourceEdgeCount() {
		return Array.from(this.sourceLinkIndex.values()).reduce((acc, sources) => acc + sources.size, 0);
	}

	/**
	 * Count the number of edges all target link nodes have.
	 * @returns {number} The number of edges all target link nodes have.
	 */
	public getTargetEdgeCount() {
		return Array.from(this.targetLinkIndex.values()).reduce((acc, targets) => acc + targets.size, 0);
	}

	/**
	 * Builds the target structure of the graph starting from a given node.
	 * @param {Entity} node starting node
	 * @param {number} targetDepth The maximum target depth to traverse the graph. Default is 10.
	 * @param {number} sourceDepth The maximum source depth to traverse the graph. Default is -1.
	 * @returns {Promise<GraphStructure>} A promise that resolves to the structure of the graph starting from the given node.
	 */
	public async getNodeStructure(node: Entity, targetDepth = 10, sourceDepth = -1) {
		return this.handleNodeStructure(node, targetDepth, sourceDepth);
	}

	/**
	 * Retrieves the edge structure of a node, including its sources and targets.
	 * This method constructs a recursive representation of the edges connected to a given node,
	 * capturing both incoming and outgoing connections in a graph.
	 * @param {Entity} node The node for which to retrieve the edge structure.
	 * @returns {GraphEdgeStructure} The structure detailing the node's edges, with references
	 * to both source and target nodes.
	 */
	public getEdgeStructure(node: Entity) {
		return this.handleEdgeStructure(node);
	}

	public handleEdgeStructure(node: Entity, seen = new Set<Entity>()) {
		seen.add(node); // prevent circular references
		const targetArray = Array.from(this.getTargets(node)).filter((target) => !seen.has(target));
		const sourceArray = Array.from(this.getSources(node)).filter((source) => !seen.has(source));
		const data: GraphEdgeStructure = {
			id: node.getNodeId(),
		};
		if (targetArray.length > 0) {
			data.targets = targetArray.map((target) => this.handleEdgeStructure(target, seen));
		}
		if (sourceArray.length > 0) {
			data.sources = sourceArray.map((source) => this.handleEdgeStructure(source, seen));
		}
		return data;
	}

	private async handleNodeStructure(node: Entity, targetDepth: number, sourceDepth: number, seen = new Set<Entity>()): Promise<GraphStructure<Entity>> {
		seen.add(node); // prevent circular references
		const targetArray = Array.from(this.getTargets(node)).filter((target) => !seen.has(target));
		const sourceArray = Array.from(this.getSources(node)).filter((source) => !seen.has(source));
		const data = {
			type: node.nodeType,
			id: node.getNodeId(),
			props: await node.getNodeProps(),
		} as GraphStructure<Entity>;
		if (targetDepth >= 0 && targetArray.length > 0) {
			data.targets = await Promise.all(targetArray.map((target) => this.handleNodeStructure(target, targetDepth - 1, sourceDepth, seen)));
		}
		if (sourceDepth >= 0 && sourceArray.length > 0) {
			data.sources = await Promise.all(sourceArray.map((source) => this.handleNodeStructure(source, targetDepth, sourceDepth - 1, seen)));
		}
		return data;
	}

	private handleAddNode(node: Entity, emitGraphUpdate = true) {
		const id = node.getNodeId();
		let nodeTypeSet = this.nodeTypeIndex.get(node.nodeType);
		if (!nodeTypeSet) {
			nodeTypeSet = new Set();
			this.nodeTypeIndex.set(node.nodeType, nodeTypeSet);
		}

		const currentNode = this.nodes.get(id);
		if (!currentNode || currentNode !== node) {
			if (currentNode) {
				nodeTypeSet.delete(currentNode);
				this.handleRemoveNode(currentNode, false, false); // don't emit remove event as we are replacing it
			}
			nodeTypeSet.add(node);
			this.nodes.set(node.getNodeId(), node);
			this.emit('nodeUpdate', node);
			if (emitGraphUpdate) {
				this.emit('graphUpdate');
			}
			if ('addListener' in node) {
				// create a new event listener for the node and store it in the map
				const eventCallback = () => {
					this.emit('nodeUpdate', node);
					this.emit('graphUpdate');
				};
				this.eventCallbacks.set(node, eventCallback);
				node.addListener('nodeUpdated', eventCallback);
			}
			return true;
		}
		return false;
	}

	private handleRemoveNode(node: Entity, emitNodeRemove = true, emitGraphUpdate = true) {
		// Remove the node from the source and target link indices
		for (const source of this.getSources(node)) {
			this.removeEdge(source, node);
		}
		for (const target of this.getTargets(node)) {
			this.removeEdge(node, target);
		}
		// Remove the node from the node type index
		this.nodeTypeIndex.get(node.nodeType)?.delete(node);
		// Remove the node from the nodes map
		if (this.nodes.delete(node.getNodeId())) {
			const eventCallback = this.eventCallbacks.get(node);
			// Remove the event listener if it exists
			if (eventCallback && 'removeListener' in node) {
				node.removeListener('nodeUpdated', eventCallback);
			}
			this.eventCallbacks.delete(node);
			if (emitNodeRemove) {
				this.emit('nodeRemove', node);
			}
			if (emitGraphUpdate) {
				this.emit('graphUpdate');
			}
			return true;
		}
		return false;
	}

	private addSourceLink(source: Entity, parent: Entity) {
		let sourceLink = this.sourceLinkIndex.get(parent);
		if (!sourceLink) {
			sourceLink = new Set();
			this.sourceLinkIndex.set(parent, sourceLink);
		}
		if (!sourceLink.has(source)) {
			sourceLink.add(source);
			return true;
		}
		return false;
	}

	private removeSourceLink(source: Entity, parent: Entity) {
		const sourceLink = this.sourceLinkIndex.get(parent);
		if (sourceLink?.has(source)) {
			sourceLink.delete(source);
			return true;
		}
		return false;
	}

	private addTargetLink(parent: Entity, child: Entity) {
		let targetLink = this.targetLinkIndex.get(parent);
		if (!targetLink) {
			targetLink = new Set();
			this.targetLinkIndex.set(parent, targetLink);
		}
		if (!targetLink.has(child)) {
			targetLink.add(child);
			return true;
		}
		return false;
	}

	private removeTargetLink(parent: Entity, child: Entity) {
		const targetLink = this.targetLinkIndex.get(parent);
		if (targetLink?.has(child)) {
			targetLink.delete(child);
			return true;
		}
		return false;
	}
}
