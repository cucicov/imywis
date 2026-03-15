import {useState, type CSSProperties} from 'react';
import type {Node} from '@xyflow/react';
import {NODE_TYPES, type PageNodeData} from '../types/nodeTypes';
import {APP_CONFIG} from '../config/appConfig';

type ExportP5ProjectProps = {
    nodes: Node[];
};

type ExportResponse = {
    success?: boolean;
    message?: string;
};

const buttonStyle: CSSProperties = {
    position: 'absolute',
    top: '52px',
    right: '12px',
    zIndex: 2,
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #fff',
    background: '#1e6f5c',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
};

const statusWrapperStyle: CSSProperties = {
    position: 'absolute',
    top: '98px',
    right: '12px',
    zIndex: 2,
    width: '320px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    background: 'rgba(18, 24, 31, 0.88)',
    color: '#f5f7fa',
    fontSize: '12px',
    textAlign: 'left',
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.28)',
    backdropFilter: 'blur(4px)',
};

const closeButtonStyle: CSSProperties = {
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#f5f7fa',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    width: '22px',
    height: '22px',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

const statusHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '10px 12px 8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
};

const statusBodyStyle: CSSProperties = {
    padding: '10px 12px 12px',
    lineHeight: 1.4,
    wordBreak: 'break-word',
};

const statusTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.02em',
};

const statusChipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.03em',
    color: '#fff',
};

const ExportP5Project = ({nodes}: ExportP5ProjectProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

    const openOrRefreshPreviewTab = () => {
        const previewTab = window.open(APP_CONFIG.publishRedirectUrl, 'p5-preview-tab');
        previewTab?.focus();
    };

    const onExport = async () => {
        try {
            setIsLoading(true);
            setStatusMessage(null);
            setStatusType(null);

            const pageNodes = nodes.filter(node => node.type === NODE_TYPES.PAGE);

            const pagesData = pageNodes.map(pageNode => {
                const pageData = pageNode.data as PageNodeData;

                return {
                    id: pageNode.id,
                    type: pageNode.type,
                    position: pageNode.position,
                    data: pageData,
                };
            });

            console.log('Exporting pages:', JSON.stringify(pagesData));

            const response = await fetch(APP_CONFIG.nodesApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pagesData),
            });

            let payload: ExportResponse | null = null;

            try {
                payload = await response.json();
            } catch {
                payload = null;
            }

            if (!response.ok || payload?.success === false) {
                const message = payload?.message ?? `Failed to publish nodes (status ${response.status}).`;
                setStatusMessage(message);
                setStatusType('error');
                return;
            }

            setStatusMessage(payload?.message ?? 'Nodes processed successfully');
            setStatusType('success');
            openOrRefreshPreviewTab();
        } catch (error) {
            setStatusMessage(
                error instanceof Error
                    ? error.message
                    : 'Failed to publish nodes due to an unexpected error.'
            );
            setStatusType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={onExport}
                disabled={isLoading}
                style={{
                    ...buttonStyle,
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'wait' : 'pointer',
                }}
            >
                {isLoading ? 'Publishing...' : 'Publish'}
            </button>

            {isLoading && (
                <div style={{...statusWrapperStyle, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px'}}>
                    <span className="loading-spinner" aria-hidden="true"/>
                    <span>Waiting for server response...</span>
                </div>
            )}

            {!isLoading && statusMessage && (
                <div
                    style={{
                        ...statusWrapperStyle,
                        borderColor: statusType === 'success' ? 'rgba(46, 204, 113, 0.5)' : 'rgba(255, 107, 107, 0.5)',
                    }}
                    role="status"
                >
                    <div style={statusHeaderStyle}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span
                                style={{
                                    ...statusChipStyle,
                                    background: statusType === 'success' ? '#1e8e5a' : '#c23b3b',
                                }}
                            >
                                {statusType === 'success' ? 'OK' : 'NOK'}
                            </span>
                            <p style={statusTitleStyle}>Publish Result</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setStatusMessage(null);
                                setStatusType(null);
                            }}
                            style={closeButtonStyle}
                            aria-label="Close status message"
                        >
                            ×
                        </button>
                    </div>
                    <div style={statusBodyStyle}>{statusMessage}</div>
                </div>
            )}
        </>
    );
};

export default ExportP5Project;
