import {
  ReactFlow,
  useNodesState,
  useEdgesState, Background,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import {type AppUIProps} from '../types/supabaseTypes.ts';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import '@xyflow/react/dist/style.css';
import PageNode from './nodes/PageNode.tsx';
import ImageNode from "./nodes/ImageNode.tsx";
import type {PageNodeData} from "../types/nodeTypes.ts";
import {syncNodesFromEdges, updateNodeDataAndPropagate} from "../utils/nodeUtils.ts";
import {NODE_TYPES} from '../types/nodeTypes';
import {CONNECTION_RULES} from "../types/handleTypes.ts";
import P5Preview from './P5Preview.tsx';
import ExportP5Project from './ExportP5Project.tsx';
import BackgroundNode from './nodes/BackgroundNode.tsx';
import {toNumberOrNull} from '../utils/numberUtils.ts';
import TextNode from './nodes/TextNode.tsx';
import EventNode from './nodes/EventNode.tsx';
import ExternalLinkNode from './nodes/ExternalLinkNode.tsx';
import MaskNode from './nodes/MaskNode.tsx';
import {
  DEFAULT_LATEST_SELECTED_PAGE_NAME,
  getLatestSelectedPageNameFromSession,
  setLatestSelectedPageNameInSession,
} from '../utils/sessionStorage.ts';
import {supabase} from '../utils/supabaseClient.ts';
import {getLocalImageDataUrl} from '../utils/localImageCache.ts';
import ChangeLogPopUp from './ChangeLogPopUp.tsx';
import AddNodesDropdown from './AddNodesDropdown.tsx';

const nodeTypes = {
  pageNode: PageNode,
  imageNode: ImageNode,
  backgroundNode: BackgroundNode,
  textNode: TextNode,
  eventNode: EventNode,
  maskNode: MaskNode,
  externalLinkNode: ExternalLinkNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: NODE_TYPES.PAGE,
    data: {label: NODE_TYPES.PAGE, name: 'index.html', backgroundColor: '#add5d5'} as PageNodeData,
    position: { x: 250, y: 5 },
  }
];

const initialEdges: Edge[] = [];

type PersistedNode = {
  id?: unknown;
  type?: unknown;
  data?: unknown;
  position?: {
    x?: unknown;
    y?: unknown;
  };
};

type UserProfileProjectRow = {
  data?: unknown;
};

type PersistedProjectData = {
  nodes: Node[];
  edges: Edge[];
};

type NodeDataWithMetadata = {
  metadata?: {
    sourceNodes?: Array<{ nodeId: string; handleType: string }>;
  };
  connectionImpactKey?: number;
  [key: string]: unknown;
};


