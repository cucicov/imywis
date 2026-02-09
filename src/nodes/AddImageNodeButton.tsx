import {useReactFlow} from "@xyflow/react";
import {type ImageNodeData } from './ImageNode.tsx';

const AddPageNodeButton = () => {
    const { setNodes, getNodes } = useReactFlow();

    const addNode = () => {
        const data: ImageNodeData = {
            label: 'Image',
            path: '',
            width: 100,
            height: 100,
            autoWidth: false,
            autoHeight: false,
            positionX: 0,
            positionY: 0,
            opacity: 1
        };

        const newNode = {
            id: `${getNodes().length + 1}`,
            type: 'imageNode',
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
                top: '60px',
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
            Add Image Node
        </button>
    );
};

export default AddPageNodeButton;