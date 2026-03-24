import {useReactFlow, useStoreApi} from "@xyflow/react";
import {type ImageNodeData, NODE_TYPES} from "../../../types/nodeTypes.ts";

const AddPageNodeButton = () => {
    const { setNodes, getNodes } = useReactFlow();
    const store = useStoreApi();

    const addNode = () => {
        const data: ImageNodeData = {
            label: NODE_TYPES.IMAGE,
            path: '',
            width: 100,
            height: 100,
            autoWidth: false,
            autoHeight: false,
            positionX: 0,
            positionY: 0,
            opacity: 1
        };
        const { width, height, transform } = store.getState();
        const [translateX, translateY, zoom] = transform;
        const centerPosition = {
            x: (width / 2 - translateX) / zoom,
            y: (height / 2 - translateY) / zoom,
        };

        const newNode = {
            id: `${Math.max(...getNodes().map(item => Number(item.id))) + 1}`,
            type: 'imageNode',
            data,
            position: centerPosition,
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
