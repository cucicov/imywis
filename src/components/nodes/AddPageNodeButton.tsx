import {useReactFlow} from "@xyflow/react";
import {NODE_TYPES, type PageNodeData} from "../../types/nodeTypes.ts";

const AddPageNodeButton = () => {
    const { setNodes, getNodes } = useReactFlow();

    const addNode = () => {
        const data: PageNodeData = {
            label: NODE_TYPES.PAGE,
            name: '',
            width: 100,
            height: 100,
            mousePointer: ''
        };

        const newNode = {
            id: `${getNodes().length + 1}`,
            type: 'pageNode',
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
            Add Page Node
        </button>
    );
};

export default AddPageNodeButton;