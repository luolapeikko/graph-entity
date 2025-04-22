import {EventEmitter} from 'events';
import {type GraphNodeEventMapping, type IGraphEventEntityNode} from './types/Node';

export class EventNode<Type extends number, NodeProps extends Record<string, unknown>>
	extends EventEmitter<GraphNodeEventMapping>
	implements IGraphEventEntityNode<Type, NodeProps>
{
	public readonly nodeType: Type;
	private nodeId: string;
	private nodeProps: NodeProps;
	private emitTimeout: NodeJS.Timeout | undefined;

	public constructor(nodeType: Type, nodeId: string, initialNodeProps: NodeProps) {
		super();
		this.nodeType = nodeType;
		this.nodeId = nodeId;
		this.nodeProps = initialNodeProps;
	}

	/**
	 * Updates the node properties and emits a "nodeUpdated" event after a given delay (default 100ms).
	 * If the function is called again before the delay has expired, the timer is reset.
	 * @param {NodeProps} props The new node properties.
	 * @param {number} emitDelay The delay in milliseconds before emitting the event to prevent event spam. Defaults to 100ms.
	 */
	public setProps(props: NodeProps, emitDelay = 100): void {
		this.nodeProps = props;
		this.emitTimeout ??= setTimeout(() => {
			this.emit('nodeUpdated');
			this.emitTimeout = undefined;
		}, emitDelay);
	}

	public getNodeId(): string {
		return this.nodeId;
	}

	public getNodeProps(): NodeProps {
		return this.nodeProps;
	}
}
