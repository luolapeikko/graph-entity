import {type EventEmitter} from 'events';

/**
 * Base interface for a graph node. It defines the basic properties and methods that all graph nodes should have.
 * @example
 * const express: IGraphBaseEntityNode<typeof GraphTypeEnum.Express, {port: string}> = {}
 * class Express implements IGraphBaseEntityNode<typeof GraphTypeEnum.Express, {port: string}> {}
 * @template Type The type of the node. It should be a number.
 * @template NodeProps The properties of the node. It should be an object with string keys and unknown values.
 * @since v0.0.1
 * @see {@link IGraphEventEntityNode} for a node that can emit update events.
 */
export interface IGraphBaseEntityNode<Type extends number, NodeProps extends Record<string, unknown>> {
	readonly nodeType: Type;
	getNodeId(): string;
	getNodeProps(): NodeProps | Promise<NodeProps>;
}

/**
 * Node event mapping for the graph. It defines the events that can be emitted by a node.
 * @since v0.0.1
 */
export type GraphNodeEventMapping = {
	nodeUpdated: [];
};

/**
 * A node that can emit events. It is a subclass of IGraphBaseEntityNode and adds the ability to emit events.
 * @example
 * class NodeJSNode extends EventEmitter<GraphNodeEventMapping> implements IGraphEventEntityNode<typeof GraphTypeEnum.NodeJS, {version: string}> {}
 * @template Type The type of the node. It should be a number.
 * @template NodeProps The properties of the node. It should be an object with string keys and unknown values.
 * @since v0.0.1
 * @see {@link IGraphBaseEntityNode} for a node that does not emit events.
 */
export type IGraphEventEntityNode<Type extends number, NodeProps extends Record<string, unknown>> = IGraphBaseEntityNode<Type, NodeProps> &
	EventEmitter<GraphNodeEventMapping>;

/**
 * Combined type for graph nodes. It can be either a base node or an event node.
 * @template Type The type of the node. It should be a number.
 * @template NodeProps The properties of the node. It should be an object with string keys and unknown values.
 * @since v0.0.1
 * @see {@link IGraphBaseEntityNode} for a node that does not emit events.
 * @see {@link IGraphEventEntityNode} for a node that can emit events.
 */
export type IGraphEntityNode<Type extends number, NodeProps extends Record<string, unknown>> =
	| IGraphBaseEntityNode<Type, NodeProps>
	| IGraphEventEntityNode<Type, NodeProps>;
