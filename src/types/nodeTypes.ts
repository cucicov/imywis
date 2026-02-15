export const NODE_TYPES = {
    PAGE: 'pageNode',
    IMAGE: 'imageNode',
} as const;

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];

export type NodeMetadata = {
    sourceNodes: Array<{
        nodeId: string;
        nodeType: string;
        handleType: string;
        data: Record<string, unknown>;
    }>;
};

export type PageNodeData = {
    label: string;
    name?: string;
    width?: number;
    height?: number;
    mousePointer?: string;
    metadata?: NodeMetadata;
};

export type ImageNodeData = {
    label: string;
    path?: string;
    width?: number;
    height?: number;
    autoWidth?: boolean;
    autoHeight?: boolean;
    positionX?: number;
    positionY?: number;
    opacity?: number;
    metadata?: NodeMetadata;
};
