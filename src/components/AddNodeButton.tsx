import {useReactFlow} from "@xyflow/react";
import {type CustomNodeData } from './CustomNode';

const AddNodeButton = () => {
    const { setNodes, getNodes } = useReactFlow();

    const addNode = () => {
        const data: CustomNodeData = {
            label: 'New Node',
            text: '',
        };

        const newNode = {
            id: `${getNodes().length + 1}`,
            type: 'custom',
            data,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
        };
        setNodes((nodes) => [...nodes, newNode]);
    };

    return (
        <button
            onClick={addNode}
            style={{
                position: 'absolute',
                top: '10px',
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
            Add Node
        </button>
    );
};

export default AddNodeButton;