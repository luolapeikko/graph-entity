import {EventEmitter} from 'events';
import {type GraphNodeEventMapping, type IGraphBaseEntityNode, type IGraphEventEntityNode} from '@luolapeikko/graph-entity-types';
import {describe, expect, it} from 'vitest';
import {GraphManager} from '.';

export const GraphTypeEnum = {
	NodeJS: 0,
	Express: 10,
} as const;

type ExpressNode = IGraphBaseEntityNode<typeof GraphTypeEnum.Express, {port: string | number | undefined; status?: 'running' | 'stopped'}>;

class NodeJSNode extends EventEmitter<GraphNodeEventMapping> implements IGraphEventEntityNode<typeof GraphTypeEnum.NodeJS, {version: string}> {
	public readonly nodeType = GraphTypeEnum.NodeJS;
	public getNodeId = () => 'nodejs';
	public getNodeProps = () => Promise.resolve({version: '18'});
}

const nodejs = new NodeJSNode();

const express: ExpressNode = {
	nodeType: GraphTypeEnum.Express,
	getNodeId: () => 'express',
	getNodeProps: () => Promise.resolve({port: 3000, status: 'running'}),
};

const expressCopy: ExpressNode = {
	nodeType: GraphTypeEnum.Express,
	getNodeId: () => 'express',
	getNodeProps: () => Promise.resolve({port: 3000, status: 'running'}),
};

const graphManager = new GraphManager<ExpressNode | NodeJSNode>();

describe('GraphManager', function () {
	describe('addNode/removeNode', function () {
		it('should add nodes', function () {
			expect(graphManager.addNode(nodejs)).to.be.eq(true);
			expect(graphManager.addNode(nodejs)).to.be.eq(false);
			expect(graphManager.addNode(express)).to.be.eq(true);
			expect(graphManager.addNode(express)).to.be.eq(false);
			expect(graphManager.addNode(expressCopy)).to.be.eq(true);
			nodejs.emit('nodeUpdated');
		});
		it('should remove nodes', function () {
			expect(graphManager.removeNode(nodejs)).to.be.eq(true);
			expect(graphManager.removeNode(nodejs)).to.be.eq(false);
			expect(graphManager.removeNode(express)).to.be.eq(true);
			expect(graphManager.removeNode(express)).to.be.eq(false);
		});
	});
	describe('addEdge/removeEdge', function () {
		it('should add edges', function () {
			expect(graphManager.addEdge(nodejs, express)).to.be.eq(true);
			expect(graphManager.addEdge(nodejs, express)).to.be.eq(false);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(1);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(1);
		});
		it('should remove edges', function () {
			expect(graphManager.removeEdge(nodejs, express)).to.be.eq(true);
			expect(graphManager.removeEdge(nodejs, express)).to.be.eq(false);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
	});
	describe('addEdges/removeEdges', function () {
		it('should add edges', function () {
			expect(graphManager.addEdges([nodejs], [express])).to.be.eq(true);
			expect(graphManager.addEdges([nodejs], [express])).to.be.eq(false);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(1);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(1);
		});
		it('should remove edges', function () {
			expect(graphManager.removeEdges([nodejs], [express])).to.be.eq(true);
			expect(graphManager.removeEdges([nodejs], [express])).to.be.eq(false);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
	});
	describe('remove when have edge', function () {
		it('should remove from target node', function () {
			graphManager.addEdge(nodejs, express);
			expect(graphManager.removeNode(express)).to.be.eq(true);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
		it('should remove from source node', function () {
			graphManager.addEdge(nodejs, express);
			expect(graphManager.removeNode(nodejs)).to.be.eq(true);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
	});
	describe('getNodeStructure', function () {
		it('should get node structure', async function () {
			expect(graphManager.addEdge(nodejs, express)).to.be.eq(true);
			await expect(graphManager.getNodeStructure(nodejs, 10)).to.resolves.eql({
				type: GraphTypeEnum.NodeJS,
				id: 'nodejs',
				props: {version: '18'},
				targets: [
					{
						type: GraphTypeEnum.Express,
						id: 'express',
						props: {port: 3000, status: 'running'},
					},
				],
			});
			await expect(graphManager.getNodeStructure(express, -1, 10)).to.resolves.eql({
				type: GraphTypeEnum.Express,
				id: 'express',
				props: {port: 3000, status: 'running'},
				sources: [
					{
						type: GraphTypeEnum.NodeJS,
						id: 'nodejs',
						props: {version: '18'},
					},
				],
			});
		});
	});
	describe('getEdgeStructure', function () {
		it('should get node structure', function () {
			graphManager.addEdge(nodejs, express);
			expect(graphManager.getEdgeStructure(nodejs)).to.be.eql({
				id: 'nodejs',
				targets: [
					{
						id: 'express',
					},
				],
			});
			expect(graphManager.getEdgeStructure(express)).to.be.eql({
				id: 'express',
				sources: [
					{
						id: 'nodejs',
					},
				],
			});
		});
	});
	describe('getNodeById', function () {
		it('should get node by id', function () {
			graphManager.addEdge(nodejs, express);
			expect(graphManager.getNodeById('nodejs')).to.be.eq(nodejs);
			expect(graphManager.getNodeById('express')).to.be.eq(express);
		});
	});
	describe('getAllNodes', function () {
		it('should get all nodes', function () {
			graphManager.addEdge(nodejs, express);
			const nodes = Array.from(graphManager.getAllNodes());
			expect(nodes).to.have.length(2);
			expect(nodes).to.include(nodejs);
			expect(nodes).to.include(express);
		});
	});
	describe('getNodesByType', function () {
		it('should get nodes by type', function () {
			graphManager.addEdge(nodejs, express);
			const nodes = Array.from(graphManager.getNodesByType(GraphTypeEnum.NodeJS));
			expect(nodes).to.have.length(1);
			expect(nodes[0]).to.be.eq(nodejs);
		});
	});
});
