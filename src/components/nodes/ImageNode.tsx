import { Handle, Position, useReactFlow, type Node, type NodeProps  } from '@xyflow/react';
import {useCallback, type ChangeEvent} from 'react';

export type ImageNodeData = {
    label: string;
    path?: string;
    width?: number;
    height?: number;
    autoWidth?: boolean;
    autoHeight?: boolean;
    positionX?: number;
    positionY?: number;
    opacity?: number;
};

const ImageNode = ({ id, data }: NodeProps<Node<ImageNodeData, 'imageNode'>>) => {
    const { setNodes, getEdges } = useReactFlow();
    data = {...data, label: 'Image'};

    const onTextChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const { id: targetId, value, type, checked } = evt.target;
        const newValue = type === 'checkbox' ? checked : value;
        const field = targetId.replace('field-', '');

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [field]: newValue, //TODO: move this logic also to pageNode.
                        },
                    };
                }

                // Update any nodes connected to this node
                const edges = getEdges();
                const outgoingEdges = edges.filter((edge) => edge.source === id);

                if (outgoingEdges.some((edge) => edge.target === node.id)) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: newValue as string,
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
            borderRadius: '15px',
            background: '#FBB38D',
            color: '#222',
            border: '1px solid white',
            fontSize: '12px',
        }}>
            <Handle
                key={`input-0`}
                type="target"
                position={Position.Top}
                id={`input-0`}
                style={{
                    left: `25%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#6BC8CD'
                }}
            />
            <Handle
                key={`input-1`}
                type="target"
                position={Position.Top}
                id={`input-1`}
                style={{
                    left: `50%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#CDD8C7'
                }}
            />
            <Handle
                key={`input-2`}
                type="target"
                position={Position.Top}
                id={`input-2`}
                style={{
                    left: `75%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D'
                }}
            />
            <b>{data.label}</b>
            <div style={{display: 'flex'}}>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
                    <label style={{ fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap' }}>path:</label>
                    <label style={{ fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap' }}>width(px):</label>
                    <label style={{ fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap' }}>height(px):</label>
                    <label style={{ fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap' }}>position-x:</label>
                    <label style={{ fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap' }}>position-y:</label>
                    <label style={{ fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap' }}>opacity:</label>
                </div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '3px'}}>
                    <input
                        id="field-path"
                        className="nodrag"
                        type="text"
                        value={data.path ?? ''}
                        onChange={onTextChange}
                        style={{ fontSize: '10px', width: '100px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                    />
                    <div style={{display: 'flex', flexDirection: 'row', gap: '0px'}}>
                        <div>
                            <input
                                id="field-width"
                                className="nodrag"
                                type="number"
                                value={data.width ?? ''}
                                onChange={onTextChange}
                                style={{ fontSize: '10px', width: '50px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap' }}>auto:</label>
                        </div>
                        <div>
                            <input
                                id="field-autoWidth"
                                className="nodrag"
                                type="checkbox"
                                checked={data.autoWidth ?? false}
                                onChange={onTextChange}
                                style={{
                                    fontSize: '11px',
                                    width: '14px',
                                    height: '14px',
                                    cursor: 'pointer',
                                    accentColor: '#792D05',
                                    opacity: 0.7
                                }}
                            />
                        </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '0px'}}>
                        <div>
                            <input
                                id="field-height"
                                className="nodrag"
                                type="number"
                                value={data.height ?? ''}
                                onChange={onTextChange}
                                style={{ fontSize: '11px', width: '50px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', color: '#792D05', whiteSpace: 'nowrap' }}>auto:</label>
                        </div>
                        <div>
                            <input
                                id="field-autoHeight"
                                className="nodrag"
                                type="checkbox"
                                checked={data.autoHeight ?? false}
                                onChange={onTextChange}
                                style={{
                                    fontSize: '11px',
                                    width: '14px',
                                    height: '14px',
                                    cursor: 'pointer',
                                    accentColor: '#792D05',
                                    opacity: 0.7
                                }}
                            />
                        </div>
                    </div>
                    <input
                        id="field-positionX"
                        className="nodrag"
                        type="text"
                        value={data.positionX ?? ''}
                        onChange={onTextChange}
                        style={{ fontSize: '11px', width: '100px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                    />
                    <input
                        id="field-positionY"
                        className="nodrag"
                        type="text"
                        value={data.positionY ?? ''}
                        onChange={onTextChange}
                        style={{ fontSize: '11px', width: '100px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                    />
                    <input
                        id="field-opacity"
                        className="nodrag"
                        type="text"
                        value={data.opacity ?? ''}
                        onChange={onTextChange}
                        style={{ fontSize: '11px', width: '100px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <Handle type="source" position={Position.Bottom}
                key={`output-0`}
                id={`output-0`}
                style={{
                    left: `33%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D'
                }}
            />
            <Handle type="source" position={Position.Bottom}
                key={`output-1`}
                id={`output-1`}
                style={{
                    left: `66%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#D05774'
                }}
            />
        </div>
    );
};

export default ImageNode;
