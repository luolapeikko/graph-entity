# graph-entity

Graph Entity service to track linked services and change events, idea is loosely based on Graph Database but more Entity and event driven.

## Overview

Service is designed to track linked service nodes and their change events (by adding/removing nodes and edges and nodes emitting change events).
This allow tracking changes as example NodeJS => Express => Logins: [User1, User2, User3] / Logouts. Or track other services like Redis, MongoDB, etc. and those relations and events.

## Example

```typescript
import {EventEmitter} from 'events';
import {GraphManager, type GraphNodeEventMapping, type IGraphBaseEntityNode, type IGraphEventEntityNode} from '.';

export const GraphTypeEnum = {
	NodeJS: 0,
	Express: 10,
	ExpressRouter: 11,
	MognoDB: 20,
	Redis: 30,
} as const;

const manager = new GraphManager<ExpressJs | NodeJsNode>();

type NodeJsNode = IGraphBaseEntityNode<typeof GraphTypeEnum.NodeJS, {version: string}>;
export const rootNodejsGraphNode: NodeJsNode = {
	nodeType: GraphTypeEnum.NodeJS,
	getNodeId: () => 'nodejs',
	getNodeProps: () => ({version: process.versions.node}),
};
manager.addNode(rootNodejsGraphNode); // add nodejs node to manager

export class ExpressJs
	extends EventEmitter<GraphNodeEventMapping>
	implements IGraphEventEntityNode<typeof GraphTypeEnum.Express, {port: string | number | undefined; status?: 'running' | 'stopped'}>
{
	public nodeType = GraphTypeEnum.Express;
	public getNodeId = () => 'express';
	private port: string;
	private status: 'running' | 'stopped' = 'stopped';
	public constructor(port: string) {
		super();
		this.port = port;
		manager.addEdge(rootNodejsGraphNode, this); // here constructor work easy way to add edge to nodejs root node
		// after start server, set status to running and notify with this.emit('nodeUpdated') event
	}
	public getNodeProps() {
		return {
			port: this.port,
			status: this.status,
		};
	}
}

// hook to manager events and output the node hierarchy structure
manager.on('graphUpdate', async (node) => {
	console.log(await manager.getNodeStructure(node));
});
```
