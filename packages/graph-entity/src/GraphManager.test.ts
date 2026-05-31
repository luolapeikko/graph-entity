import type {GraphNodeEventMapping, IGraphBaseEntityNode, IGraphEventEntityNode} from '@luolapeikko/graph-entity-types';
import {EventEmitter} from 'events';
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {GraphManager} from '.';

export const GraphTypeEnum = {
	Database: 20,
	Express: 10,
	NodeJS: 0,
} as const;

const expressId = '159f6944-e834-4d1f-8394-a348d2aa3866' as const;

type ExpressNode = IGraphBaseEntityNode<typeof expressId, typeof GraphTypeEnum.Express, {port: string | number | undefined; status?: 'running' | 'stopped'}>;

const databaseId = '927f1156-869c-4fe0-a922-190e646253eb' as const;

type DatabaseNode = IGraphBaseEntityNode<typeof databaseId, typeof GraphTypeEnum.Database, {host: string | undefined; status?: 'running' | 'stopped'}>;

const nodejsId = 'dd23f604-167d-4450-8d7d-d813e013879f' as const;

class NodeJSNode
	extends EventEmitter<GraphNodeEventMapping<IGraphEventEntityNode<typeof nodejsId, typeof GraphTypeEnum.NodeJS, {version: string}>>>
	implements IGraphEventEntityNode<typeof nodejsId, typeof GraphTypeEnum.NodeJS, {version: string}>
{
	public readonly nodeType = GraphTypeEnum.NodeJS;
	public readonly nodeId = nodejsId;
	public constructor(_port: string | number, _something: string) {
		super();
	}
	public getNodeProps = () => Promise.resolve({version: '18'});
}

const express: ExpressNode = {
	getNodeProps: () => Promise.resolve({port: 3000, status: 'running'}),
	nodeId: expressId,
	nodeType: GraphTypeEnum.Express,
};

const expressCopy: ExpressNode = {
	getNodeProps: () => Promise.resolve({port: 3000, status: 'running'}),
	nodeId: expressId,
	nodeType: GraphTypeEnum.Express,
};

const database: DatabaseNode = {
	getNodeProps: () => Promise.resolve({host: 'localhost', status: 'running'}),
	nodeId: databaseId,
	nodeType: GraphTypeEnum.Database,
};

const nodeCreatedListener = vi.fn();
let graphManager: GraphManager<ExpressNode | NodeJSNode | DatabaseNode>;

let nodejs: NodeJSNode;

let automaticMappig = true;

