import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent} from 'react';
import {updateNodeAndPropagate, updateNodeDataAndPropagate} from "../../utils/nodeUtils.ts";
import {NODE_TYPES, type ImageNodeData} from '../../types/nodeTypes';
import { HandleTypes } from '../../types/handleTypes';
import {APP_CONFIG} from '../../config/appConfig.ts';
import CumulativeCenterSlider from '../CumulativeCenterSlider.tsx';
import {saveLocalImageDataUrl} from '../../utils/localImageCache.ts';

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

const textInputStyle: CSSProperties = {
    fontSize: '11px',
    width: '130px',
    border: 0,
    background: '#fff',
    opacity: 0.7,
    color: 'black',
};

const numberInputStyle: CSSProperties = {
    fontSize: '11px',
    width: '90px',
    border: 0,
    background: '#fff',
    opacity: 0.7,
    color: 'black',
};

const compactNumberInputStyle: CSSProperties = {
    fontSize: '11px',
    width: '52px',
    border: 0,
    background: '#fff',
    opacity: 0.7,
    color: 'black',
};

const randomizeButtonStyle: CSSProperties = {
    fontSize: '10px',
    padding: '2px 6px',
    border: '1px solid rgba(0,0,0,0.4)',
    background: 'rgba(255,255,255,0.6)',
    color: '#4f1d05',
    cursor: 'pointer',
    borderRadius: '6px',
    lineHeight: '14px',
};

const MAX_LOCAL_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.gif']);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif']);
const ALLOWED_IMAGE_UPLOAD_ERROR = 'Only .png, .jpg and .gif images are allowed.';

