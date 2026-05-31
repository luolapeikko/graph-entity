import type {EventEmitter} from 'events';
import type {GraphEdge} from './Edge';
import type {GraphNodeConstructor, IGraphBaseEntityNode, IGraphEntityNode} from './Node';

/**
 * Graph manager event mapping.
 * @template AnyEntity The type of the any nodes in the graph.
 * @since v0.1.0
 */
export type GraphManagerEventMapping<AnyEntity extends IGraphEntityNode<string, number, Record<string, unknown>>> = {
	graphUpdate: []; // any update to the graph (node or edge)
	nodeCreated: [AnyEntity];
	nodeUpdated: [AnyEntity];
	nodeRemoved: [AnyEntity];
	edgeAdd: [GraphEdge<AnyEntity>];
	edgeRemove: [GraphEdge<AnyEntity>];
};

/**
 * Hierarchy structure of a node in the graph.
 * @template AnyEntity The type of the any nodes in the graph.
 * @since v0.0.2
 */
export type GraphStructure<AnyEntity extends IGraphBaseEntityNode<string, number, Record<string, unknown>>> =
	AnyEntity extends IGraphBaseEntityNode<infer Id, infer Type, infer Props>
		? {id: Id; type: Type; props: Props; targets?: GraphStructure<AnyEntity>[]; sources?: GraphStructure<AnyEntity>[]}
		: never;

/**
 * Graph link structure for a node id's in the graph.
 * @since v0.0.4
 */
export type GraphEdgeStructure = {
	id: string;
	targets?: GraphEdgeStructure[];
	sources?: GraphEdgeStructure[];
};

/**
 * Generic interface for a graph manager which can add, remove, and update nodes and edges in a graph. (supports async operations for bigger implementations)
 * @template AnyEntity The type of the any nodes in the graph.
 * @since v0.1.0
 */
