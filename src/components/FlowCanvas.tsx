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
import CustomNode, {type CustomNodeData } from './CustomNode';
import AddNodeButton from './AddNodeButton';

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'Custom Node', text: '' } as CustomNodeData,
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

  useEffect(() => {
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        // Find all edges where this node is the target
        const incomingEdges = edges.filter((edge) => edge.target === node.id);

        if (incomingEdges.length > 0) {
          // Get the source node's text from the first incoming edge
          const sourceNodeId = incomingEdges[0].source;
          const sourceNode = currentNodes.find((n) => n.id === sourceNodeId);

          if (sourceNode && sourceNode.data.text) {
            // Update this node's label with the source node's text
            return {
              ...node,
              data: {
                ...node.data,
                label: sourceNode.data.text,
              },
            };
          }
        }
        return node;
      });
    });
  }, [edges, setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <AddNodeButton />
        <Background/>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
