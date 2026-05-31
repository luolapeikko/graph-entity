import type {EventEmitter} from 'events';

/**
 * Base interface for a graph node. It defines the basic properties and methods that all graph nodes should have.
 * @example
 * const express: IGraphBaseEntityNode<typeof GraphTypeEnum.Express, {port: string}> = {}
 * class Express implements IGraphBaseEntityNode<typeof GraphTypeEnum.Express, {port: string}> {}
 * @template Type The type of the node. It should be a number.
 * @template NodeProps The properties of the node. It should be an object with string keys and unknown values.
 * @since v0.1.0
 * @see {@link IGraphEventEntityNode} for a node that can emit update events.
 */
export interface IGraphBaseEntityNode<Id extends string, Type extends number, NodeProps extends Record<string, unknown>> {
	/**
	 * The type of the node. It should be a const number. (like an enum value)
	 */
	readonly nodeType: Type;
	/**
	 * The unique identifier of the node. It should be a const string for static nodes. (like UUID)
	 */
	readonly nodeId: Id;
	getNodeProps(): NodeProps | Promise<NodeProps>;
	onInit?(): void | Promise<void>;
	onRemove?(): void | Promise<void>;
}

/**
 * Constructor type for a graph node. It defines the constructor signature for creating a graph node.
 */
export type GraphNodeConstructor<Node extends IGraphBaseEntityNode<string, number, Record<string, unknown>>> = new (
	// biome-ignore lint/suspicious/noExplicitAny: This is a constructor type, so it can accept any arguments.
	...args: any[]
) => Node;

/**
 * Node event mapping for the graph. It defines the events that can be emitted by a node.
 * @since v0.1.0
 */
export type GraphNodeEventMapping<T extends IGraphBaseEntityNode<string, number, Record<string, unknown>>> = {
	nodeUpdated: [T];
};

/**
 * A node that can emit events. It is a subclass of IGraphBaseEntityNode and adds the ability to emit events.
 * @example
 * class NodeJSNode extends EventEmitter<GraphNodeEventMapping> implements IGraphEventEntityNode<typeof GraphTypeEnum.NodeJS, {version: string}> {}
 * @template Type The type of the node. It should be a number.
 * @template NodeProps The properties of the node. It should be an object with string keys and unknown values.
 * @since v0.1.0
 * @see {@link IGraphBaseEntityNode} for a node that does not emit events.
 */
export type IGraphEventEntityNode<Id extends string, Type extends number, NodeProps extends Record<string, unknown>> = IGraphBaseEntityNode<
	Id,
	Type,
	NodeProps
> &
	EventEmitter<GraphNodeEventMapping<IGraphBaseEntityNode<Id, Type, NodeProps>>>;

/**
 * Combined type for graph nodes. It can be either a base node or an event node.
 * @template Type The type of the node. It should be a number.
 * @template NodeProps The properties of the node. It should be an object with string keys and unknown values.
 * @since v0.0.1
 * @see {@link IGraphBaseEntityNode} for a node that does not emit events.
 * @see {@link IGraphEventEntityNode} for a node that can emit events.
 */
export type IGraphEntityNode<Id extends string, Type extends number, NodeProps extends Record<string, unknown>> =
	| IGraphBaseEntityNode<Id, Type, NodeProps>
	| IGraphEventEntityNode<Id, Type, NodeProps>;
