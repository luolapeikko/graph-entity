import {describe, expect, it, vi} from 'vitest';
import {EventNode} from '.';

const nodeId = '48780b7a-9a80-45d0-8d39-f41e00be2c86' as const;

describe('EventNode', () => {
	it('should initialize with the correct properties', () => {
		const node = new EventNode<typeof nodeId, 1, {key: string}>(1, nodeId, {key: 'value'});

		expect(node.nodeType).toBe(1);
		expect(node.nodeId).toBe(nodeId);
		expect(node.getNodeProps()).toEqual({key: 'value'});
	});

	it('should update node properties and emit "nodeUpdated" event after update', () => {
		const node = new EventNode(1, nodeId, {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);
		expect(listener).not.toHaveBeenCalled();
		node.setNodeProps({key: 'newValue'});
		expect(node.getNodeProps()).toEqual({key: 'newValue'});
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should update node properties and not emit "nodeUpdated" event (flag)', () => {
		const node = new EventNode(1, nodeId, {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);
		expect(listener).not.toHaveBeenCalled();
		node.setNodeProps({key: 'newValue'}, false);
		expect(node.getNodeProps()).toEqual({key: 'newValue'});
		expect(listener).not.toHaveBeenCalled();
	});

	it('should not emit "nodeUpdated" if setProps is not called', async () => {
		const node = new EventNode(1, 'node-1', {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(listener).not.toHaveBeenCalled();
	});
});
