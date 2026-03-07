import type {Node} from '@xyflow/react';
import {NODE_TYPES, type PageNodeData} from '../types/nodeTypes';
import {APP_CONFIG} from '../config/appConfig';

type ExportP5ProjectProps = {
    nodes: Node[];
};

const ExportP5Project = ({nodes}: ExportP5ProjectProps) => {
    const onExport = async () => {
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

        const response = await fetch(APP_CONFIG.nodesApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pagesData),
        });

        if (!response.ok) {
            throw new Error(`Failed to publish nodes (status ${response.status}).`);
        }
    };

    return (
        <button
            type="button"
            onClick={onExport}
            style={{
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
                cursor: 'pointer'
            }}
        >
            Publish
        </button>
    );
};

export default ExportP5Project;
