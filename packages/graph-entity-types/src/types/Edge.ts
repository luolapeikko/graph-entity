import type {IGraphEntityNode} from './Node';

/**
 * A graph edge connecting two nodes.
 * @template Entity The type of the node.
 * @since v0.0.10
 */
export type GraphEdge<Entity extends IGraphEntityNode<number, Record<string, unknown>>> = {source: Entity; target: Entity};
