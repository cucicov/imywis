import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useState, type ChangeEvent} from 'react';
import {updateNodeAndPropagate} from "../../utils/nodeUtils.ts";
import {NODE_TYPES, type PageNodeData} from '../../types/nodeTypes';
import { HandleTypes } from '../../types/handleTypes';
import {APP_CONFIG} from '../../config/appConfig.ts';
import CumulativeCenterSlider from "../CumulativeCenterSlider.tsx";

const labelStyle = { fontSize: '10px', color: '#57212E', whiteSpace: 'nowrap' } as const;
const rowStyle = { display: 'flex', alignItems: 'flex-start', gap: '8px' } as const;
const rowLabelStyle = { ...labelStyle, width: '78px', flexShrink: 0, paddingTop: '2px' } as const;
const controlStackStyle = { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 } as const;
const textInputStyle = { fontSize: '11px', width: '100px', border: 0, background: '#fff', opacity: 0.7, color: 'black' } as const;
const numberInputStyle = { fontSize: '11px', width: '90px', border: 0, background: '#fff', opacity: 0.7, color: 'black' } as const;

const PageNode = ({ id, data }: NodeProps<Node<PageNodeData, typeof NODE_TYPES.PAGE>>) => {
    const { setNodes, getEdges } = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(APP_CONFIG.metadataExpandedByDefault);
    const isFirstPage = id === '1';
    const widthNumericValue = toFiniteNumber(data.width, 0);
    const heightNumericValue = toFiniteNumber(data.height, 0);

    const onTextChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const { id: targetId, value, type, checked } = evt.target;
        const newValue = type === 'checkbox' ? checked : value;
        const field = targetId.replace('field-', '');

        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, field, newValue));
    }, [getEdges, id, setNodes]);

    const onSliderCumulativeChange = useCallback((nextValue: number) => {
        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, 'width', Math.round(nextValue)));
    }, [getEdges, id, setNodes]);

    const onHeightSliderCumulativeChange = useCallback((nextValue: number) => {
        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, 'height', Math.round(nextValue)));
    }, [getEdges, id, setNodes]);

    return (
        <div
            className={`imywis-node-shell${data.connectionImpactKey ? ' imywis-node-shell--impact' : ''}`}
            style={{
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
                    backgroundColor: '#D05774',
                    width: '10px',
                    height: '10px',
                    border: '1px solid black'
                }}
            />
            <Handle
                type="source"
                id={HandleTypes.RED_INPUT}
                position={Position.Bottom}
                style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#D05774',
                    border: '1px solid white'}}
            />

            <b>{data.label + "-" + id}</b>
            <div style={{display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '6px'}}>
                <div style={rowStyle}>
                    <label style={rowLabelStyle}>name:</label>
                    <div style={controlStackStyle}>
                        <input
                            id="field-name"
                            className="nodrag"
                            type="text"
                            value={data.name}
                            onChange={onTextChange}
                            disabled={isFirstPage}
                            style={{
                                ...textInputStyle,
                                opacity: isFirstPage ? 0.6 : 0.7,
                                cursor: isFirstPage ? 'not-allowed' : 'text',
                            }}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <label style={rowLabelStyle}>width(px):</label>
                    <div style={controlStackStyle}>
                        <input
                            id="field-width"
                            className="nodrag"
                            type="number"
                            value={data.width ?? ''}
                            onChange={onTextChange}
                            style={numberInputStyle}
                        />
                        <CumulativeCenterSlider
                            showValuePreview={false}
                            className="nodrag nopan nowheel"
                            cumulativeValue={widthNumericValue}
                            minCumulativeValue={1}
                            onCumulativeChange={onSliderCumulativeChange}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <label style={rowLabelStyle}>height(px):</label>
                    <div style={controlStackStyle}>
                        <input
                            id="field-height"
                            className="nodrag"
                            type="number"
                            value={data.height ?? ''}
                            onChange={onTextChange}
                            style={numberInputStyle}
                        />
                        <CumulativeCenterSlider
                            showValuePreview={false}
                            className="nodrag nopan nowheel"
                            cumulativeValue={heightNumericValue}
                            minCumulativeValue={1}
                            onCumulativeChange={onHeightSliderCumulativeChange}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <label style={rowLabelStyle}>mousePointer:</label>
                    <div style={controlStackStyle}>
                        <input
                            id="field-mousePointer"
                            className="nodrag"
                            type="text"
                            value={data.mousePointer ?? ''}
                            onChange={onTextChange}
                            style={textInputStyle}
                        />
                    </div>
                </div>
                <div style={rowStyle}>
                    <label style={rowLabelStyle}>background:</label>
                    <div style={controlStackStyle}>
                        <input
                            id="field-backgroundColor"
                            className="nodrag"
                            type="color"
                            value={data.backgroundColor ?? '#ffffff'}
                            onChange={onTextChange}
                            style={{ width: '40px', height: '22px', border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}
                        />
                    </div>
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
                            <div style={{ marginBottom: '2px' }}><b>Node:</b> {source.type} ({source.nodeId})</div>
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

const toFiniteNumber = (value: unknown, fallback: number) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
