import {describe, expect, it} from 'vitest';
import {EventNode} from '../dist/index.mjs';

const graph = require('../dist/index.cjs');

describe('Module loading', function () {
	it('should load ESM module', function () {
		expect(EventNode).toBeDefined();
	});
	it('should load CJS module', function () {
		expect(graph.EventNode).toBeDefined();
	});
});
