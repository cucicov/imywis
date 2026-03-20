import Sketch from 'react-p5';
import type p5 from 'react-p5/node_modules/@types/p5';
import type { Node } from '@xyflow/react';
import {NODE_TYPES, type BackgroundNodeData, type ImageNodeData, type NodeMetadata, type PageNodeData, type TextNodeData} from '../types/nodeTypes';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {toNumberOrNull} from '../utils/numberUtils.ts';
import {
  DEFAULT_LATEST_SELECTED_PAGE_NAME,
  getLatestSelectedPageNameFromSession,
  LATEST_SELECTED_PAGE_NAME_CHANGED_EVENT,
} from '../utils/sessionStorage.ts';

type P5BackgroundProps = {
  nodes: Node[];
};

type ImageMetadataWithImage = Partial<ImageNodeData> & {
  loadedImage: p5.Image | null;
};

type BackgroundMetadataWithImage = Partial<BackgroundNodeData> & {
  loadedImage: p5.Image | null;
  sourceImageData: Partial<ImageNodeData> | null;
};

type TextMetadata = Partial<TextNodeData>;

const P5Preview = ({ nodes }: P5BackgroundProps) => {
  const p5InstanceRef = useRef<p5 | null>(null);
  const imageMetadataListRef = useRef<ImageMetadataWithImage[]>([]);
  const backgroundMetadataListRef = useRef<BackgroundMetadataWithImage[]>([]);
  const textMetadataListRef = useRef<TextMetadata[]>([]);
  const sceneBufferRef = useRef<p5.Graphics | null>(null);
  const renderSignatureRef = useRef('');
  const mousePointerRef = useRef<string | null>(null);
  const pageBackgroundColorRef = useRef('#ffffff');
  const hasLivePreviewRef = useRef(false);
  const imageCacheRef = useRef<Map<string, p5.Image>>(new Map());
  const lastRedrawAtRef = useRef(0);
  const pendingRedrawTimerRef = useRef<number | null>(null);
  const [latestSelectedPageName, setLatestSelectedPageName] = useState(() => getLatestSelectedPageNameFromSession());

  const pageNodeData = useMemo(() => {
    const pageNodes = nodes.filter(node => node.type === NODE_TYPES.PAGE);
    if (pageNodes.length === 0) {
      return undefined;
    }

    const selectedName = latestSelectedPageName.trim();
    if (selectedName && selectedName !== DEFAULT_LATEST_SELECTED_PAGE_NAME) {
      const matchingPageNode = pageNodes.find((node) => {
        const pageData = node.data as PageNodeData | undefined;
        return (pageData?.name ?? '').trim() === selectedName;
      });

      if (matchingPageNode) {
        return matchingPageNode.data as PageNodeData;
      }
    }

    return pageNodes[0].data as PageNodeData;
  }, [latestSelectedPageName, nodes]);

  const pageContentSignature = useMemo(() => {
    if (!pageNodeData) {
      return 'no-page-data';
    }
    return JSON.stringify({
      width: pageNodeData.width ?? null,
      height: pageNodeData.height ?? null,
      mousePointer: (pageNodeData.mousePointer ?? (pageNodeData as PageNodeData & {mouse?: string}).mouse ?? '').trim(),
      backgroundColor: pageNodeData.backgroundColor ?? '#ffffff',
      metadata: pageNodeData.metadata?.sourceNodes ?? [],
    });
  }, [pageNodeData]);

  const pageDimensionSignature = useMemo(() => {
    if (!pageNodeData) {
      return 'no-page-dimensions';
    }
    return JSON.stringify({
      width: pageNodeData.width ?? null,
      height: pageNodeData.height ?? null,
    });
  }, [pageNodeData]);

  const getPageDimensions = useCallback(() => {
    const width = toNumberOrNull(pageNodeData?.width);
    const height = toNumberOrNull(pageNodeData?.height);

    if (width !== null && height !== null) {
      return { width, height };
    }

    return null;
  }, [pageNodeData]);

  useEffect(() => {
    const syncLatestSelectedPageName = () => {
      setLatestSelectedPageName(getLatestSelectedPageNameFromSession());
    };

    const onLatestSelectedPageNameChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const pageName = customEvent.detail;

      if (typeof pageName === 'string' && pageName.trim()) {
        setLatestSelectedPageName(pageName);
        return;
      }

      syncLatestSelectedPageName();
    };

    window.addEventListener(LATEST_SELECTED_PAGE_NAME_CHANGED_EVENT, onLatestSelectedPageNameChanged);
    window.addEventListener('storage', syncLatestSelectedPageName);
    return () => {
      window.removeEventListener(LATEST_SELECTED_PAGE_NAME_CHANGED_EVENT, onLatestSelectedPageNameChanged);
      window.removeEventListener('storage', syncLatestSelectedPageName);
    };
  }, []);

  const loadCursorImage = (p5Instance: p5, mousePointer: string | null) => {
    if (!mousePointer) {
      p5Instance.cursor('default');
      return;
    }

    const imagePath = withCorsProxy(mousePointer);
    p5Instance.cursor(imagePath);
  };

  const requestRedraw = () => {
    const p5Instance = p5InstanceRef.current;
    if (!p5Instance) {
      return;
    }
    if (hasLivePreviewRef.current) {
      return;
    }

    const minIntervalMs = 1000;
    const now = Date.now();
    const elapsed = now - lastRedrawAtRef.current;

    if (elapsed >= minIntervalMs) {
      if (pendingRedrawTimerRef.current !== null) {
        window.clearTimeout(pendingRedrawTimerRef.current);
        pendingRedrawTimerRef.current = null;
      }
      lastRedrawAtRef.current = now;
      p5Instance.redraw();
      return;
    }

    if (pendingRedrawTimerRef.current !== null) {
      return;
    }

    pendingRedrawTimerRef.current = window.setTimeout(() => {
      pendingRedrawTimerRef.current = null;
      lastRedrawAtRef.current = Date.now();
      p5InstanceRef.current?.redraw();
    }, minIntervalMs - elapsed);
  };

  useEffect(() => {
    if (pageNodeData && p5InstanceRef.current) {
      const pageData = pageNodeData;
      const imageNodesMetadata = pageData.metadata?.sourceNodes.filter(
        source => source.type === NODE_TYPES.IMAGE
      ) || [];
      const backgroundNodesMetadata = pageData.metadata?.sourceNodes.filter(
        source => source.type === NODE_TYPES.BACKGROUND
      ) || [];
      const textNodesMetadata = pageData.metadata?.sourceNodes.filter(
        source => source.type === NODE_TYPES.TEXT
      ) || [];
      mousePointerRef.current = (pageData.mousePointer ?? (pageData as PageNodeData & {mouse?: string}).mouse)?.trim() || null;
      pageBackgroundColorRef.current = resolvePageBackgroundColor(pageData.backgroundColor);

      const newImageMetadataList: ImageMetadataWithImage[] = [];
      const newBackgroundMetadataList: BackgroundMetadataWithImage[] = [];
      const newTextMetadataList: TextMetadata[] = [];

      imageNodesMetadata.forEach(imageNodeMetadata => {
        if (!imageNodeMetadata?.data) {
          return;
        }

        const newImageData = imageNodeMetadata.data as Partial<ImageNodeData>;
        let loadedImage: p5.Image | null = null;

        if (newImageData.path && p5InstanceRef.current) {
          const imagePath = withCorsProxy(newImageData.path);
          const cachedImage = imageCacheRef.current.get(imagePath);
          if (cachedImage) {
            loadedImage = cachedImage;
          } else {
            loadedImage = p5InstanceRef.current.loadImage(imagePath, (img) => {
              imageCacheRef.current.set(imagePath, img);
              requestRedraw();
            });
          }
        }

        newImageMetadataList.push({
          ...newImageData,
          loadedImage,
        });
      });

      backgroundNodesMetadata.forEach(backgroundNodeMetadata => {
        if (!backgroundNodeMetadata?.data) {
          return;
        }

        const backgroundData = backgroundNodeMetadata.data as Partial<BackgroundNodeData> & {metadata?: NodeMetadata};
        const sourceImageMetadata = backgroundData.metadata?.sourceNodes.find(
          source => source.type === NODE_TYPES.IMAGE
        );
        const sourceImageData = (sourceImageMetadata?.data ?? null) as Partial<ImageNodeData> | null;

        let loadedImage: p5.Image | null = null;
        if (sourceImageData?.path && p5InstanceRef.current) {
          const imagePath = withCorsProxy(sourceImageData.path);
          const cachedImage = imageCacheRef.current.get(imagePath);
          if (cachedImage) {
            loadedImage = cachedImage;
          } else {
            loadedImage = p5InstanceRef.current.loadImage(imagePath, (img) => {
              imageCacheRef.current.set(imagePath, img);
              requestRedraw();
            });
          }
        }

        newBackgroundMetadataList.push({
          ...backgroundData,
          loadedImage,
          sourceImageData,
        });
      });

      textNodesMetadata.forEach(textNodeMetadata => {
        if (!textNodeMetadata?.data) {
          return;
        }
        newTextMetadataList.push(textNodeMetadata.data as TextMetadata);
      });

      imageMetadataListRef.current = newImageMetadataList;
      backgroundMetadataListRef.current = newBackgroundMetadataList;
      textMetadataListRef.current = newTextMetadataList;
      const hasLivePreview = isGifPath(mousePointerRef.current)
        || newImageMetadataList.some(image => isGifPath(image.path))
        || newBackgroundMetadataList.some(background => isGifPath(background.sourceImageData?.path));
      hasLivePreviewRef.current = hasLivePreview;

      if (hasLivePreview) {
        if (pendingRedrawTimerRef.current !== null) {
          window.clearTimeout(pendingRedrawTimerRef.current);
          pendingRedrawTimerRef.current = null;
        }
        if (sceneBufferRef.current) {
          sceneBufferRef.current.remove();
          sceneBufferRef.current = null;
        }
        renderSignatureRef.current = '';
        p5InstanceRef.current.frameRate(30);
        p5InstanceRef.current.loop();
      } else {
        p5InstanceRef.current.noLoop();
        requestRedraw();
      }
    } else {
      imageMetadataListRef.current = [];
      backgroundMetadataListRef.current = [];
      textMetadataListRef.current = [];
      pageBackgroundColorRef.current = '#ffffff';
      hasLivePreviewRef.current = false;
      if (p5InstanceRef.current) {
        p5InstanceRef.current.cursor('default');
        p5InstanceRef.current.noLoop();
        requestRedraw();
      }
    }
  }, [pageContentSignature, pageNodeData]);

  useEffect(() => {
    return () => {
      if (pendingRedrawTimerRef.current !== null) {
        window.clearTimeout(pendingRedrawTimerRef.current);
        pendingRedrawTimerRef.current = null;
      }
      sceneBufferRef.current?.remove();
      sceneBufferRef.current = null;
    };
  }, []);

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

    requestRedraw();
  }, [getPageDimensions, pageDimensionSignature]);

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
    if (hasLivePreviewRef.current) {
      p5Instance.frameRate(30);
      p5Instance.loop();
    } else {
      p5Instance.noLoop();
      requestRedraw();
    }
  };

  const renderScene = (target: p5 | p5.Graphics, p5Instance: p5) => {
    target.background(pageBackgroundColorRef.current);

    backgroundMetadataListRef.current.forEach(backgroundData => {
      if (!backgroundData.loadedImage || backgroundData.loadedImage.width <= 0 || !backgroundData.sourceImageData) {
        return;
      }

      const sourceImageData = backgroundData.sourceImageData;
      const imageWidth = resolveDimension(
        sourceImageData.width,
        sourceImageData.autoWidth,
        backgroundData.loadedImage.width,
        100
      );
      const imageHeight = resolveDimension(
        sourceImageData.height,
        sourceImageData.autoHeight,
        backgroundData.loadedImage.height,
        100
      );

      if (imageWidth <= 0 || imageHeight <= 0) {
        return;
      }

      const style = backgroundData.style ?? 'tile';
      const surfaceWidth = resolveSurfaceDimension(backgroundData.width, backgroundData.autoWidth, p5Instance.width);
      const surfaceHeight = resolveSurfaceDimension(backgroundData.height, backgroundData.autoHeight, p5Instance.height);
      const opacity = toNumberOrNull(sourceImageData.opacity) ?? 1;

      target.push();
      target.tint(255, opacity * 255);

      if (style === 'tile') {
        for (let y = 0; y < surfaceHeight; y += imageHeight) {
          for (let x = 0; x < surfaceWidth; x += imageWidth) {
            target.image(backgroundData.loadedImage, x, y, imageWidth, imageHeight);
          }
        }
      } else {
        const positionX = toNumberOrNull(sourceImageData.positionX) ?? p5Instance.width / 2;
        const positionY = toNumberOrNull(sourceImageData.positionY) ?? p5Instance.height / 2;
        target.image(backgroundData.loadedImage, positionX, positionY, imageWidth, imageHeight);
      }

      target.pop();
    });

    imageMetadataListRef.current.forEach(imageData => {
      if (!imageData.loadedImage || imageData.loadedImage.width <= 0) {
        return;
      }

      const width = resolveDimension(imageData.width, imageData.autoWidth, imageData.loadedImage.width, 100);
      const height = resolveDimension(imageData.height, imageData.autoHeight, imageData.loadedImage.height, 100);
      const positionX = toNumberOrNull(imageData.positionX) ?? p5Instance.width / 2;
      const positionY = toNumberOrNull(imageData.positionY) ?? p5Instance.height / 2;
      const opacity = toNumberOrNull(imageData.opacity) ?? 1;

      target.push();
      target.tint(255, opacity * 255);
      target.image(imageData.loadedImage, positionX, positionY, width, height);
      target.pop();
    });

    textMetadataListRef.current.forEach(textData => {
      const rawText = typeof textData.text === 'string' ? textData.text : '';
      if (!rawText.trim()) {
        return;
      }

      const textValue = toBoolean(textData.caps) ? rawText.toUpperCase() : rawText;
      const size = Math.max(1, toNumberOrNull(textData.size) ?? 16);
      const width = Math.max(0, toNumberOrNull(textData.width) ?? 250);
      const height = Math.max(0, toNumberOrNull(textData.height) ?? 120);
      if (width <= 0 || height <= 0) {
        return;
      }

      const positionX = toNumberOrNull(textData.positionX) ?? 0;
      const positionY = toNumberOrNull(textData.positionY) ?? 0;
      const opacity = clamp(toNumberOrNull(textData.opacity) ?? 1, 0, 1);

      drawTextWithDecorations(target, p5Instance, {
        text: textValue,
        font: typeof textData.font === 'string' && textData.font.trim() ? textData.font : 'sans-serif',
        size,
        x: positionX,
        y: positionY,
        width,
        height,
        opacity,
        bold: toBoolean(textData.bold),
        italic: toBoolean(textData.italic),
        underline: toBoolean(textData.underline),
        strikethrough: toBoolean(textData.strikethrough),
      });
    });
  };

  const draw = (p5Instance: p5) => {
    loadCursorImage(p5Instance, mousePointerRef.current);

    if (hasLivePreviewRef.current) {
      renderScene(p5Instance, p5Instance);
      return;
    }

    const signature = createRenderSignature(
      p5Instance.width,
      p5Instance.height,
      pageBackgroundColorRef.current,
      backgroundMetadataListRef.current,
      imageMetadataListRef.current,
      textMetadataListRef.current
    );

    if (!sceneBufferRef.current || renderSignatureRef.current !== signature) {
      renderSignatureRef.current = signature;

      if (sceneBufferRef.current) {
        sceneBufferRef.current.remove();
      }

      sceneBufferRef.current = p5Instance.createGraphics(p5Instance.width, p5Instance.height);
      const scene = sceneBufferRef.current;
      renderScene(scene, p5Instance);
    }

    p5Instance.background(pageBackgroundColorRef.current);
    if (sceneBufferRef.current) {
      p5Instance.image(sceneBufferRef.current, 0, 0);
    }
  };

  const windowResized = (p5Instance: p5) => {
    const dimensions = getPageDimensions();
    if (dimensions) {
      p5Instance.resizeCanvas(dimensions.width, dimensions.height);
    } else {
      p5Instance.resizeCanvas(p5Instance.windowWidth, p5Instance.windowHeight);
    }

    requestRedraw();
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

const isGifPath = (path: unknown) => typeof path === 'string' && /\.gif(?:$|[?#])/i.test(path.trim());

const toBoolean = (value: unknown) => value === true || value === 'true';

const resolveDimension = (
  configuredSize: unknown,
  autoSize: unknown,
  naturalSize: number,
  fallback: number
) => {
  if (toBoolean(autoSize)) {
    return naturalSize;
  }
  return toNumberOrNull(configuredSize) ?? fallback;
};

const resolveSurfaceDimension = (configuredSize: unknown, autoSize: unknown, fallback: number) => {
  if (toBoolean(autoSize)) {
    return fallback;
  }
  return toNumberOrNull(configuredSize) ?? fallback;
};

const createRenderSignature = (
  canvasWidth: number,
  canvasHeight: number,
  pageBackgroundColor: string,
  backgrounds: BackgroundMetadataWithImage[],
  images: ImageMetadataWithImage[],
  texts: TextMetadata[]
) => {
  const backgroundSignature = backgrounds.map(item => ({
    style: item.style ?? 'tile',
    width: item.width ?? null,
    height: item.height ?? null,
    autoWidth: item.autoWidth ?? false,
    autoHeight: item.autoHeight ?? false,
    loadedImageWidth: item.loadedImage?.width ?? 0,
    loadedImageHeight: item.loadedImage?.height ?? 0,
    sourceImageData: item.sourceImageData ?? null,
  }));

  const imageSignature = images.map(item => ({
    path: item.path ?? '',
    width: item.width ?? null,
    height: item.height ?? null,
    autoWidth: item.autoWidth ?? false,
    autoHeight: item.autoHeight ?? false,
    positionX: item.positionX ?? null,
    positionY: item.positionY ?? null,
    opacity: item.opacity ?? null,
    loadedImageWidth: item.loadedImage?.width ?? 0,
    loadedImageHeight: item.loadedImage?.height ?? 0,
  }));

  const textSignature = texts.map(item => ({
    text: item.text ?? '',
    font: item.font ?? 'sans-serif',
    size: item.size ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
    positionX: item.positionX ?? null,
    positionY: item.positionY ?? null,
    opacity: item.opacity ?? null,
    bold: item.bold ?? false,
    italic: item.italic ?? false,
    underline: item.underline ?? false,
    strikethrough: item.strikethrough ?? false,
    caps: item.caps ?? false,
  }));

  return JSON.stringify({
    canvasWidth,
    canvasHeight,
    pageBackgroundColor,
    backgrounds: backgroundSignature,
    images: imageSignature,
    texts: textSignature,
  });
};

const drawTextWithDecorations = (
  target: p5 | p5.Graphics,
  p5Instance: p5,
  options: {
    text: string;
    font: string;
    size: number;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
  }
) => {
  const {text, font, size, x, y, width, height, opacity, bold, italic, underline, strikethrough} = options;

  target.push();
  target.textFont(font);
  target.textSize(size);
  target.textAlign(p5Instance.LEFT, p5Instance.TOP);

  if (bold && italic) {
    target.textStyle(p5Instance.BOLDITALIC);
  } else if (bold) {
    target.textStyle(p5Instance.BOLD);
  } else if (italic) {
    target.textStyle(p5Instance.ITALIC);
  } else {
    target.textStyle(p5Instance.NORMAL);
  }

  const alpha = clamp(Math.round(opacity * 255), 0, 255);
  target.noStroke();
  target.fill(0, alpha);

  const lines = wrapTextLines(target, text, width);
  const lineHeight = size * 1.2;
  const maxLines = Math.max(1, Math.floor(height / lineHeight));

  for (let index = 0; index < Math.min(lines.length, maxLines); index += 1) {
    const line = lines[index];
    const lineX = x;
    const lineY = y + (index * lineHeight);
    target.text(line, lineX, lineY);

    const lineWidth = target.textWidth(line);
    if (underline || strikethrough) {
      target.push();
      target.stroke(0, alpha);
      target.strokeWeight(Math.max(1, size * 0.06));
      if (underline) {
        target.line(lineX, lineY + size * 1.05, lineX + lineWidth, lineY + size * 1.05);
      }
      if (strikethrough) {
        target.line(lineX, lineY + size * 0.55, lineX + lineWidth, lineY + size * 0.55);
      }
      target.pop();
    }
  }

  target.pop();
};

const wrapTextLines = (target: p5 | p5.Graphics, text: string, maxWidth: number) => {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  paragraphs.forEach(paragraph => {
    if (!paragraph.trim()) {
      lines.push('');
      return;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = '';

    words.forEach(word => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (target.textWidth(candidate) <= maxWidth || !currentLine) {
        currentLine = candidate;
        return;
      }

      lines.push(currentLine);
      currentLine = word;
    });

    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const resolvePageBackgroundColor = (value: unknown) => {
  if (typeof value !== 'string') {
    return '#ffffff';
  }

  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : '#ffffff';
};

export default P5Preview;
