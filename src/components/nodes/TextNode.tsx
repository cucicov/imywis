import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useState, type ChangeEvent, type CSSProperties} from 'react';
import {updateNodeAndPropagate} from '../../utils/nodeUtils.ts';
import {NODE_TYPES, type TextNodeData} from '../../types/nodeTypes';
import {HandleTypes} from '../../types/handleTypes';
import {APP_CONFIG} from '../../config/appConfig.ts';

const labelStyle: CSSProperties = {
    fontSize: '10px',
    color: '#792D05',
    whiteSpace: 'nowrap',
};

const inputStyle: CSSProperties = {
    fontSize: '11px',
    width: '150px',
    border: 0,
    background: '#fff',
    opacity: 0.8,
    color: 'black',
};

const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '4px',
};

const rowLabelStyle: CSSProperties = {
    ...labelStyle,
    width: '70px',
    flexShrink: 0,
    lineHeight: '18px',
};

const TextNode = ({id, data}: NodeProps<Node<TextNodeData, typeof NODE_TYPES.TEXT>>) => {
    const {setNodes, getEdges} = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(APP_CONFIG.metadataExpandedByDefault);

    const onFieldChange = useCallback((evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {id: targetId, value} = evt.target;
        const field = targetId.replace('field-', '');
        const newValue = evt.target instanceof HTMLInputElement && evt.target.type === 'checkbox'
            ? evt.target.checked
            : value;

        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, field, newValue));
    }, [getEdges, id, setNodes]);

    return (
        <div
            className={`imywis-node-shell${data.connectionImpactKey ? ' imywis-node-shell--impact' : ''}`}
            style={{
            padding: '10px',
            borderRadius: '15px',
            background: '#FBB38D',
            color: '#222',
            border: '1px solid white',
            fontSize: '12px',
            width: '280px',
        }}>
            <Handle
                type="target"
                position={Position.Top}
                id={HandleTypes.TURQUOISE_INPUT}
                style={{
                    left: '25%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#6BC8CD',
                    border: '1px solid black',
                }}
            />
            <Handle
                type="target"
                position={Position.Top}
                id={HandleTypes.SAGE_INPUT}
                style={{
                    left: '50%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#CDD8C7',
                    border: '1px solid black',
                }}
            />
            <Handle
                type="source"
                position={Position.Top}
                id={HandleTypes.ORANGE_OUTPUT_2}
                style={{
                    left: '75%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D',
                    border: '1px solid white',
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id={HandleTypes.ORANGE_OUTPUT}
                style={{
                    left: '33%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D',
                    border: '1px solid white',
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id={HandleTypes.RED_OUTPUT}
                style={{
                    left: '66%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#D05774',
                    border: '1px solid white',
                }}
            />

            <b>{data.label + '-' + id}</b>
            <div style={{marginTop: '6px'}}>
                <div style={rowStyle}>
                    <label htmlFor="field-text" style={rowLabelStyle}>text:</label>
                    <textarea
                        id="field-text"
                        className="nodrag"
                        value={data.text ?? ''}
                        onChange={onFieldChange}
                        rows={4}
                        style={{
                            ...inputStyle,
                            resize: 'vertical',
                            minHeight: '60px',
                        }}
                    />
                </div>

                <div style={rowStyle}>
                    <label htmlFor="field-font" style={rowLabelStyle}>font:</label>
                    <div>
                        <select
                        id="field-font"
                        className="nodrag"
                        value={data.font ?? 'sans-serif'}
                        onChange={onFieldChange}
                        style={inputStyle}
                    >
                            <option value="sans-serif">Default</option>
                        </select>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px 10px', marginTop: '4px', maxWidth: '170px'}}>
                            {[
                                {id: 'bold', label: 'bold'},
                                {id: 'italic', label: 'italic'},
                                {id: 'underline', label: 'underline'},
                                {id: 'strikethrough', label: 'strikethrough'},
                                {id: 'caps', label: 'CAPS'},
                            ].map((option) => (
                                <label key={option.id} style={{fontSize: '10px', color: '#792D05', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <input
                                        id={`field-${option.id}`}
                                        className="nodrag"
                                        type="checkbox"
                                        checked={Boolean(data[option.id as keyof TextNodeData])}
                                        onChange={onFieldChange}
                                        style={{width: '14px', height: '14px', accentColor: '#792D05', opacity: 0.8}}
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={rowStyle}>
                    <label htmlFor="field-size" style={rowLabelStyle}>size:</label>
                    <input
                        id="field-size"
                        className="nodrag"
                        type="number"
                        min={1}
                        value={data.size ?? ''}
                        onChange={onFieldChange}
                        style={inputStyle}
                    />
                </div>

                <div style={rowStyle}>
                    <label htmlFor="field-width" style={rowLabelStyle}>width(px):</label>
                    <input
                        id="field-width"
                        className="nodrag"
                        type="number"
                        min={0}
                        value={data.width ?? ''}
                        onChange={onFieldChange}
                        style={inputStyle}
                    />
                </div>

                <div style={rowStyle}>
                    <label htmlFor="field-height" style={rowLabelStyle}>height(px):</label>
                    <input
                        id="field-height"
                        className="nodrag"
                        type="number"
                        min={0}
                        value={data.height ?? ''}
                        onChange={onFieldChange}
                        style={inputStyle}
                    />
                </div>

                <div style={rowStyle}>
                    <label htmlFor="field-positionX" style={rowLabelStyle}>position-x:</label>
                    <input
                        id="field-positionX"
                        className="nodrag"
                        type="number"
                        value={data.positionX ?? ''}
                        onChange={onFieldChange}
                        style={inputStyle}
                    />
                </div>

                <div style={rowStyle}>
                    <label htmlFor="field-positionY" style={rowLabelStyle}>position-y:</label>
                    <input
                        id="field-positionY"
                        className="nodrag"
                        type="number"
                        value={data.positionY ?? ''}
                        onChange={onFieldChange}
                        style={inputStyle}
                    />
                </div>

                <div style={rowStyle}>
                    <label htmlFor="field-opacity" style={rowLabelStyle}>opacity:</label>
                    <input
                        id="field-opacity"
                        className="nodrag"
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={data.opacity ?? ''}
                        onChange={onFieldChange}
                        style={inputStyle}
                    />
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
                            <div style={{borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '3px'}}>
                                <div style={{fontWeight: 'bold', marginBottom: '2px'}}>Data:</div>
                                {Object.entries(source.data).map(([key, value]) => (
                                    <div key={key} style={{marginLeft: '5px', lineHeight: '1.4'}}>
                                        <b>{key}:</b> {JSON.stringify(value)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TextNode;
