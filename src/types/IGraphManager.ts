import {type EventEmitter} from 'events';
import {type IGraphEntityNode} from './Node';

export type GraphManagerEventMapping<Entity extends IGraphEntityNode<number, Record<string, unknown>>> = {
	graphUpdate: []; // any update to the graph (node or edge)
	nodeUpdate: [Entity];
	nodeRemove: [Entity];
	edgeAdd: [source: Entity, target: Entity];
	edgeRemove: [source: Entity, target: Entity];
};

export type GraphStructure = {
	type: number;
	id: string;
	targets?: GraphStructure[];
	props: Record<string, unknown>;
};

/**
 * Generic interface for a graph manager which can add, remove, and update nodes and edges in a graph. (supports async operations for bigger implementations)
 * @template Entity The type of the nodes in the graph.
 * @since v0.0.1
 */
export interface IGraphManager<Entity extends IGraphEntityNode<number, Record<string, unknown>>> extends EventEmitter<GraphManagerEventMapping<Entity>> {
	/**
	 * Adds a node to the graph. If the node already exists, it will be updated.
	 * @param {Entity} node The node to add to the graph
	 * @returns {boolean | Promise<boolean>} True if the node was added or updated, false if it already existed
	 */
	addNode(node: Entity): boolean | Promise<boolean>;

	/**
	 * Removes a node from the graph. If the node does not exist, it will be ignored.
	 * @param {Entity} node The node to remove from the graph.
	 * @returns {boolean | Promise<boolean>} True if the node was removed, false if it did not exist.
	 */
	removeNode(node: Entity): boolean | Promise<boolean>;

	/**
	 * Adds an edge between two nodes. If either node does not exist, it will be added to the graph.
	 * @param {Entity} source The source node of the edge.
	 * @param {Entity} target The target node of the edge.
	 * @returns {boolean | Promise<boolean>} True if the edge was added, false if it already existed.
	 */
	addEdge(source: Entity, target: Entity): boolean | Promise<boolean>;
	/**
	 * Removes an edge between two nodes. If either node does not exist, it will be removed from the graph.
	 * @param {Entity} source The source node of the edge.
	 * @param {Entity} target The target node of the edge.
	 * @returns {boolean | Promise<boolean>} True if the edge was removed, false if it did not exist.
	 */
	removeEdge(source: Entity, target: Entity): boolean | Promise<boolean>;

	/**
	 * Get current node targets (children links).
	 * @param {Entity} node The node to get targets for.
	 * @returns {Iterable<Entity> | AsyncIterable<Entity>} list of target nodes
	 */
	getTargets(node: Entity): Iterable<Entity> | AsyncIterable<Entity>;

	/**
	 * Get current node sources (parent links).
	 * @param {Entity} node The node to get sources for.
	 * @returns {Iterable<Entity> | AsyncIterable<Entity>} list of source nodes
	 */
	getSources(node: Entity): Iterable<Entity> | AsyncIterable<Entity>;

	/**
	 * Get current node targets count (children links).
	 * @param {Entity} node The node to get targets for.
	 * @returns {number | Promise<number>} count of target nodes
	 */
	getTargetEdgeCount(node: Entity): number | Promise<number>;

	/**
	 * Get current node sources count (parent links).
	 * @param {Entity} node The node to get sources for.
	 * @returns {number | Promise<number>} count of source nodes
	 */
	getSourceEdgeCount(node: Entity): number | Promise<number>;

	/**
	 * Get all nodes in the graph.
	 * @returns {Iterable<Entity> | AsyncIterable<Entity>} list of all nodes
	 */
	getAllNodes(): Iterable<Entity> | AsyncIterable<Entity>;

	/**
	 * Get all nodes of a specific type.
	 * @template T The type of the node to get.
	 * @param {T} nodeType The type of the node to get.
	 * @returns {Iterable<Extract<Entity, {nodeType: T}>> | AsyncIterable<Extract<Entity, {nodeType: T}>>} An iterable of nodes of the specified type.
	 */
	getNodesByType<T extends Entity['nodeType']>(nodeType: T): Iterable<Extract<Entity, {nodeType: T}>> | AsyncIterable<Extract<Entity, {nodeType: T}>>;

	/**
	 * Get a node by its ID.
	 * @param {string} id The ID of the node to get.
	 * @returns {Entity | undefined | Promise<Entity | undefined>} The node with the specified ID, or undefined if it does not exist.
	 */
	getNodeById(id: string): Entity | undefined | Promise<Entity | undefined>;

	/**
	 * Get the structure of a node, including its properties and targets.
	 * @param {Entity} node The node to get the structure for.
	 * @returns {Promise<GraphStructure>} The structure of the node.
	 */
	getNodeStructure(node: Entity): Promise<GraphStructure>;
}
