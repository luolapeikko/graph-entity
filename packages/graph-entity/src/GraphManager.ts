import type {
	GraphEdge,
	GraphEdgeStructure,
	GraphManagerEventMapping,
	GraphNodeConstructor,
	GraphStructure,
	IGraphEntityNode,
	IGraphManager,
} from '@luolapeikko/graph-entity-types';
import {EventEmitter} from 'events';

/**
 * Static automatic edge mapping type for GraphManager constructor. It allows defining a set of node ID pairs that should be automatically connected with edges when they are added to the graph.
 */
export type GraphAutomaticEdgeMapping<AnyEntity extends IGraphEntityNode<string, number, Record<string, unknown>>> = [
	AnyEntity['nodeId'],
	AnyEntity['nodeId'],
][];

/**
 * GraphManager is a local graph class that manages a graph of nodes and edges. It allows adding, removing, and querying nodes and edges.
 * @example
 * const graphManager = new GraphManager<ExpressNode | NodeJSNode>();
 * @template AnyEntity Optional generic type for any strict Node types.
 * @fires graphUpdate event when the graph is updated
 * @fires nodeUpdate event when a node is updated
 * @fires nodeRemove event when a node is removed
 * @fires edgeAdd event when an edge is added
 * @fires edgeRemove event when an edge is removed
 * @since v0.0.1
 */
