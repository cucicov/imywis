import {useReactFlow, useStoreApi} from '@xyflow/react';
import {NODE_TYPES, type SoundNodeData} from '../../../types/nodeTypes.ts';

const AddSoundNodeButton = () => {
    const {setNodes, getNodes} = useReactFlow();
    const store = useStoreApi();

    const addNode = () => {
        const data: SoundNodeData = {label: NODE_TYPES.SOUND, path: '', autoplay: false, loop: false};
        const currentNodes = getNodes();
        const maxId = currentNodes.length ? Math.max(...currentNodes.map(item => Number(item.id) || 0)) : 0;
        const {width, height, transform} = store.getState();
        const [translateX, translateY, zoom] = transform;
        const container = document.getElementById('imywis-flow-scroll-container');
        const centerPosition = {
            x: ((container ? container.scrollLeft + container.clientWidth / 2 : width / 2) - translateX) / zoom,
            y: ((container ? container.scrollTop + container.clientHeight / 2 : height / 2) - translateY) / zoom,
        };
        setNodes(nodes => [...nodes, {id: `${maxId + 1}`, type: NODE_TYPES.SOUND, data, position: centerPosition}]);
    };

    return <button onClick={addNode} style={{position: 'absolute', top: '85px', left: '10px', zIndex: 10, padding: '10px 20px', backgroundColor: '#1a192b', color: '#FBB38D', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px'}}>Sound Node</button>;
};

export default AddSoundNodeButton;
