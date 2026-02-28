import type {Node} from '@xyflow/react';
import {NODE_TYPES, type PageNodeData} from '../types/nodeTypes';

type ExportP5ProjectProps = {
    nodes: Node[];
};

const ExportP5Project = ({nodes}: ExportP5ProjectProps) => {
    const onExport = () => {
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

        const jsonData = JSON.stringify(pagesData, null, 2);
        downloadTextFile('pages-export.json', jsonData);
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

const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

export default ExportP5Project;
