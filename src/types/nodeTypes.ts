export const NODE_TYPES = {
    PAGE: 'pageNode',
    IMAGE: 'imageNode',
    BACKGROUND: 'backgroundNode',
    TEXT: 'textNode',
} as const;

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];

export type NodeMetadata = {
    sourceNodes: Array<{
        nodeId: string;
        type: string;
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
    backgroundColor?: string;
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

export type BackgroundStyle = 'tile' | 'fullscreen' | 'stretch' | 'contain';

export type BackgroundNodeData = {
    label: string;
    style?: BackgroundStyle;
    width?: number;
    height?: number;
    autoWidth?: boolean;
    autoHeight?: boolean;
    metadata?: NodeMetadata;
};

export type TextNodeData = {
    label: string;
    text?: string;
    font?: string;
    size?: number;
    width?: number;
    height?: number;
    positionX?: number;
    positionY?: number;
    opacity?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    caps?: boolean;
    metadata?: NodeMetadata;
};
