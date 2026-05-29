import type {GraphNodeEventMapping, IGraphBaseEntityNode, IGraphEventEntityNode} from '@luolapeikko/graph-entity-types';
import {EventEmitter} from 'events';

export class EventNode<Id extends string, Type extends number, NodeProps extends Record<string, unknown>>
	extends EventEmitter<GraphNodeEventMapping<IGraphBaseEntityNode<Id, Type, NodeProps>>>
	implements IGraphEventEntityNode<Id, Type, NodeProps>
{
	public readonly nodeType: Type;
	public readonly nodeId: Id;
	private nodeProps: NodeProps;

	public constructor(nodeType: Type, nodeId: Id, initialNodeProps: Awaited<ReturnType<IGraphEventEntityNode<Id, Type, NodeProps>['getNodeProps']>>) {
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
			this.emit('nodeUpdated', this);
		}
	}

	public getNodeProps(): NodeProps {
		return this.nodeProps;
	}
}
