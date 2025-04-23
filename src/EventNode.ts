import {EventEmitter} from 'events';
import type {GraphNodeEventMapping, IGraphBaseEntityNode} from '@luolapeikko/graph-entity-types';

export class EventNode<Entity extends IGraphBaseEntityNode<number, Record<string, unknown>>> extends EventEmitter<GraphNodeEventMapping> {
	public readonly nodeType: Entity['nodeType'];
	private nodeId: string;
	private nodeProps: Awaited<ReturnType<Entity['getNodeProps']>>;

	public constructor(nodeType: Entity['nodeType'], nodeId: string, initialNodeProps: Awaited<ReturnType<Entity['getNodeProps']>>) {
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
	public setNodeProps(props: Awaited<ReturnType<Entity['getNodeProps']>>, emitNodeUpdated = true): void {
		this.nodeProps = props;
		if (emitNodeUpdated) {
			this.emit('nodeUpdated');
		}
	}

	public getNodeId(): string {
		return this.nodeId;
	}

	public getNodeProps(): Awaited<ReturnType<Entity['getNodeProps']>> {
		return this.nodeProps;
	}
}
