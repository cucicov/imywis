import { Handle, Position, useReactFlow, type Node, type NodeProps  } from '@xyflow/react';
import { useCallback, type ChangeEvent } from 'react';

export type CustomNodeData = {
    label: string;
    text?: string;
};

export type CustomNodeType = Node<CustomNodeData, 'custom'>;

const CustomNode = ({ id, data }: NodeProps<CustomNodeType>) => {
    const { setNodes, getEdges } = useReactFlow();

    const onTextChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const newText = evt.target.value;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            text: newText,
                        },
                    };
                }

                // Update any nodes connected to this node
                const edges = getEdges();

                // all edges from the current node pointing to other nodes.
                const outgoingEdges = edges.filter((edge) => edge.source === id);

                // if at least one of those edges points to this node, update its label.
                if (outgoingEdges.some((edge) => edge.target === node.id)) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: newText,
                        },
                    };
                }

                return node;
            })
        );
    }, [id, setNodes, getEdges]);

    return (
        <div style={{
            padding: '10px',
            borderRadius: '5px',
            background: '#fff',
            color: '#222',
            border: '1px solid #1a192b',
            fontSize: '12px',
        }}>
            {/* ... existing handles ... */}
            <Handle
                type="target"
                position={Position.Top}
                id="input-1"
                style={{ left: '25%' }}
            />
            <Handle
                type="target"
                position={Position.Top}
                id="input-2"
                style={{ left: '75%' }}
            />
            <div>
                <b>{data.label}</b>
                <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#666' }}>Content:</label>
                    <input
                        className="nodrag"
                        type="text"
                        value={data.text ?? ''}
                        onChange={onTextChange}
                        placeholder="Type something..."
                        style={{ fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default CustomNode;