const FlowCanvas = ({ session, handleLogout }: AppUIProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Prevent deletion of the first page node
  const handleNodesChange = useCallback((changes: any[]) => {
    const filteredChanges = changes.filter((change) => {
      if (change.type === 'remove' && change.id === '1') {
        return false; // Block deletion of first page node
      }
      return true;
    });
    onNodesChange(filteredChanges);
  }, [onNodesChange]);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [latestSelectedPageName, setLatestSelectedPageName] = useState(() => getLatestSelectedPageNameFromSession());
  const previousMetadataSignatureByNodeIdRef = useRef<Map<string, string>>(new Map());
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const latestNodesRef = useRef(nodes);
  const latestEdgesRef = useRef(edges);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedNodesRef = useRef<Node[]>([]);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const onAutoTextDimensions = useCallback((nodeId: string, dimensions: {width: number; height: number}) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find((item) => item.id === nodeId);
      if (!node || node.type !== NODE_TYPES.TEXT || node.data.autoSize !== true
        || (node.data.width === dimensions.width && node.data.height === dimensions.height)) {
        return currentNodes;
      }
      return updateNodeDataAndPropagate(currentNodes, edges, nodeId, dimensions);
    });
  }, [edges, setNodes]);
  const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
  const [copiedEdges, setCopiedEdges] = useState<Edge[]>([]);

  useEffect(() => {
    latestNodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    latestEdgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (!autosaveEnabled) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        await supabase
          .from('user_profiles')
          .update({ data: { nodes: latestNodesRef.current, edges: latestEdgesRef.current } })
          .eq('user_id', session.user.id);
        setLastSavedAt(new Date());
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autosaveEnabled, session.user.id]);

  useEffect(() => {
    let isActive = true;

    const loadNodesFromProfile = async () => {
      const {data, error} = await supabase
        .from('user_profiles')
        .select('data')
        .eq('user_id', session.user.id)
        .maybeSingle<UserProfileProjectRow>();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error('Failed to load saved project from public.user_profiles:', error);
        return;
      }

      const persistedProjectData = normalizePersistedProjectData(data?.data);

      if (!persistedProjectData) {
        return;
      }

      const hydratedNodes = await hydrateNodesWithLocalImageCache(persistedProjectData.nodes);
      setNodes(hydratedNodes.length > 0 ? hydratedNodes : initialNodes);
      setEdges(persistedProjectData.edges);
    };

    void loadNodesFromProfile();

    return () => {
      isActive = false;
    };
  }, [session.user.id, setEdges, setNodes]);

  const persistSelectedPageNode = useCallback((node: Node) => {
    if (node.type !== NODE_TYPES.PAGE) {
      return;
    }

    const pageData = node.data as PageNodeData | undefined;
    const nextPageName = resolveSelectedPageName(pageData?.name);
    setLatestSelectedPageName(nextPageName);
    setLatestSelectedPageNameInSession(nextPageName);
  }, []);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    selectedNodesRef.current = selectedNodes;
    const selectedPageNode = selectedNodes.find((node) => node.type === NODE_TYPES.PAGE);
    if (selectedPageNode) {
      persistSelectedPageNode(selectedPageNode);
    }
  }, [persistSelectedPageNode]);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    persistSelectedPageNode(node);
  }, [persistSelectedPageNode]);

  const onConnect = useCallback(
      (connection: Connection) => {
        const normalizedConnection = normalizeConnectionDirection(connection);
        if (!normalizedConnection) {
          return;
        }

        const sourceId = normalizedConnection.source;
        const targetId = normalizedConnection.target;

        if (!sourceId || !targetId) {
          return;
        }

        if (normalizedConnection.sourceHandle === 'red-output'
          && normalizedConnection.targetHandle === 'red-input') {
          const candidateSource = nodes.find(node => node.id === sourceId);
          const candidateTarget = nodes.find(node => node.id === targetId);
          if (candidateSource?.type === NODE_TYPES.PAGE && candidateTarget?.type === NODE_TYPES.EVENT) {
            const candidateData = candidateSource.data as {popUp?: boolean};
            if (candidateData.popUp !== true) {
              const existingPrimary = edges.some(edge => {
                if (edge.target !== targetId || edge.targetHandle !== 'red-input') return false;
                const page = nodes.find(node => node.id === edge.source);
                return page?.type === NODE_TYPES.PAGE
                  && (page.data as {popUp?: boolean}).popUp !== true;
              });
              if (existingPrimary) return;
            }
          }
        }

        setEdges((eds) => addEdge(normalizedConnection, eds));
      },
      [edges, nodes, setEdges]
  );

  // Update target nodes when connections change
  useEffect(() => {
    setNodes((currentNodes) => syncNodesFromEdges(currentNodes, edges));
  }, [edges, setNodes]);

  // Trigger impact animation whenever a node metadata payload changes
  useEffect(() => {
    if (!animationsEnabled) {
      setNodes((currentNodes) => {
        let hasChanges = false;
        const nextNodes = currentNodes.map((node) => {
          if (!node.data.connectionImpactKey) {
            return node;
          }

          hasChanges = true;
          return {
            ...node,
            data: {
              ...node.data,
              connectionImpactKey: undefined,
            },
          };
        });

        return hasChanges ? nextNodes : currentNodes;
      });
      return;
    }

    const currentSignatures = new Map<string, string>();
    const impactedNodeIds: string[] = [];

    nodes.forEach((node) => {
      const nodeData = node.data as NodeDataWithMetadata;
      const metadataSignature = JSON.stringify(nodeData.metadata?.sourceNodes ?? []);
      currentSignatures.set(node.id, metadataSignature);

      const previousSignature = previousMetadataSignatureByNodeIdRef.current.get(node.id);
      if (typeof previousSignature === 'string' && previousSignature !== metadataSignature) {
        impactedNodeIds.push(node.id);
      }
    });

    previousMetadataSignatureByNodeIdRef.current = currentSignatures;

    if (impactedNodeIds.length === 0) {
      return;
    }

    const impactKey = Date.now();
    const impactedNodeIdSet = new Set(impactedNodeIds);

    setNodes((currentNodes) => currentNodes.map((node) => {
      if (!impactedNodeIdSet.has(node.id)) {
        return node;
      }

      return {
        ...node,
        data: {
          ...node.data,
          connectionImpactKey: impactKey,
        },
      };
    }));

    window.setTimeout(() => {
      setNodes((currentNodes) => currentNodes.map((node) => {
        if (!impactedNodeIdSet.has(node.id)) {
          return node;
        }

        if (node.data.connectionImpactKey !== impactKey) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            connectionImpactKey: undefined,
          },
        };
      }));
    }, 520);
  }, [animationsEnabled, nodes, setNodes]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  const selectedPageNode = useMemo(
    () => resolveSelectedPageNode(nodes, latestSelectedPageName),
    [latestSelectedPageName, nodes]
  );
  const selectedPageData = selectedPageNode?.data as PageNodeData | undefined;

  const sceneSize = useMemo(() => {
    const configuredWidth = toNumberOrNull(selectedPageData?.width);
    const configuredHeight = toNumberOrNull(selectedPageData?.height);

    const canvasWidth = Math.max(1, configuredWidth ?? viewportSize.width);
    const canvasHeight = Math.max(1, configuredHeight ?? viewportSize.height);

    return {
      width: Math.max(canvasWidth, viewportSize.width),
      height: Math.max(canvasHeight, viewportSize.height),
    };
  }, [selectedPageData?.height, selectedPageData?.width, viewportSize.height, viewportSize.width]);

  const pageBackgroundColor = useMemo(() => {
    return resolvePageBackgroundColor(selectedPageData?.backgroundColor);
  }, [selectedPageData?.backgroundColor]);

  // validate node connections based on the node input type
  const isValidConnection = useCallback((connection: Edge | Connection) => {
    const normalizedConnection = normalizeConnectionDirection(connection);
    if (!normalizedConnection) {
      return false;
    }

    const sourceHandle = normalizedConnection.sourceHandle;
    const targetHandle = normalizedConnection.targetHandle;
    const targetNode = nodes.find(node => node.id === normalizedConnection.target);

    // Disallow multiple connections between the same nodes
    const hasConnectionBetweenNodes = edges.some(
      (edge) =>
        (edge.source === normalizedConnection.source && edge.target === normalizedConnection.target)
        || (edge.source === normalizedConnection.target && edge.target === normalizedConnection.source)
    );

    const sourceType = sourceHandle?.split('-')[0];
    const targetType = targetHandle?.split('-')[0];

    if (sourceType !== targetType) {
      return false;
    }

    if (hasConnectionBetweenNodes) {
      return false;
    }

    if (normalizedConnection.sourceHandle === 'red-output'
      && normalizedConnection.targetHandle === 'red-input'
      && nodes.find(node => node.id === normalizedConnection.source)?.type === NODE_TYPES.PAGE
      && targetNode?.type === NODE_TYPES.EVENT) {
      const pageData = nodes.find(node => node.id === normalizedConnection.source)?.data as {popUp?: boolean} | undefined;
      if (pageData?.popUp !== true && edges.some(edge => {
        if (edge.target !== normalizedConnection.target || edge.targetHandle !== 'red-input') return false;
        const page = nodes.find(node => node.id === edge.source);
        return page?.type === NODE_TYPES.PAGE && (page.data as {popUp?: boolean}).popUp !== true;
      })) {
        return false;
      }
    }

    const isTextNodeInput = String(targetNode?.type) === NODE_TYPES.TEXT
      && (targetType === 'turquoise' || targetType === 'sage');

    if (isTextNodeInput) {
      return true;
    }

    const rules = CONNECTION_RULES[targetType || ''];
    if (!rules?.allowMultiple) {
      const existingConnection = edges.find(
        (edge) => edge.target === normalizedConnection.target && edge.targetHandle === targetHandle
      );
      if (existingConnection) {
        return false;
      }
    }

    return true;
  }, [edges, nodes]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleExportNodes = () => {
    const payload = { nodes, edges };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'nodes.json';
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleLoadNodes = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as
          | Node[]
          | { nodes?: Node[]; edges?: Edge[] };
        if (Array.isArray(parsed)) {
          setNodes(parsed);
          return;
        }
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.nodes)) {
            setNodes(parsed.nodes);
          }
          if (Array.isArray(parsed.edges)) {
            setEdges(parsed.edges);
          }
        }
      } catch {
        // Ignore invalid JSON
      }
    };
    reader.readAsText(file);

    event.target.value = '';
  };

  const handleCopy = useCallback(() => {
    const selected = selectedNodesRef.current;
    if (selected.length === 0) return;

    // Get IDs of selected nodes
    const selectedIds = new Set(selected.map(n => n.id));

    // Find edges that connect only between selected nodes (internal connections)
    const internalEdges = edges.filter(edge =>
      selectedIds.has(edge.source) && selectedIds.has(edge.target)
    );

    setCopiedNodes(selected);
    setCopiedEdges(internalEdges);
  }, [edges]);

  const handlePaste = useCallback(() => {
    if (copiedNodes.length === 0) return;

    const reactFlowInstance = reactFlowInstanceRef.current;
    const flowScrollContainer = document.getElementById('imywis-flow-scroll-container');
    if (!reactFlowInstance || !flowScrollContainer) {
      return;
    }

    const scrollContainerBounds = flowScrollContainer.getBoundingClientRect();
    const viewportCenter = reactFlowInstance.screenToFlowPosition({
      x: scrollContainerBounds.left + (flowScrollContainer.clientWidth / 2),
      y: scrollContainerBounds.top + (flowScrollContainer.clientHeight / 2),
    });
    const copiedGroupBounds = getNodeGroupBounds(copiedNodes);
    const positionOffset = {
      x: viewportCenter.x - ((copiedGroupBounds.minX + copiedGroupBounds.maxX) / 2),
      y: viewportCenter.y - ((copiedGroupBounds.minY + copiedGroupBounds.maxY) / 2),
    };

    // Generate new IDs for pasted nodes
    const maxId = nodes.length > 0 ? Math.max(...nodes.map(n => Number(n.id) || 0)) : 0;
    const idMap = new Map<string, string>();

    copiedNodes.forEach((node, index) => {
      const newId = `${maxId + index + 1}`;
      idMap.set(node.id, newId);
    });

    // Clone nodes with new IDs while centering the copied group in the current viewport.
    const newNodes: Node[] = copiedNodes.map(node => {
      const newId = idMap.get(node.id)!;
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + positionOffset.x,
          y: node.position.y + positionOffset.y,
        },
        data: {
          ...node.data,
          // Remove connection impact key to avoid animation artifacts
          connectionImpactKey: undefined,
        },
        selected: true,
      };
    });

    // Clone internal edges with remapped IDs
    const newEdges: Edge[] = copiedEdges.map(edge => {
      const newSource = idMap.get(edge.source);
      const newTarget = idMap.get(edge.target);

      if (!newSource || !newTarget) {
        return null;
      }

      return {
        ...edge,
        id: `${newSource}-${newTarget}-${edge.sourceHandle}-${edge.targetHandle}`,
        source: newSource,
        target: newTarget,
      };
    }).filter((edge): edge is Edge => edge !== null);

    // Deselect existing nodes and add new nodes with selection
    setNodes(currentNodes => [
      ...currentNodes.map(n => ({ ...n, selected: false })),
      ...newNodes
    ]);
    setEdges(currentEdges => [...currentEdges, ...newEdges]);
  }, [copiedNodes, copiedEdges, nodes, setNodes, setEdges]);

  // Keyboard event listener for copy/paste
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ignore if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (isCtrlOrCmd && event.key === 'c') {
        event.preventDefault();
        handleCopy();
      } else if (isCtrlOrCmd && event.key === 'v') {
        event.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleCopy, handlePaste]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        backgroundColor: 'rgb(26, 25, 43)',
        borderBottom: '1px solid #e0e0e0',
        padding: '6px 12px',
        zIndex: 9999
      }}>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center', flex: 1}}>
          {/* Add Nodes Dropdown - rendered inside ReactFlow */}
          <button
            onClick={() => toggleDropdown('add')}
            style={{padding: '4px 8px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgb(26, 25, 43)', cursor: 'pointer'}}
          >
            Add ▾
          </button>

          {/* Settings Dropdown */}
          <div style={{position: 'relative'}}>
            <button
              onClick={() => toggleDropdown('settings')}
              style={{padding: '4px 8px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgb(26, 25, 43)', cursor: 'pointer'}}
            >
              Settings ▾
            </button>
            {openDropdown === 'settings' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'rgb(26, 25, 43)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '8px',
                minWidth: '200px',
                zIndex: 10000
              }}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  <label style={{fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                    <input
                      type="checkbox"
                      checked={animationsEnabled}
                      onChange={(e) => setAnimationsEnabled(e.target.checked)}
                    />
                    Animations
                  </label>
                  <label style={{fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                    <input
                      type="checkbox"
                      checked={autosaveEnabled}
                      onChange={(e) => setAutosaveEnabled(e.target.checked)}
                    />
                    Autosave
                  </label>
                  {lastSavedAt && (
                    <div style={{fontSize: '9px', color: '#666', marginTop: '4px'}}>
                      Last saved: {lastSavedAt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview Toggle */}
          <label style={{fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'white'}}>
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(e) => setPreviewEnabled(e.target.checked)}
            />
            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px'}}>
              Preview: {latestSelectedPageName}
            </span>
          </label>
        </div>

        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <button
            onClick={handleLoadNodes}
            style={{padding: '4px 8px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgba(26, 25, 43, 0.5)', cursor: 'pointer', opacity: 0.7}}
          >
            Load Nodes
          </button>
          <button
            onClick={handleExportNodes}
            style={{padding: '4px 8px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgba(26, 25, 43, 0.5)', cursor: 'pointer', opacity: 0.7}}
          >
            Export Nodes
          </button>
        </div>

        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <ExportP5Project
            nodes={nodes}
            edges={edges}
            session={session}
            onSavedAtChange={setLastSavedAt}
          />
        </div>

        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <p style={{fontSize: '10px', margin: 0}}>{session.user.email}</p>
          <button onClick={handleLogout} style={{padding: '4px 8px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgb(26, 25, 43)', cursor: 'pointer'}}>
            Logout
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div
        id="imywis-flow-scroll-container"
        className={animationsEnabled ? undefined : 'imywis-animations-disabled'}
        style={{
          position: 'fixed',
          top: '40px',
          right: 0,
          bottom: 0,
          left: 0,
          overflowX: 'scroll',
          overflowY: 'scroll',
          overscrollBehavior: 'contain',
          scrollbarGutter: 'stable',
        }}
      >
        <div
          style={{
            width: `${sceneSize.width}px`,
            height: `${sceneSize.height}px`,
            minWidth: '100%',
            minHeight: '100%',
            position: 'relative',
          }}
        >
        <ChangeLogPopUp />
        {previewEnabled ? (
          <P5Preview
            nodes={nodes}
            selectedPageNode={selectedPageNode}
            onAutoTextDimensions={onAutoTextDimensions}
          />
        ) : null}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onNodeClick={onNodeClick}
          onConnect={onConnect}
          onInit={(instance) => {
            reactFlowInstanceRef.current = instance;
          }}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          style={{ width: '100%', height: '100%' }}
        >
          <AddNodesDropdown isOpen={openDropdown === 'add'} />
          <Background bgColor={previewEnabled ? 'transparent' : pageBackgroundColor} />
        </ReactFlow>
      </div>
    </div>
    </>
  );
};

const resolveSelectedPageNode = (nodes: Node[], selectedPageName: string) => {
  const pageNodes = nodes.filter(node => node.type === NODE_TYPES.PAGE);
  if (pageNodes.length === 0) {
    return undefined;
  }

  const normalizedSelectedPageName = selectedPageName.trim();
  if (normalizedSelectedPageName && normalizedSelectedPageName !== DEFAULT_LATEST_SELECTED_PAGE_NAME) {
    const matchingPageNode = pageNodes.find((node) => {
      const pageData = node.data as PageNodeData | undefined;
      return (pageData?.name ?? '').trim() === normalizedSelectedPageName;
    });

    if (matchingPageNode) {
      return matchingPageNode;
    }
  }

  return pageNodes[0];
};

const resolvePageBackgroundColor = (value: unknown) => {
  if (typeof value !== 'string') {
    return '#ffffff';
  }

  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : '#ffffff';
};

const normalizeConnectionDirection = (connection: Edge | Connection): Connection | null => {
  const source = connection.source;
  const target = connection.target;
  const sourceHandle = connection.sourceHandle;
  const targetHandle = connection.targetHandle;

  if (!source || !target || !sourceHandle || !targetHandle) {
    return null;
  }

  const sourceRole = getHandleRole(sourceHandle);
  const targetRole = getHandleRole(targetHandle);

  if (sourceRole === 'output' && targetRole === 'input') {
    return {
      source,
      target,
      sourceHandle,
      targetHandle,
    };
  }

  if (sourceRole === 'input' && targetRole === 'output') {
    return {
      source: target,
      target: source,
      sourceHandle: targetHandle,
      targetHandle: sourceHandle,
    };
  }

  return null;
};

const getHandleRole = (handleId: string): 'input' | 'output' | null => {
  if (handleId.includes('-input')) {
    return 'input';
  }
  if (handleId.includes('-output')) {
    return 'output';
  }
  return null;
};

const resolveSelectedPageName = (value: unknown) => {
  if (typeof value !== 'string') {
    return 'Unnamed page';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'Unnamed page';
};

const normalizePersistedProjectData = (value: unknown): PersistedProjectData | null => {
  if (Array.isArray(value)) {
    const nodes = normalizePersistedNodes(value);
    if (!nodes) {
      return null;
    }

    return {
      nodes,
      edges: [],
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const nodesValue = value.nodes;
  const edgesValue = value.edges;
  const nodes = normalizePersistedNodes(nodesValue);
  const edges = normalizePersistedEdges(edgesValue);

  if (!nodes || !edges) {
    return null;
  }

  return {
    nodes,
    edges,
  };
};

const normalizePersistedNodes = (value: unknown): Node[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedNodes: Node[] = [];

  value.forEach((item) => {
    const candidate = item as PersistedNode;
    const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0
      ? candidate.id
      : null;
    const type = typeof candidate.type === 'string'
      && Object.values(NODE_TYPES).includes(candidate.type as typeof NODE_TYPES[keyof typeof NODE_TYPES])
      ? candidate.type
      : null;
    const positionX = typeof candidate.position?.x === 'number' ? candidate.position.x : 0;
    const positionY = typeof candidate.position?.y === 'number' ? candidate.position.y : 0;
    const data = isRecord(candidate.data) ? candidate.data : null;

    if (!id || !type || !data) {
      return;
    }

    parsedNodes.push({
      id,
      type,
      data: {
        label: typeof data.label === 'string' ? data.label : String(type),
        ...data,
      },
      position: {
        x: positionX,
        y: positionY,
      },
    });
  });

  return parsedNodes;
};

const normalizePersistedEdges = (value: unknown): Edge[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedEdges: Edge[] = [];

  value.forEach((item) => {
    if (!isRecord(item)) {
      return;
    }

    const id = typeof item.id === 'string' ? item.id : null;
    const source = typeof item.source === 'string' ? item.source : null;
    const target = typeof item.target === 'string' ? item.target : null;

    if (!id || !source || !target) {
      return;
    }

    parsedEdges.push({
      ...item,
      id,
      source,
      target,
    } as Edge);
  });

  return parsedEdges;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const hydrateNodesWithLocalImageCache = async (nodes: Node[]): Promise<Node[]> => {
  const dataUrlByPathCache = new Map<string, string | null>();

  const resolveCachedDataUrl = async (path: string) => {
    const normalizedPath = path.trim();
    if (!normalizedPath.startsWith('local:')) {
      return null;
    }

    if (dataUrlByPathCache.has(normalizedPath)) {
      return dataUrlByPathCache.get(normalizedPath) ?? null;
    }

    const cachedDataUrl = await getLocalImageDataUrl(normalizedPath);
    dataUrlByPathCache.set(normalizedPath, cachedDataUrl);
    return cachedDataUrl;
  };

  const hydrateValue = async (value: unknown): Promise<unknown> => {
    if (Array.isArray(value)) {
      const hydratedItems = await Promise.all(value.map((item) => hydrateValue(item)));
      return hydratedItems;
    }

    if (!isRecord(value)) {
      return value;
    }

    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    const pathValue = typeof record.path === 'string' ? record.path : '';
    const localImageDataUrlValue = typeof record.localImageDataUrl === 'string'
      ? record.localImageDataUrl.trim()
      : '';

    const keys = Object.keys(record);
    for (const key of keys) {
      output[key] = await hydrateValue(record[key]);
    }

    if (!localImageDataUrlValue && pathValue.trim().startsWith('local:')) {
      const cachedDataUrl = await resolveCachedDataUrl(pathValue);
      if (cachedDataUrl) {
        output.localImageDataUrl = cachedDataUrl;
      }
    }

    return output;
  };

  const hydratedNodes = await Promise.all(nodes.map(async (node) => ({
    ...node,
    data: await hydrateValue(node.data) as Record<string, unknown>,
  })));

  return hydratedNodes;
};

const getNodeGroupBounds = (nodes: Node[]) => nodes.reduce((bounds, node) => {
  const width = node.measured?.width ?? node.width ?? 0;
  const height = node.measured?.height ?? node.height ?? 0;
  return {
    minX: Math.min(bounds.minX, node.position.x),
    minY: Math.min(bounds.minY, node.position.y),
    maxX: Math.max(bounds.maxX, node.position.x + width),
    maxY: Math.max(bounds.maxY, node.position.y + height),
  };
}, {
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
});

export default FlowCanvas;
