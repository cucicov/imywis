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
            scale: 1,
            autoWidth: false,
            autoHeight: false,
            positionX: 0,
            positionY: 0,
            positionXRandomStart: 0,
            positionXRandomEnd: 300,
            positionXRandomStep: 1,
            positionYRandomStart: 0,
            positionYRandomEnd: 300,
            positionYRandomStep: 1,
            opacity: 1
        };
        const { width, height, transform } = store.getState();
        const [translateX, translateY, zoom] = transform;
        const flowScrollContainer = document.getElementById('imywis-flow-scroll-container');
        const viewportCenterX = flowScrollContainer
            ? flowScrollContainer.scrollLeft + (flowScrollContainer.clientWidth / 2)
            : width / 2;
        const viewportCenterY = flowScrollContainer
            ? flowScrollContainer.scrollTop + (flowScrollContainer.clientHeight / 2)
            : height / 2;
        const centerPosition = {
            x: (viewportCenterX - translateX) / zoom,
            y: (viewportCenterY - translateY) / zoom,
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
                color: '#FBB38D',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
            }}
        >
            Image Node
        </button>
    );
};

export default AddPageNodeButton;
