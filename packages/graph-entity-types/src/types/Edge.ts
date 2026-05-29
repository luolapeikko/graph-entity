import type {IGraphEntityNode} from './Node';

/**
 * A graph edge connecting two nodes.
 * @template SrcEntity The type of the node.
 * @since v0.1.0
 */
export type GraphEdge<
	SrcEntity extends IGraphEntityNode<string, number, Record<string, unknown>>,
	TargetEntity extends IGraphEntityNode<string, number, Record<string, unknown>>,
> = {source: SrcEntity; target: TargetEntity};
