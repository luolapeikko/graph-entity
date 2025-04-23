import {EventEmitter} from 'events';
import type {GraphNodeEventMapping, IGraphEventEntityNode} from '@luolapeikko/graph-entity-types';

export class EventNode<Type extends number, NodeProps extends Record<string, unknown>>
	extends EventEmitter<GraphNodeEventMapping>
	implements IGraphEventEntityNode<Type, NodeProps>
{
	public readonly nodeType: Type;
	private nodeId: string;
	private nodeProps: NodeProps;

	public constructor(nodeType: Type, nodeId: string, initialNodeProps: NodeProps) {
		super();
		this.nodeType = nodeType;
		this.nodeId = nodeId;
		this.nodeProps = initialNodeProps;
	}

	/**
	 * Updates the node properties and emits a "nodeUpdated" event after updating the properties.
	 * @param {NodeProps} props The new node properties.
	 * @param {boolean} emitNodeUpdated Whether to emit the "nodeUpdated" event after updating the properties, default is true
	 * @fires nodeUpdated
	 */
	public setNodeProps(props: NodeProps, emitNodeUpdated = true): void {
		this.nodeProps = props;
		if (emitNodeUpdated) {
			this.emit('nodeUpdated');
		}
	}

	public getNodeId(): string {
		return this.nodeId;
	}

	public getNodeProps(): NodeProps {
		return this.nodeProps;
	}
}
