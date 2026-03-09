import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useState, type ChangeEvent, type CSSProperties} from 'react';
import {updateNodeAndPropagate} from '../../utils/nodeUtils.ts';
import {NODE_TYPES, type BackgroundNodeData} from '../../types/nodeTypes';
import {HandleTypes} from '../../types/handleTypes';

const selectStyle: CSSProperties = {
    fontSize: '11px',
    width: '100px',
    border: 0,
    background: '#fff',
    opacity: 0.8,
    color: 'black',
};

const inputStyle: CSSProperties = {
    fontSize: '11px',
    width: '50px',
    border: 0,
    background: '#fff',
    opacity: 0.8,
    color: 'black',
};

const checkboxStyle: CSSProperties = {
    width: '14px',
    height: '14px',
    cursor: 'pointer',
    accentColor: '#24303A',
    opacity: 0.8,
};

const BackgroundNode = ({id, data}: NodeProps<Node<BackgroundNodeData, typeof NODE_TYPES.BACKGROUND>>) => {
    const {setNodes, getEdges} = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(true);

    const onFieldChange = useCallback((evt: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {id: targetId, value} = evt.target;
        const field = targetId.replace('field-', '');

        const newValue = evt.target instanceof HTMLInputElement && evt.target.type === 'checkbox'
            ? evt.target.checked
            : value;

        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, field, newValue));
    }, [getEdges, id, setNodes]);

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
                type="target"
                position={Position.Top}
                id={HandleTypes.ORANGE_INPUT}
                style={{
                    left: '50%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D',
                    border: '1px solid black',
                }}
            />

            <Handle
                type="source"
                position={Position.Bottom}
                id={HandleTypes.RED_OUTPUT}
                style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#D05774',
                    border: '1px solid white',
                }}
            />

            <b>{data.label + '-' + id}</b>
            <div style={{display: 'flex'}}>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
                    <label style={{fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap'}}>style:</label>
                    <label style={{fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap'}}>width(px):</label>
                    <label style={{fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap'}}>height(px):</label>
                </div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <select
                        id="field-style"
                        className="nodrag"
                        value={data.style ?? 'tile'}
                        onChange={onFieldChange}
                        style={selectStyle}
                    >
                        <option value="tile">tile</option>
                        <option value="fullscreen">fullscreen</option>
                        <option value="stretch">stretch</option>
                        <option value="contain">contain</option>
                    </select>

                    <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <input
                            id="field-width"
                            className="nodrag"
                            type="number"
                            value={data.width ?? ''}
                            onChange={onFieldChange}
                            style={inputStyle}
                        />
                        <label style={{fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap'}}>auto</label>
                        <input
                            id="field-autoWidth"
                            className="nodrag"
                            type="checkbox"
                            checked={data.autoWidth ?? false}
                            onChange={onFieldChange}
                            style={checkboxStyle}
                        />
                    </div>

                    <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                        <input
                            id="field-height"
                            className="nodrag"
                            type="number"
                            value={data.height ?? ''}
                            onChange={onFieldChange}
                            style={inputStyle}
                        />
                        <label style={{fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap'}}>auto</label>
                        <input
                            id="field-autoHeight"
                            className="nodrag"
                            type="checkbox"
                            checked={data.autoHeight ?? false}
                            onChange={onFieldChange}
                            style={checkboxStyle}
                        />
                    </div>
                </div>
            </div>

            {data.metadata && data.metadata.sourceNodes.length > 0 && (
                <div style={{marginTop: '10px', padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.25)'}}>
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
                            gap: '3px',
                        }}
                    >
                        <span>{metadataExpanded ? '▼' : '▶'}</span>
                        <span>Metadata ({data.metadata.sourceNodes.length})</span>
                    </div>
                    {metadataExpanded && data.metadata.sourceNodes.map((source, idx) => (
                        <div key={idx} style={{fontSize: '8px', marginBottom: '5px', background: 'rgba(255,255,255,0.08)', padding: '4px', borderRadius: '3px'}}>
                            <div style={{marginBottom: '2px'}}><b>Node:</b> {source.type} ({source.nodeId})</div>
                            <div style={{marginBottom: '3px'}}><b>Handle:</b> {source.handleType}</div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '3px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Data:</div>
                                {Object.entries(source.data).map(([key, value]) => (
                                    key === 'metadata' ? (
                                        <div key={key} style={{ marginLeft: '5px', marginTop: '3px', padding: '3px', background: 'rgba(255,200,0,0.2)', borderRadius: '2px', border: '1px solid rgba(255,200,0,0.5)' }}>
                                            <div style={{ fontWeight: 'bold', color: '#FFD700' }}>Nested Metadata:</div>
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

export default BackgroundNode;
