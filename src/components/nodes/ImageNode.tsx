import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useState, type ChangeEvent} from 'react';
import {updateCurrentNode} from "../../utils/nodeUtils.ts";
import {NODE_TYPES, type ImageNodeData} from '../../types/nodeTypes';
import { HandleTypes } from '../../types/handleTypes';

const ImageNode = ({ id, data }: NodeProps<Node<ImageNodeData, typeof NODE_TYPES.IMAGE>>) => {
    const { setNodes } = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(true);

    const onTextChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const { id: targetId, value, type, checked } = evt.target;
        const newValue = type === 'checkbox' ? checked : value;
        const field = targetId.replace('field-', '');

        setNodes((nds) => {
            return nds.map((node) => {
                if (node.id === id) {
                    return updateCurrentNode(node, field, newValue);
                }
                return node;
            });
        });
    }, [id, setNodes]);

    return (
        <div style={{
            padding: '10px',
            borderRadius: '15px',
            background: '#FBB38D',
            color: '#222',
            border: '1px solid white',
            fontSize: '12px',
        }}>
            {/*------------------- inputs ------------------- */}
            <Handle
                key="input-0"
                type="target"
                position={Position.Top}
                id={HandleTypes.TURQUOISE_INPUT}
                style={{
                    left: `25%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#6BC8CD'
                }}
            />
            <Handle
                key="input-1"
                type="target"
                position={Position.Top}
                id={HandleTypes.SAGE_INPUT}
                style={{
                    left: `50%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#CDD8C7'
                }}
            />
            <Handle
                key="input-2"
                type="target"
                position={Position.Top}
                id={HandleTypes.ORANGE_INPUT}
                style={{
                    left: `75%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D'
                }}
            />
            {/*------------------- outputs ------------------- */}
            <Handle type="source" position={Position.Bottom}
                    key="output-0"
                    id={HandleTypes.ORANGE_OUTPUT}
                    style={{
                        left: `33%`,
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#FBB38D'
                    }}
            />
            <Handle type="source" position={Position.Bottom}
                    key="output-1"
                    id={HandleTypes.RED_OUTPUT}
                    style={{
                        left: `66%`,
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#D05774'
                    }}
            />

            <b>{data.label + "-" + id}</b>
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
            
            {data.metadata && data.metadata.sourceNodes.length > 0 && (
                <div style={{ marginTop: '10px', padding: '5px', background: 'rgba(0,0,0,0.15)', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <div 
                        className="nodrag"
                        onClick={() => setMetadataExpanded(!metadataExpanded)}
                        style={{ 
                            fontSize: '9px', 
                            fontWeight: 'bold', 
                            marginBottom: metadataExpanded ? '5px' : '0', 
                            color: '#fff',
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                        }}
                    >
                        <span>{metadataExpanded ? '▼' : '▶'}</span>
                        <span>📦 Metadata ({data.metadata.sourceNodes.length})</span>
                    </div>
                    {metadataExpanded && data.metadata.sourceNodes.map((source, idx) => (
                        <div key={idx} style={{ fontSize: '8px', marginBottom: '5px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '3px' }}>
                            <div style={{ marginBottom: '2px' }}><b>Node:</b> {source.nodeType} ({source.nodeId})</div>
                            <div style={{ marginBottom: '3px' }}><b>Handle:</b> {source.handleType}</div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '3px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Data:</div>
                                {Object.entries(source.data).map(([key, value]) => (
                                    key === 'metadata' ? (
                                        <div key={key} style={{ marginLeft: '5px', marginTop: '3px', padding: '3px', background: 'rgba(255,200,0,0.2)', borderRadius: '2px', border: '1px solid rgba(255,200,0,0.5)' }}>
                                            <div style={{ fontWeight: 'bold', color: '#FFD700' }}>🔗 Nested Metadata:</div>
                                            <pre style={{ margin: '2px 0 0 0', fontSize: '7px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                {JSON.stringify(value, null, 2)}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div key={key} style={{ marginLeft: '5px', lineHeight: '1.4' }}>
                                            <b>{key}:</b> {JSON.stringify(value)}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageNode;
