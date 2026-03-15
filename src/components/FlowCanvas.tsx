import {
  ReactFlow,
  useNodesState,
  useEdgesState, Background,
  addEdge,
  type Connection,
  type Edge,
} from '@xyflow/react';

import { useCallback, useEffect, useMemo, useState } from 'react';

import '@xyflow/react/dist/style.css';
import PageNode from './nodes/PageNode.tsx';
import AddPageNodeButton from './nodes/AddPageNodeButton.tsx';
import AddImageNodeButton from "./nodes/AddImageNodeButton.tsx";
import ImageNode from "./nodes/ImageNode.tsx";
import NodeStateTransfer from "./nodes/NodeStateTransfer.tsx";
import type {PageNodeData} from "../types/nodeTypes.ts";
import {syncNodeDataFromSource, removeSourceNodeMetadata} from "../utils/nodeUtils.ts";
import {NODE_TYPES} from '../types/nodeTypes';
import {CONNECTION_RULES} from "../types/handleTypes.ts";
import P5Preview from './P5Preview.tsx';
import ExportP5Project from './ExportP5Project.tsx';
import BackgroundNode from './nodes/BackgroundNode.tsx';
import AddBackgroundNodeButton from './nodes/AddBackgroundNodeButton.tsx';
import {toNumberOrNull} from '../utils/numberUtils.ts';

const nodeTypes = {
  pageNode: PageNode,
  imageNode: ImageNode,
  backgroundNode: BackgroundNode,
};

const initialNodes = [
  {
    id: '1',
    type: NODE_TYPES.PAGE,
    data: {label: NODE_TYPES.PAGE, name: 'index.html', backgroundColor: '#ffffff'} as PageNodeData,
    position: { x: 250, y: 5 },
  }
];

const initialEdges: Edge[] = [];


const FlowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  const onConnect = useCallback(
      (connection: Connection) => {
        setEdges((eds) => addEdge(connection, eds));
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

        // Remove metadata for disconnected sources
        if (node.data.metadata?.sourceNodes) {
          node.data.metadata.sourceNodes.forEach((source: { nodeId: string; handleType: string }) => {
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
    const sourceHandle = connection.sourceHandle;
    const targetHandle = connection.targetHandle;

    const sourceType = sourceHandle?.split('-')[0];
    const targetType = targetHandle?.split('-')[0];

    if (sourceType !== targetType) {
      return false;
    }

    const rules = CONNECTION_RULES[targetType || ''];
    if (!rules?.allowMultiple) {
      const existingConnection = edges.find(
        (edge) => edge.target === connection.target && edge.targetHandle === targetHandle
      );
      if (existingConnection) {
        return false;
      }
    }

    return true;
  }, [edges]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'auto' }}>
      <div
        style={{
          width: `${sceneSize.width}px`,
          height: `${sceneSize.height}px`,
          minWidth: '100%',
          minHeight: '100%',
          position: 'relative',
        }}
      >
        <ExportP5Project nodes={nodes} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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

export default FlowCanvas;
