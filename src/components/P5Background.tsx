import Sketch from 'react-p5';
import type p5 from 'react-p5/node_modules/@types/p5';
import type { Node } from '@xyflow/react';
import { NODE_TYPES, type PageNodeData, type ImageNodeData } from '../types/nodeTypes';
import { useEffect, useRef } from 'react';
import {toNumberOrNull} from "../utils/numberUtils.ts";

type P5BackgroundProps = {
  nodes: Node[];
};

type ImageMetadataWithImage = Partial<ImageNodeData> & {
  loadedImage: p5.Image | null;
};

const P5Background = ({ nodes }: P5BackgroundProps) => {
  const p5InstanceRef = useRef<p5 | null>(null);
  const imageMetadataListRef = useRef<ImageMetadataWithImage[]>([]); //TODO: refactor this, find a way to organize the objects passed from nodes.
  const mousePointerRef = useRef<string | null>(null); //TODO: refactor as above.

  // ---- Helper functions

  const getPageDimensions = () => {
    const firstPageNode = nodes.find(node => node.type === NODE_TYPES.PAGE);
    const pageData = firstPageNode?.data as PageNodeData | undefined;
    const width = toNumberOrNull(pageData?.width);
    const height = toNumberOrNull(pageData?.height);
    if (width !== null && height !== null) {
      return { width, height };
    }
    return null;
  };

  const loadCursorImage = (p5Instance: p5, mousePointer: string | null) => {
    if (!mousePointer) {
      p5Instance.cursor('default');
      return;
    }

    const imagePath = withCorsProxy(mousePointer);
    p5Instance.cursor(imagePath);
  };


  // ---- LOAD IMAGES
  useEffect(() => {
    // Find first page node and extract all image metadata
    const firstPageNode = nodes.find(node => node.type === NODE_TYPES.PAGE);
    if (firstPageNode && p5InstanceRef.current) {
      const pageData = firstPageNode.data as PageNodeData;
      const imageNodesMetadata = pageData.metadata?.sourceNodes.filter(
        source => source.type === NODE_TYPES.IMAGE
      ) || [];
      mousePointerRef.current = (pageData.mousePointer ?? (pageData as PageNodeData & {mouse?: string}).mouse)?.trim() || null;

      const newImageMetadataList: ImageMetadataWithImage[] = [];

      imageNodesMetadata.forEach(imageNodeMetadata => {
        if (imageNodeMetadata?.data) {
          const newImageData = imageNodeMetadata.data as Partial<ImageNodeData>;

          // Load image if path exists
          let loadedImage: p5.Image | null = null;
          if (newImageData.path && p5InstanceRef.current) {
            const imagePath = withCorsProxy(newImageData.path);
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
      if (p5InstanceRef.current) {
        p5InstanceRef.current.cursor('default');
      }
    }
  }, [nodes]);

  // ---- SET PAGE DIMENSIONS
  useEffect(() => {
    if (!p5InstanceRef.current) return;
    const dimensions = getPageDimensions();
    if (dimensions) {
      p5InstanceRef.current.resizeCanvas(dimensions.width, dimensions.height);
    } else {
      p5InstanceRef.current.resizeCanvas(
        p5InstanceRef.current.windowWidth,
        p5InstanceRef.current.windowHeight
      );
    }
  }, [nodes]);


  // ---- START Sketch drawing

  const setup = (p5Instance: p5, canvasParentRef: Element) => {
    const dimensions = getPageDimensions();
    const renderer = dimensions
      ? p5Instance.createCanvas(dimensions.width, dimensions.height)
      : p5Instance.createCanvas(p5Instance.windowWidth, p5Instance.windowHeight);
    renderer.parent(canvasParentRef);
    const canvasEl = (renderer as unknown as { elt?: Element }).elt;
    if (canvasEl instanceof HTMLCanvasElement) {
      canvasEl.id = 'p5-background-canvas';
    }
    p5InstanceRef.current = p5Instance;
  };

  const draw = (p5Instance: p5) => {
    p5Instance.background(220);
    loadCursorImage(p5Instance, mousePointerRef.current);

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
    }
  };

  const windowResized = (p5Instance: p5) => {
    const dimensions = getPageDimensions();
    if (dimensions) {
      p5Instance.resizeCanvas(dimensions.width, dimensions.height);
    } else {
      p5Instance.resizeCanvas(p5Instance.windowWidth, p5Instance.windowHeight);
    }
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

const withCorsProxy = (path: string) =>
  path.startsWith('http')
    ? `https://corsproxy.io/?key=80b6bad2&url=${encodeURIComponent(path)}`
    : path;

export default P5Background;
