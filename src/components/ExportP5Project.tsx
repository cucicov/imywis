import type { Node } from '@xyflow/react';
import { NODE_TYPES, type PageNodeData, type ImageNodeData } from '../types/nodeTypes';

type ExportP5ProjectProps = {
  nodes: Node[];
};

const ExportP5Project = ({ nodes }: ExportP5ProjectProps) => {
  const onExport = () => {
    const pageNode = nodes.find(node => node.type === NODE_TYPES.PAGE);
    const pageData = pageNode?.data as PageNodeData | undefined;
    const pageName = pageNode?.id === '1'
      ? 'index.html'
      : (pageData?.name?.trim() || pageData?.label || 'p5-project');

    const imageNodes = pageData?.metadata?.sourceNodes.filter(
      source => source.nodeType === NODE_TYPES.IMAGE
    ) || [];

    const images: Partial<ImageNodeData>[] = imageNodes.map(node => node.data as Partial<ImageNodeData>);

    const width = pageData?.width ?? 800;
    const height = pageData?.height ?? 600;

    const sketchJs = buildSketchJs(images, width, height);
    const indexHtml = buildIndexHtml(pageName);

    downloadTextFile('index.html', indexHtml);
    downloadTextFile('sketch.js', sketchJs);
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
      Export p5js
    </button>
  );
};

const buildIndexHtml = (title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
  </head>
  <body style="margin:0;overflow:hidden;background:#111;">
    <script src="./sketch.js"></script>
  </body>
</html>
`;

const buildSketchJs = (images: Partial<ImageNodeData>[], width: number, height: number) => {
  const assets = images
    .map((img, i) => ({
      id: i,
      path: withCorsProxy(img.path ?? ''),
      width: img.width ?? null,
      height: img.height ?? null,
      autoWidth: Boolean(img.autoWidth),
      autoHeight: Boolean(img.autoHeight),
      positionX: img.positionX ?? null,
      positionY: img.positionY ?? null,
      opacity: img.opacity ?? 1
    }))
    .filter(item => item.path);

  return   `const canvasWidth = ${Number(width)};
            const canvasHeight = ${Number(height)};
            
            const assets = ${JSON.stringify(assets, null, 2)};
            const images = [];
            
            function preload() {
              assets.forEach((asset, idx) => {
                images[idx] = loadImage(asset.path);
              });
            }
            
            function setup() {
              createCanvas(canvasWidth, canvasHeight);
            }
            
            function draw() {
              background(220);
              images.forEach((img, idx) => {
                if (!img || img.width <= 0) return;
                const asset = assets[idx];
                const w = asset.autoWidth ? img.width : (asset.width ?? 100);
                const h = asset.autoHeight ? img.height : (asset.height ?? 100);
                const x = asset.positionX ?? width / 2;
                const y = asset.positionY ?? height / 2;
                const opacity = asset.opacity ?? 1;
                push();
                tint(255, opacity * 255);
                image(img, x, y, w, h);
                pop();
              });
            }
            `;
};

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const withCorsProxy = (path: string) => {
  if (!path) return '';
  return path.startsWith('http')
    ? `https://corsproxy.io/?${encodeURIComponent(path)}`
    : path;
};

export default ExportP5Project;
