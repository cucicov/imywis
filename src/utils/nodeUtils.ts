import { type Node } from '@xyflow/react';
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
