import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, type ChangeEvent} from 'react';
import {getOutgoingConnectedNodeIds, updateConnectedNodes, updateCurrentNode} from "../../utils/nodeUtils.ts";

export type PageNodeData = {
    label: string;
    name?: string;
    width?: number;
    height?: number;
    mousePointer?: string;
};


const PageNode = ({ id, data }: NodeProps<Node<PageNodeData, 'pageNode'>>) => {
    const { setNodes, getEdges } = useReactFlow();
    data = {...data, label: 'Page'};

    const onTextChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const { id: targetId, value, type, checked } = evt.target;
        const newValue = type === 'checkbox' ? checked : value;
        const field = targetId.replace('field-', '');
        const connectedNodeIds = getOutgoingConnectedNodeIds(id, getEdges());

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return updateCurrentNode(node, field, newValue);
                }
                return updateConnectedNodes(node, newValue, connectedNodeIds);
            })
        );
    }, [id, setNodes, getEdges]);

    return (
        <div style={{
            padding: '10px',
            borderRadius: '15px',
            background: '#D05774',
            color: '#222',
            border: '1px solid white',
            fontSize: '12px',
        }}>
            {/* Render n+1 target handles */}
            <Handle
                key={`input-0`}
                type="target"
                position={Position.Top}
                id={`input-0`}
                style={{
                    left: `50%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#D05774'
                }}
            />
            <b>{data.label}</b>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>


            </div>
            <Handle type="source" position={Position.Bottom} style={{ width: '10px', height: '10px', backgroundColor: '#D05774' }} />
        </div>
    );
};

export default PageNode;
