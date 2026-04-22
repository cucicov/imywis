import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useState, type ChangeEvent, type CSSProperties} from 'react';
import {updateNodeAndPropagate} from '../../utils/nodeUtils.ts';
import {NODE_TYPES, type BackgroundNodeData} from '../../types/nodeTypes';
import {HandleTypes} from '../../types/handleTypes';
import {APP_CONFIG} from '../../config/appConfig.ts';
import CumulativeCenterSlider from '../CumulativeCenterSlider.tsx';

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

const labelStyle: CSSProperties = {
    fontSize: '10px',
    color: '#792D05',
    whiteSpace: 'nowrap',
};

const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
};

const rowLabelStyle: CSSProperties = {
    ...labelStyle,
    width: '78px',
    flexShrink: 0,
    lineHeight: '18px',
};

const controlStackStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
    width: '100%',
};

const BackgroundNode = ({id, data}: NodeProps<Node<BackgroundNodeData, typeof NODE_TYPES.BACKGROUND>>) => {
    const {setNodes, getEdges} = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(APP_CONFIG.metadataExpandedByDefault);
    const fieldsExpanded = data.collapsed !== true;
    const widthNumericValue = toFiniteNumber(data.width, 100);
    const heightNumericValue = toFiniteNumber(data.height, 100);

    const onFieldChange = useCallback((evt: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {id: targetId, value} = evt.target;
        const field = targetId.replace('field-', '');

        const newValue = evt.target instanceof HTMLInputElement && evt.target.type === 'checkbox'
            ? evt.target.checked
            : value;

        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, field, newValue));
    }, [getEdges, id, setNodes]);

    const onNumericSliderChange = useCallback((field: string, nextValue: number) => {
        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, field, Math.round(nextValue)));
    }, [getEdges, id, setNodes]);

    const onToggleFields = useCallback(() => {
        setNodes((nds) => nds.map((node) => (
            node.id === id
                ? {
                    ...node,
                    data: {
                        ...node.data,
                        collapsed: fieldsExpanded,
                    },
                }
                : node
        )));
    }, [fieldsExpanded, id, setNodes]);

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

            <div
                className="nodrag"
                onClick={onToggleFields}
                style={{
                    marginTop: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}
            >
                <span>{fieldsExpanded ? '▼' : '▶'}</span>
                <b>{data.label + '-' + id}</b>
            </div>
            {fieldsExpanded && (
                <>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '6px'}}>
                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>style:</label>
                            <div style={controlStackStyle}>
                                <select
                                    id="field-style"
                                    className="nodrag"
                                    value={data.style ?? 'tile'}
                                    onChange={onFieldChange}
                                    style={selectStyle}
                                >
                                    <option value="tile">tile</option>
                                    <option value="fullscreen">fullscreen</option>
                                    {/*<option value="stretch">stretch</option>*/}
                                    {/*<option value="contain">contain</option>*/}
                                </select>
                            </div>
                        </div>
                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>width(px):</label>
                            <div style={controlStackStyle}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <input
                                        id="field-width"
                                        className="nodrag"
                                        type="number"
                                        value={data.width ?? ''}
                                        onChange={onFieldChange}
                                        style={inputStyle}
                                    />
                                    <label style={labelStyle}>auto</label>
                                    <input
                                        id="field-autoWidth"
                                        className="nodrag"
                                        type="checkbox"
                                        checked={data.autoWidth ?? false}
                                        onChange={onFieldChange}
                                        style={checkboxStyle}
                                    />
                                </div>
                                <CumulativeCenterSlider
                                    showValuePreview={false}
                                    className="nodrag nopan nowheel"
                                    cumulativeValue={widthNumericValue}
                                    minCumulativeValue={0}
                                    onCumulativeChange={(nextValue) => onNumericSliderChange('width', nextValue)}
                                />
                            </div>
                        </div>

                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>height(px):</label>
                            <div style={controlStackStyle}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <input
                                        id="field-height"
                                        className="nodrag"
                                        type="number"
                                        value={data.height ?? ''}
                                        onChange={onFieldChange}
                                        style={inputStyle}
                                    />
                                    <label style={labelStyle}>auto</label>
                                    <input
                                        id="field-autoHeight"
                                        className="nodrag"
                                        type="checkbox"
                                        checked={data.autoHeight ?? false}
                                        onChange={onFieldChange}
                                        style={checkboxStyle}
                                    />
                                </div>
                                <CumulativeCenterSlider
                                    showValuePreview={false}
                                    className="nodrag nopan nowheel"
                                    cumulativeValue={heightNumericValue}
                                    minCumulativeValue={0}
                                    onCumulativeChange={(nextValue) => onNumericSliderChange('height', nextValue)}
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
                </>
            )}
        </div>
    );
};

export default BackgroundNode;

const toFiniteNumber = (value: unknown, fallback: number) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
