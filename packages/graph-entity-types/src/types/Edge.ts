import type {IGraphEntityNode} from './Node';

/**
 * A graph edge connecting two nodes.
 * @template AnyEntity The type of the any nodes in the graph.
 * @since v0.1.0
 */
export type GraphEdge<AnyEntity extends IGraphEntityNode<string, number, Record<string, unknown>>> = {source: AnyEntity; target: AnyEntity};
