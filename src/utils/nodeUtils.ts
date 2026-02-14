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
        return {
            ...node,
            data: {
                ...node.data,
                label: newValue as string,
            },
        };
    }
    return node;
};
