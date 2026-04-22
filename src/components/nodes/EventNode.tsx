import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useState, type ChangeEvent, type CSSProperties} from 'react';
import {updateNodeAndPropagate} from '../../utils/nodeUtils.ts';
import {NODE_TYPES, type EventNodeData} from '../../types/nodeTypes';
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

const EventNode = ({id, data}: NodeProps<Node<EventNodeData, typeof NODE_TYPES.EVENT>>) => {
    const {setNodes, getEdges} = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(APP_CONFIG.metadataExpandedByDefault);
    const fieldsExpanded = data.collapsed !== true;

    const onFieldChange = useCallback((evt: ChangeEvent<HTMLSelectElement>) => {
        const {id: targetId, value} = evt.target;
        const field = targetId.replace('field-', '');

        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, field, value));
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
            background: '#6BC8CD',
            color: '#222',
            border: '1px solid white',
            fontSize: '12px',
        }}>
            <Handle
                type="target"
                position={Position.Top}
                id={HandleTypes.RED_INPUT}
                style={{
                    left: '50%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#D05774',
                    border: '1px solid black',
                }}
            />
            <Handle
                type="target"
                position={Position.Bottom}
                id={HandleTypes.ORANGE_INPUT}
                style={{
                    left: '33%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D',
                    border: '1px solid black',
                }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id={HandleTypes.TURQUOISE_OUTPUT}
                style={{
                    left: '66%',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#6BC8CD',
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
                    <div style={{marginTop: '6px'}}>
                        <div style={rowStyle}>
                            <label htmlFor="field-type" style={rowLabelStyle}>type:</label>
                            <select
                                id="field-type"
                                className="nodrag"
                                value={data.type ?? 'click'}
                                onChange={onFieldChange}
                                style={inputStyle}
                            >
                                <option value="click">click</option>
                                {/*<option value="mouse over">mouse over</option>*/}
                            </select>
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
                </>
            )}
        </div>
    );
};

export default EventNode;
