import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useState, type ChangeEvent} from 'react';
import {updateCurrentNode} from "../../utils/nodeUtils.ts";
import {NODE_TYPES, type PageNodeData} from '../../types/nodeTypes';
import { HandleTypes } from '../../types/handleTypes';


const PageNode = ({ id, data }: NodeProps<Node<PageNodeData, typeof NODE_TYPES.PAGE>>) => {
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
            background: '#D05774',
            color: '#222',
            border: '1px solid white',
            fontSize: '12px',
        }}>
            {/*------------------- inputs ------------------- */}
            <Handle
                key="input-0"
                type="target"
                position={Position.Top}
                id={HandleTypes.RED_INPUT}
                style={{
                    left: `50%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#D05774'
                }}
            />
            {/*------------------- outputs ------------------- */}
            <Handle
                type="source"
                id={HandleTypes.RED_OUTPUT}
                position={Position.Bottom}
                style={{ width: '10px', height: '10px', backgroundColor: '#D05774' }}
            />

            <b>{data.label + "-" + id}</b>
            <div style={{display: 'flex'}}>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
                    <label style={{ fontSize: '10px', color: '#57212E', whiteSpace: 'nowrap' }}>name:</label>
                    <label style={{ fontSize: '10px', color: '#57212E', whiteSpace: 'nowrap' }}>width(px):</label>
                    <label style={{ fontSize: '10px', color: '#57212E', whiteSpace: 'nowrap' }}>height(px):</label>
                    <label style={{ fontSize: '10px', color: '#57212E', whiteSpace: 'nowrap' }}>mousePointer:</label>
                </div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <input
                        id="field-name"
                        className="nodrag"
                        type="text"
                        value={data.name ?? ''}
                        onChange={onTextChange}
                        style={{ fontSize: '11px', width: '100px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                    />
                    <input
                        id="field-width"
                        className="nodrag"
                        type="number"
                        value={data.width ?? ''}
                        onChange={onTextChange}
                        style={{ fontSize: '11px', width: '50px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                    />
                    <input
                        id="field-height"
                        className="nodrag"
                        type="number"
                        value={data.height ?? ''}
                        onChange={onTextChange}
                        style={{ fontSize: '11px', width: '50px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}}
                    />
                    <input
                        id="field-mouse"
                        className="nodrag"
                        type="text"
                        value={data.mousePointer ?? ''}
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

export default PageNode;