export class GraphManager<
		AnyEntity extends IGraphEntityNode<string, number, Record<string, unknown>> = IGraphEntityNode<string, number, Record<string, unknown>>,
	>
	extends EventEmitter<GraphManagerEventMapping<AnyEntity>>
	implements IGraphManager<AnyEntity>
{
	private sourceLinkIndex = new Map<AnyEntity, Set<AnyEntity>>();
	private targetLinkIndex = new Map<AnyEntity, Set<AnyEntity>>();
	private nodeTypeIndex = new Map<AnyEntity['nodeType'], Set<AnyEntity>>();
	private nodes = new Map<string, AnyEntity>();
	private eventCallbacks = new Map<AnyEntity, () => void>();
	private autoMap: Map<AnyEntity['nodeId'], AnyEntity['nodeId']> = new Map();

	public constructor(autoMap?: GraphAutomaticEdgeMapping<AnyEntity>) {
		super();
		if (autoMap) {
			for (const [sourceId, targetId] of autoMap) {
				// dot not add mapping if source and target ids are the same to prevent self loops.
				if (sourceId !== targetId) {
					this.autoMap.set(sourceId, targetId);
					this.autoMap.set(targetId, sourceId); // add reverse mapping for easy lookup
				}
			}
		}
	}

	/**
	 * Add a node to the graph. If the node already exists, it will be updated.
	 * @example
	 * graphManager.addNode(nodeJs);
	 * @param {AnyEntity} node The node to add to the graph
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the node was added or updated, false if it already existed
	 * @fires nodeUpdated event if the node was added or updated
	 */
	public addNode(node: AnyEntity, emitGraphUpdate = true): boolean {
		return this.handleAddNode(node, emitGraphUpdate);
	}

	public async createNode<C extends GraphNodeConstructor<AnyEntity>>(Constructor: C, ...args: ConstructorParameters<C>): Promise<InstanceType<C>> {
		const node = new Constructor(...args);
		this.addNode(node, true);
		this.emit('nodeCreated', node);
		await node.onInit?.();
		return node as InstanceType<C>;
	}

	/**
	 * Removes a node from the graph. If the node does not exist, it will be ignored.
	 * @example
	 * graphManager.removeNode(mongooseService);
	 * @param {AnyEntity} node The node to remove from the graph.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the node was removed, false if it did not exist.
	 * @fires nodeRemoved event if the node was removed
	 */
	public async removeNode(node: AnyEntity, emitGraphUpdate = true): Promise<boolean> {
		await node.onRemove?.();
		return this.handleRemoveNode(node, true, emitGraphUpdate);
	}

	/**
	 * Adds an edge between two nodes. If either node does not exist, it will be added to the graph.
	 * @example
	 * graphManager.addEdge(nodeJs, expressService);
	 * @param {AnyEntity} source The source node of the edge.
	 * @param {AnyEntity} target The target node of the edge.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the edge was added, false if it already existed.
	 * @fires edgeAdded event if the edge was added
	 * @fires nodeUpdated event if the source or target node was added
	 */
	public addEdge(source: AnyEntity, target: AnyEntity, emitGraphUpdate = true): boolean {
		let isAdded = false;
		isAdded = this.addNode(source, emitGraphUpdate) || isAdded;
		isAdded = this.addNode(target, emitGraphUpdate) || isAdded;
		isAdded = this.addSourceLink(source, target) || isAdded;
		isAdded = this.addTargetLink(source, target) || isAdded;
		if (isAdded) {
			this.emit('edgeAdd', {source, target});
			if (emitGraphUpdate) {
				this.emit('graphUpdate');
			}
		}
		return isAdded;
	}

	public addEdgeWithId(sourceId: AnyEntity['nodeId'], targetId: AnyEntity['nodeId'], emitGraphUpdate = true): boolean {
		const sourceNode = this.getNodeById(sourceId);
		const targetNode = this.getNodeById(targetId);
		if (!sourceNode || !targetNode) {
			throw new Error(`Cannot add edge with non-existent node(s): ${!sourceNode ? sourceId : ''} ${!targetNode ? targetId : ''}`);
		}
		return this.addEdge(sourceNode, targetNode, emitGraphUpdate);
	}

	public removeEdgeWithId(sourceId: AnyEntity['nodeId'], targetId: AnyEntity['nodeId'], emitGraphUpdate = true): boolean {
		const sourceNode = this.getNodeById(sourceId);
		const targetNode = this.getNodeById(targetId);
		if (!sourceNode || !targetNode) {
			return false; // if either node doesn't exist, we can consider the edge as already removed
		}
		return this.removeEdge(sourceNode, targetNode, emitGraphUpdate);
	}

	/**
	 * Adds edges between two sets of nodes. If either node does not exist, it will be added to the graph.
	 * @example
	 * graphManager.addEdges([nodeJs], [expressService, mongooseService]);
	 * @param {Iterable<AnyEntity>} source The source nodes of the edges.
	 * @param {Iterable<AnyEntity>} target The target nodes of the edges.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if any edge was added, false if none were added.
	 * @fires nodeAdded event if any source or target node was added
	 * @fires edgeAdded event if any edge was added
	 * @fires graphUpdate event if any edge was added
	 */
	public addEdges(source: Iterable<AnyEntity>, target: Iterable<AnyEntity>, emitGraphUpdate = true): boolean {
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
	 * @param {AnyEntity} source The source node of the edge.
	 * @param {AnyEntity} target The target node of the edge.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if the edge was removed, false if it did not exist.
	 * @fires edgeRemoved event if the edge was removed
	 */
	public removeEdge(source: AnyEntity, target: AnyEntity, emitGraphUpdate = true): boolean {
		let isRemoved = false;
		isRemoved = this.removeSourceLink(source, target) || isRemoved;
		isRemoved = this.removeTargetLink(source, target) || isRemoved;
		if (isRemoved) {
			this.emit('edgeRemove', {source, target});
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
	 * @param {Iterable<AnyEntity>} source The source nodes of the edges.
	 * @param {Iterable<AnyEntity>} target The target nodes of the edges.
	 * @param {boolean} emitGraphUpdate Whether to emit the "graphUpdate" event. Default is true.
	 * @returns {boolean} True if any edge was removed, false if none were removed.
	 * @fires edgeRemoved event if any edge was removed
	 * @fires graphUpdate event if any edge was removed
	 */
	public removeEdges(source: Iterable<AnyEntity>, target: Iterable<AnyEntity>, emitGraphUpdate = true): boolean {
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
	 * @param {AnyEntity} node The node to get targets for.
	 * @returns {Iterable<AnyEntity>} list of target nodes
	 */
	public getTargets(node: AnyEntity): SetIterator<AnyEntity> | never[] {
		return this.targetLinkIndex.get(node)?.values() ?? [];
	}

	/**
	 * Get current node sources (parent links).
	 * @param {AnyEntity} node The node to get sources for.
	 * @returns {Iterable<AnyEntity>} list of source nodes
	 */
	public getSources(node: AnyEntity): SetIterator<AnyEntity> | never[] {
		return this.sourceLinkIndex.get(node)?.values() ?? [];
	}

	public getAllNodes(): Iterable<AnyEntity> {
		return this.nodes.values();
	}

	public getAllEdges(): Iterable<GraphEdge<AnyEntity>> {
		let edges: GraphEdge<AnyEntity>[] = [];
		// extract all edges from target link index
		for (const [source, targets] of this.targetLinkIndex.entries()) {
			edges = Array.from(targets).reduce((acc, target) => {
				acc.push({source, target});
				return acc;
			}, edges);
		}
		return edges;
	}

	/**
	 * Get a node by its ID.
	 * @param {string} id The ID of the node to get.
	 * @returns {AnyEntity | undefined} The node with the specified ID, or undefined if it does not exist.
	 */
	public getNodeById(id: string): AnyEntity | undefined {
		return this.nodes.get(id);
	}

	/**
	 * Get all nodes of a specific type.
	 * @template T The type of the node to get.
	 * @param {T} nodeType The type of the node to get.
	 * @returns {Iterable<Extract<AnyEntity, {nodeType: T}>>} An iterable of nodes of the specified type.
	 */
	public getNodesByType<T extends AnyEntity['nodeType']>(nodeType: T) {
		return (this.nodeTypeIndex.get(nodeType)?.values() ?? []) as Iterable<Extract<AnyEntity, {nodeType: T}>>;
	}

	/**
	 * Count the number of edges all source link nodes have.
	 * @returns {number} The number of edges all source link nodes have.
	 */
	public getSourceEdgeCount(): number {
		return Array.from(this.sourceLinkIndex.values()).reduce((acc, sources) => acc + sources.size, 0);
	}

	/**
	 * Count the number of edges all target link nodes have.
	 * @returns {number} The number of edges all target link nodes have.
	 */
	public getTargetEdgeCount(): number {
		return Array.from(this.targetLinkIndex.values()).reduce((acc, targets) => acc + targets.size, 0);
	}

	/**
	 * Builds the target structure of the graph starting from a given node.
	 * @param {AnyEntity} node starting node
	 * @param {number} targetDepth The maximum target depth to traverse the graph. Default is 10.
	 * @param {number} sourceDepth The maximum source depth to traverse the graph. Default is -1.
	 * @returns {Promise<GraphStructure>} A promise that resolves to the structure of the graph starting from the given node.
	 */
	public getNodeStructure(node: AnyEntity, targetDepth = 10, sourceDepth = -1): Promise<GraphStructure<AnyEntity>> {
		return this.handleNodeStructure(node, targetDepth, sourceDepth);
	}

	/**
	 * Retrieves the edge structure of a node, including its sources and targets.
	 * This method constructs a recursive representation of the edges connected to a given node,
	 * capturing both incoming and outgoing connections in a graph.
	 * @param {AnyEntity} node The node for which to retrieve the edge structure.
	 * @returns {GraphEdgeStructure} The structure detailing the node's edges, with references
	 * to both source and target nodes.
	 */
	public getEdgeStructure(node: AnyEntity): GraphEdgeStructure {
		return this.handleEdgeStructure(node);
	}

	public handleEdgeStructure(node: AnyEntity, seen: Set<AnyEntity> = new Set()): GraphEdgeStructure {
		seen.add(node); // prevent circular references
		const targetArray = Array.from(this.getTargets(node)).filter((target) => !seen.has(target));
		const sourceArray = Array.from(this.getSources(node)).filter((source) => !seen.has(source));
		const data: GraphEdgeStructure = {
			id: node.nodeId,
		};
		if (targetArray.length > 0) {
			data.targets = targetArray.map((target) => this.handleEdgeStructure(target, seen));
		}
		if (sourceArray.length > 0) {
			data.sources = sourceArray.map((source) => this.handleEdgeStructure(source, seen));
		}
		return data;
	}

	private async handleNodeStructure(
		node: AnyEntity,
		targetDepth: number,
		sourceDepth: number,
		seen: Set<AnyEntity> = new Set(),
	): Promise<GraphStructure<AnyEntity>> {
		seen.add(node); // prevent circular references
		const targetArray = Array.from(this.getTargets(node)).filter((target) => !seen.has(target));
		const sourceArray = Array.from(this.getSources(node)).filter((source) => !seen.has(source));
		const data = {
			id: node.nodeId,
			props: await node.getNodeProps(),
			type: node.nodeType,
		} as GraphStructure<AnyEntity>;
		if (targetDepth >= 0 && targetArray.length > 0) {
			data.targets = await Promise.all(targetArray.map((target) => this.handleNodeStructure(target, targetDepth - 1, sourceDepth, seen)));
		}
		if (sourceDepth >= 0 && sourceArray.length > 0) {
			data.sources = await Promise.all(sourceArray.map((source) => this.handleNodeStructure(source, targetDepth, sourceDepth - 1, seen)));
		}
		return data;
	}

	private handleAddNode(node: AnyEntity, emitGraphUpdate = true): boolean {
		let nodeTypeSet = this.nodeTypeIndex.get(node.nodeType);
		if (!nodeTypeSet) {
			nodeTypeSet = new Set();
			this.nodeTypeIndex.set(node.nodeType, nodeTypeSet);
		}

		const currentNode = this.nodes.get(node.nodeId);
		if (!currentNode || currentNode !== node) {
			if (currentNode) {
				nodeTypeSet.delete(currentNode);
				this.handleRemoveNode(currentNode, false, false); // don't emit remove event as we are replacing it
			}
			nodeTypeSet.add(node);
			this.nodes.set(node.nodeId, node);
			this.emit('nodeUpdated', node);
			if (emitGraphUpdate) {
				this.emit('graphUpdate');
			}
			if ('addListener' in node) {
				// create a new event listener for the node and store it in the map
				const eventCallback = () => {
					this.emit('nodeUpdated', node);
					this.emit('graphUpdate');
				};
				this.eventCallbacks.set(node, eventCallback);
				node.addListener('nodeUpdated', eventCallback);
			}
			// Check for automatic edge mapping and add edges if necessary
			this.automaticEdgeMapping(node, emitGraphUpdate);
			return true;
		}
		return false;
	}

	private automaticEdgeMapping(target: AnyEntity, emitGraphUpdate = true): void {
		const sourceId = this.autoMap.get(target.nodeId);
		if (sourceId) {
			const source = this.getNodeById(sourceId);
			if (source) {
				this.addEdge(source, target, emitGraphUpdate);
			}
		}
	}

	private handleRemoveNode(node: AnyEntity, emitNodeRemove = true, emitGraphUpdate = true): boolean {
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
		if (this.nodes.delete(node.nodeId)) {
			const eventCallback = this.eventCallbacks.get(node);
			// Remove the event listener if it exists
			if (eventCallback && 'removeListener' in node) {
				node.removeListener('nodeUpdated', eventCallback);
			}
			this.eventCallbacks.delete(node);
			if (emitNodeRemove) {
				this.emit('nodeRemoved', node);
			}
			if (emitGraphUpdate) {
				this.emit('graphUpdate');
			}
			return true;
		}
		return false;
	}

	private addSourceLink(source: AnyEntity, parent: AnyEntity): boolean {
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

	private removeSourceLink(source: AnyEntity, parent: AnyEntity) {
		const sourceLink = this.sourceLinkIndex.get(parent);
		if (sourceLink?.has(source)) {
			sourceLink.delete(source);
			return true;
		}
		return false;
	}

	private addTargetLink(parent: AnyEntity, child: AnyEntity): boolean {
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

	private removeTargetLink(parent: AnyEntity, child: AnyEntity) {
		const targetLink = this.targetLinkIndex.get(parent);
		if (targetLink?.has(child)) {
			targetLink.delete(child);
			return true;
		}
		return false;
	}
}
