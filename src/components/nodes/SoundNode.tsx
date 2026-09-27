import {Handle, Position, useReactFlow, type Node, type NodeProps} from '@xyflow/react';
import {useCallback, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent} from 'react';
import {NODE_TYPES, type SoundNodeData} from '../../types/nodeTypes';
import {HandleTypes} from '../../types/handleTypes';
import {updateNodeAndPropagate} from '../../utils/nodeUtils.ts';
import {saveLocalSoundDataUrl} from '../../utils/localSoundCache.ts';
import {APP_CONFIG} from '../../config/appConfig.ts';

const MAX_SOUND_BYTES = 2 * 1024 * 1024;
const SOUND_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg']);
const SOUND_MIMES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/vorbis']);
const ERROR_MESSAGE = 'Only MP3, WAV and OGG audio files up to 2 MB are allowed.';
const labelStyle: CSSProperties = {fontSize: '10px', color: '#792D05', whiteSpace: 'nowrap'};

const SoundNode = ({id, data}: NodeProps<Node<SoundNodeData, typeof NODE_TYPES.SOUND>>) => {
    const {setNodes, getEdges} = useReactFlow();
    const [metadataExpanded, setMetadataExpanded] = useState(APP_CONFIG.metadataExpandedByDefault);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const dragDepth = useRef(0);
    const fieldsExpanded = data.collapsed !== true;

    const apply = useCallback((updates: Record<string, unknown>) => {
        setNodes(nodes => {
            const current = nodes.find(node => node.id === id);
            if (!current) return nodes;
            return updateNodeAndPropagate(nodes, getEdges(), id, Object.keys(updates)[0], Object.values(updates)[0]);
        });
        const extra = Object.entries(updates).slice(1);
        extra.forEach(([field, value]) => setNodes(nodes => updateNodeAndPropagate(nodes, getEdges(), id, field, value)));
    }, [getEdges, id, setNodes]);

    const setPath = useCallback((path: string, localDataUrl?: string, fileName?: string) => {
        apply({path, localSoundDataUrl: localDataUrl, localSoundFileName: fileName});
        setError(null);
    }, [apply]);

    const handleFile = useCallback((file: File) => {
        const allowed = SOUND_MIMES.has(file.type.toLowerCase()) || Array.from(SOUND_EXTENSIONS).some(ext => file.name.toLowerCase().endsWith(ext));
        if (!allowed || file.size > MAX_SOUND_BYTES) { setError(ERROR_MESSAGE); return; }
        const reader = new FileReader();
        reader.onload = () => {
            const url = typeof reader.result === 'string' ? reader.result : '';
            if (!url.startsWith('data:audio/')) { setError('Failed to read audio file.'); return; }
            const localPath = `local:${file.name}`;
            setPath(localPath, url, file.name);
            void saveLocalSoundDataUrl(localPath, url);
        };
        reader.readAsDataURL(file);
    }, [setPath]);

    const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault(); setDragActive(false); dragDepth.current = 0;
        const file = event.dataTransfer.files?.[0];
        if (file) { handleFile(file); return; }
        const path = (event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain')).trim();
        if (path) setPath(path);
    }, [handleFile, setPath]);

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const field = event.target.id.replace('field-', '');
        if (field === 'path') {
            apply({path: event.target.value, localSoundDataUrl: undefined, localSoundFileName: undefined});
            setError(null);
            return;
        }
        apply({[field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value});
    }, [apply]);

    return <div className={`imywis-node-shell${data.connectionImpactKey ? ' imywis-node-shell--impact' : ''}`} onDragEnter={event => {if (event.dataTransfer.types.includes('Files')) {dragDepth.current++; setDragActive(true);}}} onDragOver={event => {if (event.dataTransfer.types.includes('Files')) {event.preventDefault(); event.dataTransfer.dropEffect = 'copy';}}} onDragLeave={() => {dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragActive(false);}} onDrop={onDrop} style={{padding: '10px', borderRadius: '15px', background: '#FBB38D', color: '#222', border: '1px solid white', fontSize: '12px', position: 'relative', outline: dragActive ? '2px dashed #792D05' : 'none'}}>
        <Handle type="source" position={Position.Top} id={HandleTypes.ORANGE_OUTPUT} style={{left: '50%', width: '10px', height: '10px', backgroundColor: '#FBB38D', border: '1px solid black'}} />
        <Handle type="source" position={Position.Bottom} id={HandleTypes.RED_OUTPUT} style={{left: '50%', width: '10px', height: '10px', backgroundColor: '#D05774', border: '1px solid black'}} />
        <div className="nodrag" onClick={() => setNodes(nodes => nodes.map(node => node.id === id ? {...node, data: {...node.data, collapsed: fieldsExpanded}} : node))} style={{cursor: 'pointer', fontWeight: 700, marginBottom: '8px'}}>{fieldsExpanded ? '▼' : '▶'} SoundNode</div>
        {fieldsExpanded && <>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}><label style={{...labelStyle, width: '50px'}}>path:</label><input id="field-path" className="nodrag" value={data.path ?? ''} onChange={onChange} onDrop={onDrop} style={{fontSize: '11px', width: '145px', border: 0, background: '#fff', opacity: 0.7, color: 'black'}} /></div>
            <label className="nodrag" style={{display: 'flex', alignItems: 'center', gap: '6px', ...labelStyle}}><input id="field-autoplay" type="checkbox" checked={data.autoplay === true} onChange={onChange} style={{accentColor: '#792D05'}} /> autoplay</label>
            <label className="nodrag" style={{display: 'flex', alignItems: 'center', gap: '6px', ...labelStyle}}><input id="field-loop" type="checkbox" checked={data.loop === true} onChange={onChange} style={{accentColor: '#792D05'}} /> loop</label>
            {error && <div style={{color: '#8b0000', fontSize: '9px', marginTop: '6px'}}>{error}</div>}
            {data.metadata?.sourceNodes?.length ? <div style={{marginTop: '8px', fontSize: '8px'}} onClick={() => setMetadataExpanded(!metadataExpanded)}>{metadataExpanded ? '▼' : '▶'} Metadata ({data.metadata.sourceNodes.length})</div> : null}
        </>}
    </div>;
};

export default SoundNode;
