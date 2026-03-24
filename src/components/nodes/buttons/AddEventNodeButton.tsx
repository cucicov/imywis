import {useReactFlow} from '@xyflow/react';
import {NODE_TYPES, type EventNodeData} from '../../../types/nodeTypes.ts';

const AddEventNodeButton = () => {
    const {setNodes, getNodes} = useReactFlow();

    const addNode = () => {
        const data: EventNodeData = {
            label: NODE_TYPES.EVENT,
            type: 'click',
        };

        const currentNodes = getNodes();
        const maxId = currentNodes.length > 0 ? Math.max(...currentNodes.map(item => Number(item.id) || 0)) : 0;

        const newNode = {
            id: `${maxId + 1}`,
            type: NODE_TYPES.EVENT,
            data,
            position: {x: Math.random() * 400, y: Math.random() * 400},
        };

        setNodes((nodes) => [...nodes, newNode]);
    };

    return (
        <button
            onClick={addNode}
            style={{
                position: 'absolute',
                top: '210px',
                left: '10px',
                zIndex: 10,
                padding: '10px 20px',
                backgroundColor: '#1a192b',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
            }}
        >
            Add Event Node
        </button>
    );
};

export default AddEventNodeButton;
