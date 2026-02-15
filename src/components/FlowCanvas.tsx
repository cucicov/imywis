import {
  ReactFlow,
  useNodesState,
  useEdgesState, Background,
  addEdge,
  type Connection,
  type Edge,
} from '@xyflow/react';

import { useCallback, useEffect } from 'react';

import '@xyflow/react/dist/style.css';
import PageNode from './nodes/PageNode.tsx';
import AddPageNodeButton from './nodes/AddPageNodeButton.tsx';
import AddImageNodeButton from "./nodes/AddImageNodeButton.tsx";
import ImageNode from "./nodes/ImageNode.tsx";
import type {PageNodeData} from "../types/nodeTypes.ts";
import {syncNodeDataFromSource} from "../utils/nodeUtils.ts";
import {NODE_TYPES} from '../types/nodeTypes';
import {CONNECTION_RULES} from "../types/handleTypes.ts";

const nodeTypes = {
  pageNode: PageNode,
  imageNode: ImageNode
};

const initialNodes = [
  {
    id: 'node-id-1',
    type: NODE_TYPES.PAGE,
    data: {} as PageNodeData,
    position: { x: 250, y: 5 },
  }
];

const initialEdges: Edge[] = [];


const FlowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
      (connection: Connection) => {
        setEdges((eds) => addEdge(connection, eds));
      },
      [setEdges]
  );

  // Update target nodes when connections change
  useEffect(() => {
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        const incomingEdge = edges.find((edge) => edge.target === node.id);
        if (incomingEdge) {
          const sourceNode = currentNodes.find((n) => n.id === incomingEdge.source);
          return syncNodeDataFromSource(node, sourceNode) as typeof node;
        }
        return node;
      });
    });
  }, [edges, setNodes]);


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
    <div style={{ width: '100vw', height: '100vh' }}>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        fitView
      >
        <AddPageNodeButton />
        <AddImageNodeButton />
        <Background/>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