const ImageNode = ({ id, data }: NodeProps<Node<ImageNodeData, typeof NODE_TYPES.IMAGE>>) => {
    const { setNodes, getEdges } = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(APP_CONFIG.metadataExpandedByDefault);
    const fieldsExpanded = data.collapsed !== true;
    const [previewErrorPath, setPreviewErrorPath] = useState<string | null>(null);
    const [dropErrorMessage, setDropErrorMessage] = useState<string | null>(null);
    const [isDragTargetActive, setIsDragTargetActive] = useState(false);
    const dragDepthRef = useRef(0);
    const previewImageRef = useRef<HTMLImageElement | null>(null);
    const previewPath = data.localImageDataUrl
        ?? (typeof data.path === 'string' && !data.path.startsWith('local:') ? data.path : '')
        ?? '';
    const hasPreviewError = previewErrorPath === previewPath;
    const widthNumericValue = toFiniteNumber(data.width, 100);
    const heightNumericValue = toFiniteNumber(data.height, 100);
    const scaleNumericValue = toFiniteNumber(data.scale, 1);
    const positionXNumericValue = toFiniteNumber(data.positionX, 0);
    const positionYNumericValue = toFiniteNumber(data.positionY, 0);
    const positionXRandomStartNumericValue = toFiniteNumber(data.positionXRandomStart, 0);
    const positionXRandomEndNumericValue = toFiniteNumber(data.positionXRandomEnd, 300);
    const positionXRandomStepNumericValue = toFiniteNumber(data.positionXRandomStep, 1);
    const positionYRandomStartNumericValue = toFiniteNumber(data.positionYRandomStart, 0);
    const positionYRandomEndNumericValue = toFiniteNumber(data.positionYRandomEnd, 300);
    const positionYRandomStepNumericValue = toFiniteNumber(data.positionYRandomStep, 1);

    const applyNodeFieldUpdates = useCallback((updates: Array<{field: string; value: unknown}>) => {
        const edges = getEdges();
        setNodes((nds) => updates.reduce(
            (currentNodes, update) => updateNodeAndPropagate(currentNodes, edges, id, update.field, update.value),
            nds
        ));
    }, [getEdges, id, setNodes]);

    const applyAutoImageDimensions = useCallback((naturalWidth: number, naturalHeight: number) => {
        if (naturalWidth <= 0 || naturalHeight <= 0) {
            return;
        }

        const updates: Array<{field: string; value: unknown}> = [];
        if (data.autoWidth === true) {
            updates.push({field: 'width', value: naturalWidth});
        }
        if (data.autoHeight === true) {
            updates.push({field: 'height', value: naturalHeight});
        }
        if (updates.length > 0) {
            applyNodeFieldUpdates(updates);
        }
    }, [applyNodeFieldUpdates, data.autoHeight, data.autoWidth]);

    const onScaleChange = useCallback((nextValue: number) => {
        const nextScale = Math.min(100, Math.max(0, nextValue));
        const currentScale = Math.min(100, Math.max(0, toFiniteNumber(data.scale, 1)));
        const scaleRatio = currentScale > 0 ? nextScale / currentScale : 0;
        const currentWidth = toFiniteNumber(data.width, 100);
        const currentHeight = toFiniteNumber(data.height, 100);
        const edges = getEdges();

        setNodes((nds) => updateNodeDataAndPropagate(nds, edges, id, {
            scale: nextScale,
            width: Math.round(currentWidth * scaleRatio),
            height: Math.round(currentHeight * scaleRatio),
            autoWidth: false,
            autoHeight: false,
        }));
    }, [data.height, data.scale, data.width, getEdges, id, setNodes]);

    const onTextChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        const { id: targetId, value, type, checked } = evt.target;
        const newValue = type === 'checkbox' ? checked : value;
        const field = targetId.replace('field-', '');

        if (field === 'path') {
            applyNodeFieldUpdates([
                {field: 'path', value: newValue},
                {field: 'localImageDataUrl', value: undefined},
                {field: 'localImageFileName', value: undefined},
            ]);
            setPreviewErrorPath(null);
            setDropErrorMessage(null);
            return;
        }

        if (field === 'scale') {
            const parsedScale = Number(newValue);
            if (Number.isFinite(parsedScale)) {
                onScaleChange(parsedScale);
            }
            return;
        }

        if ((field === 'autoWidth' || field === 'autoHeight') && newValue === true) {
            applyNodeFieldUpdates([{field, value: true}]);
            const previewImage = previewImageRef.current;
            if (previewImage?.naturalWidth && previewImage.naturalHeight) {
                applyNodeFieldUpdates([{
                    field: field === 'autoWidth' ? 'width' : 'height',
                    value: field === 'autoWidth' ? previewImage.naturalWidth : previewImage.naturalHeight,
                }]);
            }
            return;
        }

        applyNodeFieldUpdates([{field, value: newValue}]);
    }, [applyNodeFieldUpdates, onScaleChange]);

    const hasImageFileInDragPayload = useCallback((evt: DragEvent<HTMLElement>) => {
        const items = evt.dataTransfer?.items;
        if (!items || items.length === 0) {
            return false;
        }

        return Array.from(items).some((item) => item.kind === 'file' && isAllowedImageMimeType(item.type));
    }, []);

    const handlePathDropPayload = useCallback((evt: DragEvent<HTMLElement>) => {
        evt.preventDefault();
        dragDepthRef.current = 0;
        setIsDragTargetActive(false);

        const droppedFile = evt.dataTransfer.files?.[0];
        if (droppedFile) {
            if (!isAllowedImageFile(droppedFile)) {
                setDropErrorMessage(ALLOWED_IMAGE_UPLOAD_ERROR);
                return;
            }
            if (droppedFile.size > MAX_LOCAL_IMAGE_BYTES) {
                setDropErrorMessage('Image exceeds 2 MB limit.');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const fileDataUrl = typeof reader.result === 'string' ? reader.result : '';
                if (!fileDataUrl.startsWith('data:image/')) {
                    setDropErrorMessage('Failed to read image file.');
                    return;
                }

                applyNodeFieldUpdates([
                    {field: 'path', value: `local:${droppedFile.name}`},
                    {field: 'localImageDataUrl', value: fileDataUrl},
                    {field: 'localImageFileName', value: droppedFile.name},
                ]);
                void saveLocalImageDataUrl(`local:${droppedFile.name}`, fileDataUrl);
                setPreviewErrorPath(null);
                setDropErrorMessage(null);
            };
            reader.readAsDataURL(droppedFile);
            return;
        }

        const droppedPath = evt.dataTransfer.getData('text/uri-list')
            || evt.dataTransfer.getData('text/plain');
        const normalizedPath = droppedPath.trim();
        if (!normalizedPath) {
            return;
        }

        applyNodeFieldUpdates([
            {field: 'path', value: normalizedPath},
            {field: 'localImageDataUrl', value: undefined},
            {field: 'localImageFileName', value: undefined},
        ]);
        setPreviewErrorPath(null);
        setDropErrorMessage(null);
    }, [applyNodeFieldUpdates]);

    const onNodeDragEnter = useCallback((evt: DragEvent<HTMLDivElement>) => {
        if (!hasImageFileInDragPayload(evt)) {
            return;
        }
        evt.preventDefault();
        dragDepthRef.current += 1;
        setIsDragTargetActive(true);
    }, [hasImageFileInDragPayload]);

    const onNodeDragOver = useCallback((evt: DragEvent<HTMLDivElement>) => {
        if (!hasImageFileInDragPayload(evt)) {
            return;
        }
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
        setIsDragTargetActive(true);
    }, [hasImageFileInDragPayload]);

    const onNodeDragLeave = useCallback((evt: DragEvent<HTMLDivElement>) => {
        if (!hasImageFileInDragPayload(evt)) {
            return;
        }
        evt.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
            setIsDragTargetActive(false);
        }
    }, [hasImageFileInDragPayload]);

    const onNodeDrop = useCallback((evt: DragEvent<HTMLDivElement>) => {
        if (!hasImageFileInDragPayload(evt)) {
            return;
        }
        handlePathDropPayload(evt);
    }, [handlePathDropPayload, hasImageFileInDragPayload]);

    const onPathDragOver = useCallback((evt: DragEvent<HTMLInputElement>) => {
        if (!hasImageFileInDragPayload(evt)) {
            return;
        }
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
        setIsDragTargetActive(true);
    }, [hasImageFileInDragPayload]);

    const onPathDrop = useCallback((evt: DragEvent<HTMLInputElement>) => {
        handlePathDropPayload(evt);
    }, [handlePathDropPayload]);

    const onNumericSliderChange = useCallback((field: string, nextValue: number) => {
        if (field === 'scale') {
            onScaleChange(nextValue);
            return;
        }
        const edges = getEdges();
        setNodes((nds) => updateNodeAndPropagate(nds, edges, id, field, Math.round(nextValue)));
    }, [getEdges, id, onScaleChange, setNodes]);

    const randomizePosition = useCallback((axis: 'positionX' | 'positionY') => {
        const start = axis === 'positionX' ? positionXRandomStartNumericValue : positionYRandomStartNumericValue;
        const rawEnd = axis === 'positionX' ? positionXRandomEndNumericValue : positionYRandomEndNumericValue;
        const rawStep = axis === 'positionX' ? positionXRandomStepNumericValue : positionYRandomStepNumericValue;
        const end = Number.isFinite(rawEnd) ? Math.max(start, rawEnd) : start;

        const normalizedStep = Number.isFinite(rawStep) ? Math.abs(rawStep) : 1;
        const step = normalizedStep > 0 ? normalizedStep : 1;
        const maxSteps = step > 0 ? Math.floor((end - start) / step) : 0;
        const stepIndex = maxSteps > 0 ? Math.floor(Math.random() * (maxSteps + 1)) : 0;
        const randomizedValue = Math.min(end, start + stepIndex * step);

        applyNodeFieldUpdates([{ field: axis, value: randomizedValue }]);
    }, [
        applyNodeFieldUpdates,
        positionXRandomEndNumericValue,
        positionXRandomStartNumericValue,
        positionXRandomStepNumericValue,
        positionYRandomEndNumericValue,
        positionYRandomStartNumericValue,
        positionYRandomStepNumericValue,
    ]);

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
            onDragEnter={onNodeDragEnter}
            onDragOver={onNodeDragOver}
            onDragLeave={onNodeDragLeave}
            onDrop={onNodeDrop}
            style={{
            padding: '10px',
            borderRadius: '15px',
            background: '#FBB38D',
            color: '#222',
            border: '1px solid white',
            fontSize: '12px',
            position: 'relative',
            outline: isDragTargetActive ? '2px dashed #792D05' : 'none',
            boxShadow: isDragTargetActive ? '0 0 0 3px rgba(121, 45, 5, 0.2)' : 'none',
        }}>
            {isDragTargetActive && (
                <div
                    className="nodrag"
                    style={{
                        position: 'absolute',
                        inset: '6px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.68)',
                        border: '1px dashed #792D05',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#4f1d05',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }}
                >
                    Drop image here
                </div>
            )}
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
                    backgroundColor: '#6BC8CD',
                    border: '1px solid black',
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
                    backgroundColor: '#CDD8C7',
                    border: '1px solid black',
                }}
            />
            {/*------------------- outputs ------------------- */}

            <Handle
                key="output-2"
                type="source"
                position={Position.Top}
                id={HandleTypes.ORANGE_OUTPUT_2}
                style={{
                    left: `75%`,
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#FBB38D'
                }}
            />
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

            {previewPath && !hasPreviewError && (
                <div style={{
                    marginBottom: '6px',
                    padding: '3px',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.1)'
                }}>
                    <img
                        ref={previewImageRef}
                        src={previewPath.startsWith('http')
                            ? `https://corsproxy.io/?key=80b6bad2&url=${encodeURIComponent(previewPath)}`
                            : previewPath}
                        alt={`${data.label ?? 'Image'} preview`}
                        onError={() => setPreviewErrorPath(previewPath)}
                        onLoad={(event) => applyAutoImageDimensions(
                            event.currentTarget.naturalWidth,
                            event.currentTarget.naturalHeight
                        )}
                        style={{
                            display: 'block',
                            width: '80px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                        }}
                    />
                </div>
            )}
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
                <b>{data.label + "-" + id}</b>
            </div>

            {fieldsExpanded && (
                <>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '6px'}}>
                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>path:</label>
                            <div style={controlStackStyle}>
                                <input
                                    id="field-path"
                                    className="nodrag"
                                    type="text"
                                    value={data.path ?? ''}
                                    onChange={onTextChange}
                                    onDragOver={onPathDragOver}
                                    onDrop={onPathDrop}
                                    title="Drop an image file here to attach it locally."
                                    style={textInputStyle}
                                />
                                {data.localImageFileName && (
                                    <span style={{fontSize: '9px', color: '#3a2a20'}}>
                                        local file: {data.localImageFileName}
                                    </span>
                                )}
                                {dropErrorMessage && (
                                    <span style={{fontSize: '9px', color: '#8b0000'}}>
                                        {dropErrorMessage}
                                    </span>
                                )}
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
                                        onChange={onTextChange}
                                        style={numberInputStyle}
                                    />
                                    <label style={labelStyle}>auto</label>
                                    <input
                                        id="field-autoWidth"
                                        className="nodrag"
                                        type="checkbox"
                                        checked={data.autoWidth ?? false}
                                        onChange={onTextChange}
                                        style={{width: '14px', height: '14px', cursor: 'pointer', accentColor: '#792D05', opacity: 0.7}}
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
                                        onChange={onTextChange}
                                        style={numberInputStyle}
                                    />
                                    <label style={labelStyle}>auto</label>
                                    <input
                                        id="field-autoHeight"
                                        className="nodrag"
                                        type="checkbox"
                                        checked={data.autoHeight ?? false}
                                        onChange={onTextChange}
                                        style={{width: '14px', height: '14px', cursor: 'pointer', accentColor: '#792D05', opacity: 0.7}}
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
                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>scale:</label>
                            <div style={controlStackStyle}>
                                <input
                                    id="field-scale"
                                    className="nodrag"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={data.scale ?? 1}
                                    onChange={onTextChange}
                                    style={numberInputStyle}
                                />
                                <CumulativeCenterSlider
                                    showValuePreview={false}
                                    className="nodrag nopan nowheel"
                                    cumulativeValue={scaleNumericValue}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    minCumulativeValue={0}
                                    onCumulativeChange={(nextValue) => onNumericSliderChange('scale', nextValue)}
                                    ariaLabel="Image scale"
                                />
                            </div>
                        </div>
                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>position-x:</label>
                            <div style={controlStackStyle}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <input
                                        id="field-positionX"
                                        className="nodrag"
                                        type="number"
                                        value={data.positionX ?? ''}
                                        onChange={onTextChange}
                                        style={compactNumberInputStyle}
                                    />
                                </div>
                                <CumulativeCenterSlider
                                    showValuePreview={false}
                                    className="nodrag nopan nowheel"
                                    cumulativeValue={positionXNumericValue}
                                    onCumulativeChange={(nextValue) => onNumericSliderChange('positionX', nextValue)}
                                />
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <label style={labelStyle}>start</label>
                                    <input id="field-positionXRandomStart" className="nodrag" type="number" value={data.positionXRandomStart ?? 0} onChange={onTextChange} style={compactNumberInputStyle} />
                                    <label style={labelStyle}>end</label>
                                    <input id="field-positionXRandomEnd" className="nodrag" type="number" value={data.positionXRandomEnd ?? 300} onChange={onTextChange} style={compactNumberInputStyle} />
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <label style={labelStyle}>step</label>
                                    <input id="field-positionXRandomStep" className="nodrag" type="number" value={data.positionXRandomStep ?? 1} onChange={onTextChange} style={compactNumberInputStyle} />
                                    <button type="button" className="nodrag" onClick={() => randomizePosition('positionX')} style={randomizeButtonStyle}>
                                        randomize
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>position-y:</label>
                            <div style={controlStackStyle}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <input
                                        id="field-positionY"
                                        className="nodrag"
                                        type="number"
                                        value={data.positionY ?? ''}
                                        onChange={onTextChange}
                                        style={compactNumberInputStyle}
                                    />
                                </div>
                                <CumulativeCenterSlider
                                    showValuePreview={false}
                                    className="nodrag nopan nowheel"
                                    cumulativeValue={positionYNumericValue}
                                    onCumulativeChange={(nextValue) => onNumericSliderChange('positionY', nextValue)}
                                />
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <label style={labelStyle}>start</label>
                                    <input id="field-positionYRandomStart" className="nodrag" type="number" value={data.positionYRandomStart ?? 0} onChange={onTextChange} style={compactNumberInputStyle} />
                                    <label style={labelStyle}>end</label>
                                    <input id="field-positionYRandomEnd" className="nodrag" type="number" value={data.positionYRandomEnd ?? 300} onChange={onTextChange} style={compactNumberInputStyle} />
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <label style={labelStyle}>step</label>
                                    <input id="field-positionYRandomStep" className="nodrag" type="number" value={data.positionYRandomStep ?? 1} onChange={onTextChange} style={compactNumberInputStyle} />
                                    <button type="button" className="nodrag" onClick={() => randomizePosition('positionY')} style={randomizeButtonStyle}>
                                        randomize
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={rowStyle}>
                            <label style={rowLabelStyle}>opacity:</label>
                            <div style={controlStackStyle}>
                                <input
                                    id="field-opacity"
                                    className="nodrag"
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={data.opacity ?? ''}
                                    onChange={onTextChange}
                                    style={textInputStyle}
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
                </>
            )}
        </div>
    );
};

export default ImageNode;

const toFiniteNumber = (value: unknown, fallback: number) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const isAllowedImageFile = (file: File) => {
    const mimeTypeAllowed = isAllowedImageMimeType(file.type);
    const lowerFileName = file.name.toLowerCase();
    const extensionAllowed = Array.from(ALLOWED_IMAGE_EXTENSIONS).some((extension) => lowerFileName.endsWith(extension));
    return mimeTypeAllowed || extensionAllowed;
};

const isAllowedImageMimeType = (mimeType: string) => {
    return ALLOWED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase());
};
