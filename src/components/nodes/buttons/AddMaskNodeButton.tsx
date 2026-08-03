import {useReactFlow, useStoreApi} from '@xyflow/react';
import {NODE_TYPES, type MaskNodeData} from '../../../types/nodeTypes.ts';

const AddMaskNodeButton = () => {
    const {setNodes, getNodes} = useReactFlow();
    const store = useStoreApi();

    const addNode = () => {
        const data: MaskNodeData = {
            label: NODE_TYPES.MASK,
            width: 300,
            height: 180,
            positionX: 0,
            positionY: 0,
            backgroundColor: '#ffffff',
        };
        const currentNodes = getNodes();
        const maxId = currentNodes.length > 0
            ? Math.max(...currentNodes.map((node) => Number(node.id) || 0))
            : 0;
        const {width, height, transform} = store.getState();
        const [translateX, translateY, zoom] = transform;
        const flowScrollContainer = document.getElementById('imywis-flow-scroll-container');
        const viewportCenterX = flowScrollContainer
            ? flowScrollContainer.scrollLeft + (flowScrollContainer.clientWidth / 2)
            : width / 2;
        const viewportCenterY = flowScrollContainer
            ? flowScrollContainer.scrollTop + (flowScrollContainer.clientHeight / 2)
            : height / 2;

        setNodes((nodes) => [...nodes, {
            id: `${maxId + 1}`,
            type: NODE_TYPES.MASK,
            data,
            position: {
                x: (viewportCenterX - translateX) / zoom,
                y: (viewportCenterY - translateY) / zoom,
            },
        }]);
    };

    return <button type="button" onClick={addNode}
                   style={{
                       position: 'absolute',
                       top: '110px',
                       left: '10px',
                       zIndex: 10,
                       padding: '10px 20px',
                       backgroundColor: '#1a192b',
                       color: '#CDD8C7',
                       border: 'none',
                       borderRadius: '5px',
                       cursor: 'pointer',
                       fontSize: '14px',
                   }}>Mask Node</button>;
};

export default AddMaskNodeButton;
