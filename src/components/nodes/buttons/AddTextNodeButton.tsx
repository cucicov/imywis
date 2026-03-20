import {useReactFlow} from '@xyflow/react';
import {NODE_TYPES, type TextNodeData} from '../../../types/nodeTypes.ts';

const AddTextNodeButton = () => {
    const {setNodes, getNodes} = useReactFlow();

    const addNode = () => {
        const data: TextNodeData = {
            label: NODE_TYPES.TEXT,
            text: '',
            font: 'sans-serif',
            size: 16,
            width: 250,
            height: 120,
            positionX: 0,
            positionY: 0,
            opacity: 1,
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            caps: false,
        };

        const currentNodes = getNodes();
        const maxId = currentNodes.length > 0 ? Math.max(...currentNodes.map(item => Number(item.id) || 0)) : 0;

        const newNode = {
            id: `${maxId + 1}`,
            type: NODE_TYPES.TEXT,
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
                top: '160px',
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
            Add Text Node
        </button>
    );
};

export default AddTextNodeButton;
