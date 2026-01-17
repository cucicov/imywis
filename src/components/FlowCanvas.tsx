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

  const addNode = () => {
    const data: CustomNodeData = {
      label: 'New Node',
      text: '',
    };

    const newNode = {
      id: `${nodes.length + 1}`,
      type: 'custom',
      data,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes([...nodes, newNode]);
  };

  // const updateNodeLabel = (nodeId: string, newLabel: string) => {
  //   setNodes(nodes.map(node =>
  //       node.id === nodeId
  //           ? { ...node, data: { ...node.data, label: newLabel } }
  //           : node
  //   ));
  // };

  // const removeNode = (nodeId: string) => {
  //   setNodes(nodes.filter(node => node.id !== nodeId));
  // };

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
      <AddNodeButton onClick={addNode} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background/>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
