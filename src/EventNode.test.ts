import {describe, expect, it, vi} from 'vitest';
import {EventNode} from '.';

describe('EventNode', () => {
	it('should initialize with the correct properties', () => {
		const node = new EventNode(1, 'node-1', {key: 'value'});

		expect(node.nodeType).toBe(1);
		expect(node.getNodeId()).toBe('node-1');
		expect(node.getNodeProps()).toEqual({key: 'value'});
	});

	it('should update node properties and emit "nodeUpdated" event after delay', async () => {
		const node = new EventNode(1, 'node-1', {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);
		node.setProps({key: 'newValue'}, 50);

		expect(node.getNodeProps()).toEqual({key: 'newValue'});
		expect(listener).not.toHaveBeenCalled();

		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should reset the timer if setProps is called again before delay expires', async () => {
		const node = new EventNode(1, 'node-1', {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);
		node.setProps({key: 'newValue1'}, 100);
		setTimeout(() => node.setProps({key: 'newValue2'}, 100), 50);

		await new Promise((resolve) => setTimeout(resolve, 160));
		expect(listener).toHaveBeenCalledTimes(1);
		expect(node.getNodeProps()).toEqual({key: 'newValue2'});
	});

	it('should not emit "nodeUpdated" if setProps is not called', async () => {
		const node = new EventNode(1, 'node-1', {key: 'value'});
		const listener = vi.fn();

		node.on('nodeUpdated', listener);

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(listener).not.toHaveBeenCalled();
	});
});
