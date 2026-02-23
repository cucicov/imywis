import { type Edge, type Node } from '@xyflow/react';
import type { NodeMetadata } from '../types/nodeTypes';

export const updateCurrentNode = (node: Node, field: string, newValue: unknown) => {
    return {
        ...node,
        data: {
            ...node.data,
            [field]: newValue,
        },
    };
};

export const updateNodeAndPropagate = (
    nodes: Node[],
    edges: Edge[],
    nodeId: string,
    field: string,
    newValue: unknown
): Node[] => {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const currentNode = nodeMap.get(nodeId);

    if (!currentNode) return nodes;

    const updatedSourceNode = updateCurrentNode(currentNode, field, newValue);
    nodeMap.set(nodeId, updatedSourceNode);

    const edgesBySource = new Map<string, Edge[]>();
    edges.forEach(edge => {
        const existing = edgesBySource.get(edge.source);
        if (existing) {
            existing.push(edge);
        } else {
            edgesBySource.set(edge.source, [edge]);
        }
    });

    const queue: string[] = [nodeId];
    const processedEdges = new Set<string>();
    const visitedNodes = new Set<string>();
    const maxIterations = Math.max(1, nodes.length * Math.max(1, edges.length));
    let iterations = 0;

    while (queue.length > 0) {
        iterations += 1;
        if (iterations > maxIterations) break;

        const sourceId = queue.shift();
        if (!sourceId) continue;
        if (visitedNodes.has(sourceId)) continue;
        visitedNodes.add(sourceId);

        const sourceNode = nodeMap.get(sourceId);
        if (!sourceNode) continue;

        const outgoing = edgesBySource.get(sourceId) || [];
        outgoing.forEach(edge => {
            const edgeKey = `${edge.id ?? ''}:${edge.source}:${edge.target}:${edge.sourceHandle ?? ''}`;
            if (processedEdges.has(edgeKey)) return;
            processedEdges.add(edgeKey);

            const targetNode = nodeMap.get(edge.target);
            if (!targetNode) return;

            const updatedTargetNode = syncNodeDataFromSource(
                targetNode,
                sourceNode,
                edge.sourceHandle
            );
            nodeMap.set(edge.target, updatedTargetNode);
            if (!visitedNodes.has(edge.target)) {
                queue.push(edge.target);
            }
        });
    }

    console.log(Array.from(nodeMap.values()));
    return Array.from(nodeMap.values());
};

export const syncNodeDataFromSource = (
    targetNode: Node,
    sourceNode: Node | undefined,
    sourceHandle: string | null | undefined
): Node => {
    if (!sourceNode || !sourceHandle) return targetNode;
    console.log("Sync node: " + targetNode.id);

    const metadata: NodeMetadata = (targetNode.data.metadata as NodeMetadata) || { sourceNodes: [] };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { label, metadata: sourceMetadata, ...sourceData } = sourceNode.data;

    // Include source node's metadata in the data if it exists
    const dataToStore = {
        ...sourceData,
        ...(sourceMetadata ? { metadata: sourceMetadata } : {})
    };

    // Check if this source already exists
    const existingIndex = metadata.sourceNodes.findIndex(
        s => s.nodeId === sourceNode.id && s.handleType === sourceHandle
    );

    const sourceNodeInfo = {
        nodeId: sourceNode.id,
        nodeType: sourceNode.type || 'unknown',
        handleType: sourceHandle,
        data: dataToStore,
    };

    if (existingIndex >= 0) {
        // Update existing
        metadata.sourceNodes[existingIndex] = sourceNodeInfo;
    } else {
        // Add new
        metadata.sourceNodes.push(sourceNodeInfo);
    }

    return {
        ...targetNode,
        data: {
            ...targetNode.data,
            metadata,
        },
    };
};

export const removeSourceNodeMetadata = (
    targetNode: Node,
    sourceNodeId: string,
    sourceHandle: string | null | undefined
): Node => {
    if (!targetNode.data.metadata) return targetNode;

    const currentMetadata = targetNode.data.metadata as NodeMetadata;
    const metadata: NodeMetadata = {
        ...currentMetadata,
        sourceNodes: currentMetadata.sourceNodes.filter(
            s => !(s.nodeId === sourceNodeId && s.handleType === sourceHandle)
        ),
    };

    return {
        ...targetNode,
        data: {
            ...targetNode.data,
            metadata,
        },
    };
};