describe('GraphManager', function () {
	beforeEach(async function () {
		graphManager = new GraphManager<ExpressNode | NodeJSNode | DatabaseNode>(
			automaticMappig
				? [
						[nodejsId, expressId],
						[nodejsId, databaseId],
						[nodejsId, nodejsId], // broken, should not add to autoMap
					]
				: undefined,
		);
		graphManager.on('nodeCreated', nodeCreatedListener);
		nodejs = await graphManager.createNode(NodeJSNode, 3000, 'some test argument');
	});
	describe('addNode/removeNode', function () {
		it('should create nodes', function () {
			expect(nodeCreatedListener).toHaveBeenCalledTimes(1); // nodejs class should have been created by GraphManager.createNode
			expect(graphManager.addNode(nodejs)).to.be.eq(false);
			expect(graphManager.addNode(express)).to.be.eq(true);
			expect(graphManager.addNode(express)).to.be.eq(false);
			expect(graphManager.addNode(expressCopy)).to.be.eq(true);
			nodejs.emit('nodeUpdated', nodejs);
		});
		it('should remove nodes', async function () {
			expect(graphManager.addNode(express)).to.be.eq(true);
			await expect(graphManager.removeNode(nodejs)).to.be.resolves.eq(true);
			await expect(graphManager.removeNode(nodejs)).to.be.resolves.eq(false);
			await expect(graphManager.removeNode(express)).to.be.resolves.eq(true);
			await expect(graphManager.removeNode(express)).to.be.resolves.eq(false);
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
			expect(graphManager.addNode(express)).to.be.eq(true);
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
			expect(graphManager.addNode(express)).to.be.eq(true);
			expect(graphManager.removeEdges([nodejs], [express])).to.be.eq(true);
			expect(graphManager.removeEdges([nodejs], [express])).to.be.eq(false);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
	});
	describe('addEdgeWithId', function () {
		beforeAll(() => {
			automaticMappig = false;
		});
		it('should add edges with id', function () {
			expect(graphManager.addNode(express)).to.be.eq(true);
			expect(graphManager.addEdgeWithId(nodejsId, expressId)).to.be.eq(true);
			expect(graphManager.addEdgeWithId(nodejsId, expressId)).to.be.eq(false);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(1);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(1);
		});
		it('should throw when adding edges without node', function () {
			expect(() => graphManager.addEdgeWithId(nodejsId, expressId)).to.throw('Cannot add edge with non-existent node(s)');
			expect(() => graphManager.addEdgeWithId(expressId, nodejsId)).to.throw('Cannot add edge with non-existent node(s)');
		});
		afterAll(() => {
			automaticMappig = true;
		});
	});
	describe('removeEdgeWithId', function () {
		it('should remove edges with id', function () {
			expect(graphManager.addNode(express)).to.be.eq(true);
			expect(graphManager.removeEdgeWithId(nodejsId, expressId)).to.be.eq(true);
			expect(graphManager.removeEdgeWithId(nodejsId, expressId)).to.be.eq(false);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
		it('should return false when removing edges without node', function () {
			expect(graphManager.removeEdgeWithId(nodejsId, expressId)).to.be.eq(false);
		});
	});
	describe('remove when have edge', function () {
		it('should remove from target node', async function () {
			graphManager.addEdge(nodejs, express);
			await expect(graphManager.removeNode(express)).to.be.resolves.eq(true);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
		it('should remove from source node', async function () {
			graphManager.addEdge(nodejs, express);
			await expect(graphManager.removeNode(nodejs)).to.be.resolves.eq(true);
			expect(graphManager.getSourceEdgeCount()).to.be.eq(0);
			expect(graphManager.getTargetEdgeCount()).to.be.eq(0);
		});
	});
	describe('getNodeStructure', function () {
		it('should get node structure', async function () {
			expect(graphManager.addEdge(nodejs, express)).to.be.eq(true);
			await expect(graphManager.getNodeStructure(nodejs, 10)).to.resolves.eql({
				id: nodejsId,
				props: {version: '18'},
				targets: [
					{
						id: expressId,
						props: {port: 3000, status: 'running'},
						type: GraphTypeEnum.Express,
					},
				],
				type: GraphTypeEnum.NodeJS,
			});
			await expect(graphManager.getNodeStructure(express, -1, 10)).to.resolves.eql({
				id: expressId,
				props: {port: 3000, status: 'running'},
				sources: [
					{
						id: nodejsId,
						props: {version: '18'},
						type: GraphTypeEnum.NodeJS,
					},
				],
				type: GraphTypeEnum.Express,
			});
		});
	});
	describe('getEdgeStructure', function () {
		it('should get node structure', function () {
			graphManager.addEdge(nodejs, express);
			expect(graphManager.getEdgeStructure(nodejs)).to.be.eql({
				id: nodejsId,
				targets: [
					{
						id: expressId,
					},
				],
			});
			expect(graphManager.getEdgeStructure(express)).to.be.eql({
				id: expressId,
				sources: [
					{
						id: nodejsId,
					},
				],
			});
		});
	});
	describe('getNodeById', function () {
		it('should get node by id', function () {
			graphManager.addEdge(nodejs, express);
			expect(graphManager.getNodeById(nodejsId)).to.be.eq(nodejs);
			expect(graphManager.getNodeById(expressId)).to.be.eq(express);
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
	describe('getAllEdges', function () {
		it('should get all edges', function () {
			graphManager.addEdge(nodejs, express);
			graphManager.addEdge(nodejs, database);
			const edges = graphManager.getAllEdges();
			expect(edges).to.be.an('array').with.lengthOf(2);
			expect(edges).to.deep.include({source: nodejs, target: express});
			expect(edges).to.deep.include({source: nodejs, target: database});
		});
	});
	describe('getNodesByType', function () {
		it('should get nodes by type', function () {
			graphManager.addEdge(nodejs, express);
			const nodes = Array.from(graphManager.getNodesByType(GraphTypeEnum.NodeJS));
			expect(nodes).to.have.length(1);
			expect(nodes[0]).to.be.eq(nodejs);
		});
		it('should get empty list if no nodes for a given type', function () {
			const nodes = Array.from(graphManager.getNodesByType(GraphTypeEnum.Express));
			expect(nodes).to.have.length(0);
		});
	});
});
