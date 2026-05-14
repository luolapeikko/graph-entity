# @luolapeikko/graph-entity-types

TypeScript type definitions for the Graph Entity ecosystem. Provides core interfaces and types for graph nodes, edges, and graph management, designed for use with the `@luolapeikko/graph-entity` package or similar graph-based systems.

## Installation

```sh
npm install @luolapeikko/graph-entity-types
```

or with pnpm:

```sh
pnpm add @luolapeikko/graph-entity-types
```

## Overview

This package contains reusable TypeScript types and interfaces for building strongly-typed graph data structures and event-driven graph managers.

## Exports

- `IGraphBaseEntityNode` – Base interface for a graph node
- `IGraphEventEntityNode` – Node interface with event support
- `GraphNodeEventMapping` – Node event mapping type
- `GraphEdge` – Type for graph edges
- `GraphManagerEventMapping` – Event mapping for graph managers
- `GraphStructure` – Recursive type for graph structure
- `GraphEdgeStructure` – Recursive type for edge structure
- `IGraphManager` – Interface for a graph manager

## Example Usage

```typescript
import type { IGraphBaseEntityNode, GraphEdge } from '@luolapeikko/graph-entity-types';

// Define a node type
type MyNode = IGraphBaseEntityNode<1, { label: string }>;

const nodeA: MyNode = {
	nodeType: 1,
	getNodeId: () => 'A',
	getNodeProps: () => ({ label: 'Node A' }),
};

const nodeB: MyNode = {
	nodeType: 1,
	getNodeId: () => 'B',
	getNodeProps: () => ({ label: 'Node B' }),
};

const edge: GraphEdge<MyNode> = { source: nodeA, target: nodeB };
```

See more features on [Package documentation](https://luolapeikko.github.io/graph-entity/)