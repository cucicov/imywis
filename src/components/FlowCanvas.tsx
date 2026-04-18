import {
  ReactFlow,
  useNodesState,
  useEdgesState, Background,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import {type AppUIProps} from '../types/supabaseTypes.ts';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import '@xyflow/react/dist/style.css';
import PageNode from './nodes/PageNode.tsx';
import AddPageNodeButton from './nodes/buttons/AddPageNodeButton.tsx';
import AddImageNodeButton from "./nodes/buttons/AddImageNodeButton.tsx";
import ImageNode from "./nodes/ImageNode.tsx";
import NodeStateTransfer from "./nodes/NodeStateTransfer.tsx";
import type {PageNodeData} from "../types/nodeTypes.ts";
import {syncNodeDataFromSource, removeSourceNodeMetadata} from "../utils/nodeUtils.ts";
import {NODE_TYPES} from '../types/nodeTypes';
import {CONNECTION_RULES} from "../types/handleTypes.ts";
import P5Preview from './P5Preview.tsx';
import ExportP5Project from './ExportP5Project.tsx';
import BackgroundNode from './nodes/BackgroundNode.tsx';
import AddBackgroundNodeButton from './nodes/buttons/AddBackgroundNodeButton.tsx';
import {toNumberOrNull} from '../utils/numberUtils.ts';
import TextNode from './nodes/TextNode.tsx';
import AddTextNodeButton from './nodes/buttons/AddTextNodeButton.tsx';
import EventNode from './nodes/EventNode.tsx';
import AddEventNodeButton from './nodes/buttons/AddEventNodeButton.tsx';
import ExternalLinkNode from './nodes/ExternalLinkNode.tsx';
import AddExternalLinkNodeButton from './nodes/buttons/AddExternalLinkNodeButton.tsx';
import LatestSelectedPageNameBadge from './nodes/buttons/LatestSelectedPageNameBadge.tsx';
import {
  getLatestSelectedPageNameFromSession,
  setLatestSelectedPageNameInSession,
} from '../utils/sessionStorage.ts';
import {supabase} from '../utils/supabaseClient.ts';
import AutosaveToggle from './AutosaveToggle.tsx';

const nodeTypes = {
  pageNode: PageNode,
  imageNode: ImageNode,
  backgroundNode: BackgroundNode,
  textNode: TextNode,
  eventNode: EventNode,
  externalLinkNode: ExternalLinkNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: NODE_TYPES.PAGE,
    data: {label: NODE_TYPES.PAGE, name: 'index.html', backgroundColor: '#add5d5'} as PageNodeData,
    position: { x: 250, y: 5 },
  }
];

const initialEdges: Edge[] = [];

type PersistedNode = {
  id?: unknown;
  type?: unknown;
  data?: unknown;
  position?: {
    x?: unknown;
    y?: unknown;
  };
};

type UserProfileProjectRow = {
  data?: unknown;
};

type PersistedProjectData = {
  nodes: Node[];
  edges: Edge[];
};

type NodeDataWithMetadata = {
  metadata?: {
    sourceNodes?: Array<{ nodeId: string; handleType: string }>;
  };
  connectionImpactKey?: number;
  [key: string]: unknown;
};


