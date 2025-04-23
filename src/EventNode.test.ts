import {type IGraphBaseEntityNode} from '@luolapeikko/graph-entity-types';
import {describe, expect, it, vi} from 'vitest';
import {EventNode} from '.';

type Node1 = IGraphBaseEntityNode<1, {key: string}>;

describe('EventNode', () => {
	it('should initialize with the correct properties', () => {
		const node = new EventNode<Node1>(1, 'node-1', {key: 'value'});

		expect(node.nodeType).toBe(1);
		expect(node.getNodeId()).toBe('node-1');
		expect(node.getNodeProps()).toEqual({key: 'value'});
	});

	it('should update node properties and emit "nodeUpdated" event after update', () => {
		const node = new EventNode(1, 'node-1', {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);
		expect(listener).not.toHaveBeenCalled();
		node.setNodeProps({key: 'newValue'});
		expect(node.getNodeProps()).toEqual({key: 'newValue'});
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should not emit "nodeUpdated" if setProps is not called', async () => {
		const node = new EventNode(1, 'node-1', {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(listener).not.toHaveBeenCalled();
	});
});
