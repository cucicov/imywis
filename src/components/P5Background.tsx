import Sketch from 'react-p5';
import type p5 from 'react-p5/node_modules/@types/p5';
import type { Node } from '@xyflow/react';
import { NODE_TYPES, type PageNodeData, type ImageNodeData } from '../types/nodeTypes';
import { useEffect, useRef } from 'react';

type P5BackgroundProps = {
  nodes: Node[];
};

type ImageMetadataWithImage = Partial<ImageNodeData> & {
  loadedImage: p5.Image | null;
};

const P5Background = ({ nodes }: P5BackgroundProps) => {
  const p5InstanceRef = useRef<p5 | null>(null);
  const imageMetadataListRef = useRef<ImageMetadataWithImage[]>([]);

  useEffect(() => {
    // Find first page node and extract all image metadata
    const firstPageNode = nodes.find(node => node.type === NODE_TYPES.PAGE);
    if (firstPageNode && p5InstanceRef.current) {
      const pageData = firstPageNode.data as PageNodeData;
      const imageNodesMetadata = pageData.metadata?.sourceNodes.filter(
        source => source.nodeType === NODE_TYPES.IMAGE
      ) || [];

      const newImageMetadataList: ImageMetadataWithImage[] = [];

      imageNodesMetadata.forEach(imageNodeMetadata => {
        if (imageNodeMetadata?.data) {
          const newImageData = imageNodeMetadata.data as Partial<ImageNodeData>;

          // Load image if path exists
          let loadedImage: p5.Image | null = null;
          if (newImageData.path && p5InstanceRef.current) {
            const imagePath = newImageData.path.startsWith('http')
              ? `https://corsproxy.io/?${encodeURIComponent(newImageData.path)}`
              : newImageData.path;
            loadedImage = p5InstanceRef.current.loadImage(imagePath);
          }

          newImageMetadataList.push({
            ...newImageData,
            loadedImage
          });
        }
      });

      imageMetadataListRef.current = newImageMetadataList;
    } else {
      imageMetadataListRef.current = [];
    }
  }, [nodes]);

  const setup = (p5Instance: p5, canvasParentRef: Element) => {
    p5Instance.createCanvas(p5Instance.windowWidth, p5Instance.windowHeight).parent(canvasParentRef);
    p5InstanceRef.current = p5Instance;

    // Find first page node and load all images
    const firstPageNode = nodes.find(node => node.type === NODE_TYPES.PAGE);
    if (firstPageNode) {
      const pageData = firstPageNode.data as PageNodeData;
      const imageNodesMetadata = pageData.metadata?.sourceNodes.filter(
        source => source.nodeType === NODE_TYPES.IMAGE
      ) || [];

      const loadedImages: ImageMetadataWithImage[] = [];

      imageNodesMetadata.forEach(imageNodeMetadata => {
        if (imageNodeMetadata?.data) {
          const imageData = imageNodeMetadata.data as Partial<ImageNodeData>;

          let loadedImage: p5.Image | null = null;
          if (imageData.path) {
            const imagePath = imageData.path.startsWith('http')
              ? `https://corsproxy.io/?${encodeURIComponent(imageData.path)}`
              : imageData.path;
            loadedImage = p5Instance.loadImage(imagePath);
          }

          loadedImages.push({
            ...imageData,
            loadedImage
          });
        }
      });

      imageMetadataListRef.current = loadedImages;
    }
  };

  const draw = (p5Instance: p5) => {
    p5Instance.background(220);

    if (imageMetadataListRef.current.length > 0) {
      // Draw all images from the list
      imageMetadataListRef.current.forEach(imageData => {
        if (imageData.loadedImage && imageData.loadedImage.width > 0) {
          const width = imageData.autoWidth
            ? imageData.loadedImage.width
            : (imageData.width ?? 100);
          const height = imageData.autoHeight
            ? imageData.loadedImage.height
            : (imageData.height ?? 100);
          const positionX = imageData.positionX ?? p5Instance.width / 2;
          const positionY = imageData.positionY ?? p5Instance.height / 2;
          const opacity = imageData.opacity ?? 1;

          p5Instance.push();
          p5Instance.tint(255, opacity * 255);
          p5Instance.image(imageData.loadedImage, positionX, positionY, width, height);
          p5Instance.pop();
        }
      });
    } else {
      // Draw default square if no images
      const squareSize = 100;
      p5Instance.fill(100, 150, 255);
      p5Instance.rectMode(p5Instance.CENTER);
      p5Instance.rect(p5Instance.width / 2, p5Instance.height / 2, squareSize, squareSize);
    }
  };

  const windowResized = (p5Instance: p5) => {
    p5Instance.resizeCanvas(p5Instance.windowWidth, p5Instance.windowHeight);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none'
    }}>
      <Sketch setup={setup} draw={draw} windowResized={windowResized} />
    </div>
  );
};

export default P5Background;