const FlowCanvas = ({ session, handleLogout }: AppUIProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [latestSelectedPageName, setLatestSelectedPageName] = useState(() => getLatestSelectedPageNameFromSession());
  const previousMetadataSignatureByNodeIdRef = useRef<Map<string, string>>(new Map());
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    let isActive = true;

    const loadNodesFromProfile = async () => {
      const {data, error} = await supabase
        .from('user_profiles')
        .select('data')
        .eq('user_id', session.user.id)
        .maybeSingle<UserProfileProjectRow>();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error('Failed to load saved project from public.user_profiles:', error);
        return;
      }

      const persistedProjectData = normalizePersistedProjectData(data?.data);

      if (!persistedProjectData) {
        return;
      }

      setNodes(persistedProjectData.nodes.length > 0 ? persistedProjectData.nodes : initialNodes);
      setEdges(persistedProjectData.edges);
    };

    void loadNodesFromProfile();

    return () => {
      isActive = false;
    };
  }, [session.user.id, setEdges, setNodes]);

  const persistSelectedPageNode = useCallback((node: Node) => {
    if (node.type !== NODE_TYPES.PAGE) {
      return;
    }

    const pageData = node.data as PageNodeData | undefined;
    const nextPageName = resolveSelectedPageName(pageData?.name);
    setLatestSelectedPageName(nextPageName);
    setLatestSelectedPageNameInSession(nextPageName);
  }, []);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    const selectedPageNode = selectedNodes.find((node) => node.type === NODE_TYPES.PAGE);
    if (selectedPageNode) {
      persistSelectedPageNode(selectedPageNode);
    }
  }, [persistSelectedPageNode]);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    persistSelectedPageNode(node);
  }, [persistSelectedPageNode]);

  const onConnect = useCallback(
      (connection: Connection) => {
        const normalizedConnection = normalizeConnectionDirection(connection);
        if (!normalizedConnection) {
          return;
        }

        const sourceId = normalizedConnection.source;
        const targetId = normalizedConnection.target;

        if (!sourceId || !targetId) {
          return;
        }

        setEdges((eds) => addEdge(normalizedConnection, eds));
      },
      [setEdges]
  );

  // Update target nodes when connections change
  useEffect(() => {
    setNodes((currentNodes) => {
      const nodeMap = new Map(currentNodes.map(n => [n.id, n]));

      // Track all active connections per target node
      const activeConnections = new Map<string, Set<string>>();
      edges.forEach(edge => {
        if (!activeConnections.has(edge.target)) {
          activeConnections.set(edge.target, new Set());
        }
        activeConnections.get(edge.target)!.add(`${edge.source}:${edge.sourceHandle}`);
      });

      // Update metadata for all nodes
      currentNodes.forEach(node => {
        let updatedNode = node as typeof node;
        const nodeData = node.data as NodeDataWithMetadata;

        // Remove metadata for disconnected sources
        if (nodeData.metadata?.sourceNodes) {
          nodeData.metadata.sourceNodes.forEach((source) => {
            const connectionKey = `${source.nodeId}:${source.handleType}`;
            const nodeActiveConnections = activeConnections.get(node.id);
            const sourceNodeStillExists = nodeMap.has(source.nodeId);

            if (!sourceNodeStillExists || !nodeActiveConnections || !nodeActiveConnections.has(connectionKey)) {
              updatedNode = removeSourceNodeMetadata(updatedNode, source.nodeId, source.handleType) as typeof node;
            }
          });
        }

        // Add/update metadata for connected sources
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        incomingEdges.forEach(edge => {
          const sourceNode = currentNodes.find(n => n.id === edge.source);
          if (sourceNode) {
            updatedNode = syncNodeDataFromSource(updatedNode, sourceNode, edge.sourceHandle) as typeof node;
          }
        });

        nodeMap.set(node.id, updatedNode);
      });

      return Array.from(nodeMap.values());
    });
  }, [edges, setNodes]);

  // Trigger impact animation whenever a node metadata payload changes
  useEffect(() => {
    if (!animationsEnabled) {
      setNodes((currentNodes) => {
        let hasChanges = false;
        const nextNodes = currentNodes.map((node) => {
          if (!node.data.connectionImpactKey) {
            return node;
          }

          hasChanges = true;
          return {
            ...node,
            data: {
              ...node.data,
              connectionImpactKey: undefined,
            },
          };
        });

        return hasChanges ? nextNodes : currentNodes;
      });
      return;
    }

    const currentSignatures = new Map<string, string>();
    const impactedNodeIds: string[] = [];

    nodes.forEach((node) => {
      const nodeData = node.data as NodeDataWithMetadata;
      const metadataSignature = JSON.stringify(nodeData.metadata?.sourceNodes ?? []);
      currentSignatures.set(node.id, metadataSignature);

      const previousSignature = previousMetadataSignatureByNodeIdRef.current.get(node.id);
      if (typeof previousSignature === 'string' && previousSignature !== metadataSignature) {
        impactedNodeIds.push(node.id);
      }
    });

    previousMetadataSignatureByNodeIdRef.current = currentSignatures;

    if (impactedNodeIds.length === 0) {
      return;
    }

    const impactKey = Date.now();
    const impactedNodeIdSet = new Set(impactedNodeIds);

    setNodes((currentNodes) => currentNodes.map((node) => {
      if (!impactedNodeIdSet.has(node.id)) {
        return node;
      }

      return {
        ...node,
        data: {
          ...node.data,
          connectionImpactKey: impactKey,
        },
      };
    }));

    window.setTimeout(() => {
      setNodes((currentNodes) => currentNodes.map((node) => {
        if (!impactedNodeIdSet.has(node.id)) {
          return node;
        }

        if (node.data.connectionImpactKey !== impactKey) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            connectionImpactKey: undefined,
          },
        };
      }));
    }, 520);
  }, [animationsEnabled, nodes, setNodes]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  const sceneSize = useMemo(() => {
    const pageNode = nodes.find(node => node.type === NODE_TYPES.PAGE);
    const pageData = pageNode?.data as PageNodeData | undefined;

    const configuredWidth = toNumberOrNull(pageData?.width);
    const configuredHeight = toNumberOrNull(pageData?.height);

    const canvasWidth = Math.max(1, configuredWidth ?? viewportSize.width);
    const canvasHeight = Math.max(1, configuredHeight ?? viewportSize.height);

    return {
      width: Math.max(canvasWidth, viewportSize.width),
      height: Math.max(canvasHeight, viewportSize.height),
    };
  }, [nodes, viewportSize.height, viewportSize.width]);

  const pageBackgroundColor = useMemo(() => {
    const pageNode = nodes.find(node => node.type === NODE_TYPES.PAGE);
    const pageData = pageNode?.data as PageNodeData | undefined;
    return resolvePageBackgroundColor(pageData?.backgroundColor);
  }, [nodes]);

  // validate node connections based on the node input type
  const isValidConnection = useCallback((connection: Edge | Connection) => {
    const normalizedConnection = normalizeConnectionDirection(connection);
    if (!normalizedConnection) {
      return false;
    }

    const sourceHandle = normalizedConnection.sourceHandle;
    const targetHandle = normalizedConnection.targetHandle;
    const targetNode = nodes.find(node => node.id === normalizedConnection.target);

    // Disallow multiple connections between the same nodes
    const hasConnectionBetweenNodes = edges.some(
      (edge) =>
        (edge.source === normalizedConnection.source && edge.target === normalizedConnection.target)
        || (edge.source === normalizedConnection.target && edge.target === normalizedConnection.source)
    );

    const sourceType = sourceHandle?.split('-')[0];
    const targetType = targetHandle?.split('-')[0];

    if (sourceType !== targetType) {
      return false;
    }

    if (hasConnectionBetweenNodes) {
      return false;
    }

    const isTextNodeInput = String(targetNode?.type) === NODE_TYPES.TEXT
      && (targetType === 'turquoise' || targetType === 'sage');

    if (isTextNodeInput) {
      return true;
    }

    const rules = CONNECTION_RULES[targetType || ''];
    if (!rules?.allowMultiple) {
      const existingConnection = edges.find(
        (edge) => edge.target === normalizedConnection.target && edge.targetHandle === targetHandle
      );
      if (existingConnection) {
        return false;
      }
    }

    return true;
  }, [edges, nodes]);

  return (
    <div
      id="imywis-flow-scroll-container"
      className={animationsEnabled ? undefined : 'imywis-animations-disabled'}
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'auto' }}
    >
      <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '16px'}}>
        <p style={{fontSize: '10px'}}>{session.user.email}</p>
        <button onClick={handleLogout} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Logout</button>
      </div>
      <div
        style={{
          width: `${sceneSize.width}px`,
          height: `${sceneSize.height}px`,
          minWidth: '100%',
          minHeight: '100%',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={() => setAnimationsEnabled((value) => !value)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '328px',
            zIndex: 1000,
            borderRadius: '6px',
            border: '1px solid #8a8a8a',
            backgroundColor: animationsEnabled ? '#f3f7ff' : '#f5f5f5',
            color: '#202020',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {animationsEnabled ? 'Animations: ON' : 'Animations: OFF'}
        </button>
        <AutosaveToggle nodes={nodes} edges={edges} session={session} />
        <ExportP5Project nodes={nodes} edges={edges} session={session}/>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onNodeClick={onNodeClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          fitView
          style={{ width: '100%', height: '100%' }}
        >
          <P5Preview nodes={nodes} />
          <NodeStateTransfer />
          <AddPageNodeButton />
          <AddImageNodeButton />
          <AddBackgroundNodeButton />
          <AddTextNodeButton />
          <AddEventNodeButton />
          <AddExternalLinkNodeButton />
          <LatestSelectedPageNameBadge pageName={latestSelectedPageName} />
          <Background bgColor={pageBackgroundColor} />
        </ReactFlow>
      </div>
    </div>
  );
};

const resolvePageBackgroundColor = (value: unknown) => {
  if (typeof value !== 'string') {
    return '#ffffff';
  }

  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : '#ffffff';
};

const normalizeConnectionDirection = (connection: Edge | Connection): Connection | null => {
  const source = connection.source;
  const target = connection.target;
  const sourceHandle = connection.sourceHandle;
  const targetHandle = connection.targetHandle;

  if (!source || !target || !sourceHandle || !targetHandle) {
    return null;
  }

  const sourceRole = getHandleRole(sourceHandle);
  const targetRole = getHandleRole(targetHandle);

  if (sourceRole === 'output' && targetRole === 'input') {
    return {
      source,
      target,
      sourceHandle,
      targetHandle,
    };
  }

  if (sourceRole === 'input' && targetRole === 'output') {
    return {
      source: target,
      target: source,
      sourceHandle: targetHandle,
      targetHandle: sourceHandle,
    };
  }

  return null;
};

const getHandleRole = (handleId: string): 'input' | 'output' | null => {
  if (handleId.includes('-input')) {
    return 'input';
  }
  if (handleId.includes('-output')) {
    return 'output';
  }
  return null;
};

const resolveSelectedPageName = (value: unknown) => {
  if (typeof value !== 'string') {
    return 'Unnamed page';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'Unnamed page';
};

const normalizePersistedProjectData = (value: unknown): PersistedProjectData | null => {
  if (Array.isArray(value)) {
    const nodes = normalizePersistedNodes(value);
    if (!nodes) {
      return null;
    }

    return {
      nodes,
      edges: [],
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const nodesValue = value.nodes;
  const edgesValue = value.edges;
  const nodes = normalizePersistedNodes(nodesValue);
  const edges = normalizePersistedEdges(edgesValue);

  if (!nodes || !edges) {
    return null;
  }

  return {
    nodes,
    edges,
  };
};

const normalizePersistedNodes = (value: unknown): Node[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedNodes: Node[] = [];

  value.forEach((item) => {
    const candidate = item as PersistedNode;
    const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0
      ? candidate.id
      : null;
    const type = typeof candidate.type === 'string'
      && Object.values(NODE_TYPES).includes(candidate.type as typeof NODE_TYPES[keyof typeof NODE_TYPES])
      ? candidate.type
      : null;
    const positionX = typeof candidate.position?.x === 'number' ? candidate.position.x : 0;
    const positionY = typeof candidate.position?.y === 'number' ? candidate.position.y : 0;
    const data = isRecord(candidate.data) ? candidate.data : null;

    if (!id || !type || !data) {
      return;
    }

    parsedNodes.push({
      id,
      type,
      data: {
        label: typeof data.label === 'string' ? data.label : String(type),
        ...data,
      },
      position: {
        x: positionX,
        y: positionY,
      },
    });
  });

  return parsedNodes;
};

const normalizePersistedEdges = (value: unknown): Edge[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedEdges: Edge[] = [];

  value.forEach((item) => {
    if (!isRecord(item)) {
      return;
    }

    const id = typeof item.id === 'string' ? item.id : null;
    const source = typeof item.source === 'string' ? item.source : null;
    const target = typeof item.target === 'string' ? item.target : null;

    if (!id || !source || !target) {
      return;
    }

    parsedEdges.push({
      ...item,
      id,
      source,
      target,
    } as Edge);
  });

  return parsedEdges;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export default FlowCanvas;