export interface IGraphManager<AnyEntity extends IGraphEntityNode<string, number, Record<string, unknown>>>
	extends EventEmitter<GraphManagerEventMapping<AnyEntity>> {
	/**
	 * Adds a node to the graph. If the node already exists, it will be updated.
	 * @param {AnyEntity} node The node to add to the graph
	 * @returns {boolean | Promise<boolean>} True if the node was added or updated, false if it already existed
	 */
	addNode(node: AnyEntity): boolean | Promise<boolean>;

	/**
	 * Creates, adds and initializes a node in the graph using the provided constructor and arguments.
	 * @param Constructor The constructor of the node to create.
	 * @param args The arguments to pass to the constructor.
	 * @returns {InstanceType<C> | Promise<InstanceType<C>>} The created node.
	 */
	createNode<C extends GraphNodeConstructor<AnyEntity>>(Constructor: C, ...args: ConstructorParameters<C>): InstanceType<C> | Promise<InstanceType<C>>;

	/**
	 * Removes a node from the graph. If the node does not exist, it will be ignored.
	 * @param {AnyEntity} node The node to remove from the graph.
	 * @returns {boolean | Promise<boolean>} True if the node was removed, false if it did not exist.
	 */
	removeNode(node: AnyEntity): boolean | Promise<boolean>;

	/**
	 * Adds an edge between two nodes. If either node does not exist, it will be added to the graph.
	 * @param {AnyEntity} source The source node of the edge.
	 * @param {AnyEntity} target The target node of the edge.
	 * @returns {boolean | Promise<boolean>} True if the edge was added, false if it already existed.
	 */
	addEdge(source: AnyEntity, target: AnyEntity): boolean | Promise<boolean>;
	/**
	 * Removes an edge between two nodes. If either node does not exist, it will be removed from the graph.
	 * @param {AnyEntity} source The source node of the edge.
	 * @param {AnyEntity} target The target node of the edge.
	 * @returns {boolean | Promise<boolean>} True if the edge was removed, false if it did not exist.
	 */
	removeEdge(source: AnyEntity, target: AnyEntity): boolean | Promise<boolean>;

	/**
	 * Adds an edge between two nodes by their IDs. If either node does not exist, an error will be thrown.
	 * @param sourceId
	 * @param targetId
	 */
	addEdgeWithId(sourceId: AnyEntity['nodeId'], targetId: AnyEntity['nodeId']): boolean | Promise<boolean>;

	/**
	 * Removes a node and all its edges from the graph. If the node does not exist, it will be ignored.
	 * @param sourceId
	 * @param targetId
	 */
	removeEdgeWithId(sourceId: AnyEntity['nodeId'], targetId: AnyEntity['nodeId']): boolean | Promise<boolean>;

	/**
	 * Get current node targets (children links).
	 * @param {AnyEntity} node The node to get targets for.
	 * @returns {Iterable<AnyEntity> | AsyncIterable<AnyEntity>} list of target nodes
	 */
	getTargets(node: AnyEntity): Iterable<AnyEntity> | AsyncIterable<AnyEntity>;

	/**
	 * Get current node sources (parent links).
	 * @param {AnyEntity} node The node to get sources for.
	 * @returns {Iterable<AnyEntity> | AsyncIterable<AnyEntity>} list of source nodes
	 */
	getSources(node: AnyEntity): Iterable<AnyEntity> | AsyncIterable<AnyEntity>;

	/**
	 * Get current node targets count (children links).
	 * @param {AnyEntity} node The node to get targets for.
	 * @returns {number | Promise<number>} count of target nodes
	 */
	getTargetEdgeCount(node: AnyEntity): number | Promise<number>;

	/**
	 * Get current node sources count (parent links).
	 * @param {AnyEntity} node The node to get sources for.
	 * @returns {number | Promise<number>} count of source nodes
	 */
	getSourceEdgeCount(node: AnyEntity): number | Promise<number>;

	/**
	 * Get all nodes in the graph.
	 * @returns {Iterable<AnyEntity> | AsyncIterable<AnyEntity>} list of all nodes
	 */
	getAllNodes(): Iterable<AnyEntity> | AsyncIterable<AnyEntity>;

	/**
	 * Get all edges in the graph.
	 * @returns {Iterable<GraphEdge<AnyEntity>> | AsyncIterable<GraphEdge<AnyEntity>>} list of all edges
	 */
	getAllEdges(): Iterable<GraphEdge<AnyEntity>> | AsyncIterable<GraphEdge<AnyEntity>>;

	/**
	 * Get all nodes of a specific type.
	 * @template T The type of the node to get.
	 * @param {T} nodeType The type of the node to get.
	 * @returns {Iterable<Extract<AnyEntity, {nodeType: T}>> | AsyncIterable<Extract<AnyEntity, {nodeType: T}>>} An iterable of nodes of the specified type.
	 */
	getNodesByType<T extends AnyEntity['nodeType']>(nodeType: T): Iterable<Extract<AnyEntity, {nodeType: T}>> | AsyncIterable<Extract<AnyEntity, {nodeType: T}>>;

	/**
	 * Get a node by its ID.
	 * @param {string} id The ID of the node to get.
	 * @returns {AnyEntity | undefined | Promise<AnyEntity | undefined>} The node with the specified ID, or undefined if it does not exist.
	 */
	getNodeById(id: string): AnyEntity | undefined | Promise<AnyEntity | undefined>;

	/**
	 * Get the structure of a node, including its properties and targets.
	 * @param {AnyEntity} node The node to get the structure for.
	 * @returns {Promise<GraphStructure<AnyEntity>>} The structure of the node.
	 */
	getNodeStructure(node: AnyEntity): Promise<GraphStructure<AnyEntity>>;

	/**
	 * Get hierarchical structure of an edges based on the root node.
	 * @param {AnyEntity} node The node to get the structure for.
	 * @returns {GraphEdgeStructure | Promise<GraphEdgeStructure>} The structure of the edge.
	 */
	getEdgeStructure(node: AnyEntity): GraphEdgeStructure | Promise<GraphEdgeStructure>;
}
