import { type Node, type Edge } from '@xyflow/react';

export const getOutgoingConnectedNodeIds = (sourceNodeId: string, edges: Edge[]): Set<string> => {
    const outgoingEdges = edges.filter((edge) => edge.source === sourceNodeId);
    return new Set(outgoingEdges.map((edge) => edge.target));
};

export const updateCurrentNode = (node: Node, field: string, newValue: unknown) => {
    return {
        ...node,
        data: {
            ...node.data,
            [field]: newValue,
        },
    };
};

export const updateConnectedNodes = (
    node: Node,
    newValue: unknown,
    connectedNodeIds: Set<string>
) => {
    if (connectedNodeIds.has(node.id)) {
        console.log("Update node: " + node.id);
        return {
            ...node,
            data: {
                ...node.data,
                name: newValue,
            },
        };
    }
    return node;
};

export const syncNodeDataFromSource = (
    targetNode: Node,
    sourceNode: Node | undefined,
    fieldsToSync?: string[]
): Node => {
    if (!sourceNode) return targetNode;

    if (fieldsToSync) {
        const updatedData = { ...targetNode.data };
        fieldsToSync.forEach(field => {
            if (field in sourceNode.data) {
                updatedData[field] = sourceNode.data[field];
            }
        });
        return { ...targetNode, data: updatedData };
    }

    const { label, ...dataToSync } = sourceNode.data;
    return {
        ...targetNode,
        data: {
            ...targetNode.data,
            ...dataToSync,
        },
    };
};
