import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface CanvasOverlayProps {
    compositionWidth: number;
    compositionHeight: number;
    previewWidth: number;
    previewHeight: number;
}

type HandleId =
    | 'nw' | 'n' | 'ne'
    | 'w' | 'e'
    | 'sw' | 's' | 'se'
    | 'rotate'
    | 'body';

interface DragStart {
    handle: HandleId;
    mouseX: number;
    mouseY: number;
    initX: number;
    initY: number;
    initScale: number;
    initRotation: number;
    initDist: number;
    initAngle: number;
}

const HANDLE_SIZE = 8;
const ROTATE_OFFSET = 24;

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
    compositionWidth,
    compositionHeight,
    previewWidth,
    previewHeight,
}) => {
    // ── ALL HOOKS MUST BE HERE (before any early returns) ──────────────────────
    const svgRef = useRef<SVGSVGElement>(null);
    const dragRef = useRef<DragStart | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
    const currentProject = useEditorStore((s) => s.currentProject);
    const updateLayerTransform = useEditorStore((s) => s.updateLayerTransform);
    const selectLayer = useEditorStore((s) => s.selectLayer);

    // Find the selected layer
    const selectedLayer = useMemo(() => {
        if (!currentProject || !selectedLayerId) return null;
        const sceneId = currentProject.currentSceneId;
        const scene = currentProject.scenes.find((s) => s.id === sceneId);
        if (scene) {
            const l = scene.layers.find((l) => l.id === selectedLayerId);
            if (l) return l;
        }
        return currentProject.layers.find((l) => l.id === selectedLayerId) ?? null;
    }, [currentProject, selectedLayerId]);

    // Preview scale (composition → preview pixels)
    const ps = Math.min(previewWidth / compositionWidth, previewHeight / compositionHeight);
    const offsetX = (previewWidth - compositionWidth * ps) / 2;
    const offsetY = (previewHeight - compositionHeight * ps) / 2;

    const toPreview = useCallback(
        (compX: number, compY: number) => ({
            x: compX * ps + offsetX,
            y: compY * ps + offsetY,
        }),
        [ps, offsetX, offsetY]
    );

    const toDelta = useCallback(
        (dx: number, dy: number) => ({ dx: dx / ps, dy: dy / ps }),
        [ps]
    );

    // Derived geometry (safe defaults when no layer selected)
    const transform = selectedLayer?.transform;
    const tx = transform?.x ?? 0;
    const ty = transform?.y ?? 0;
    const tScale = transform?.scale ?? 1;
    const tRotation = transform?.rotation ?? 0;

    const ccx = compositionWidth / 2 + tx;
    const ccy = compositionHeight / 2 + ty;
    const { x: cx, y: cy } = toPreview(ccx, ccy);
    const bw = compositionWidth * tScale * ps;
    const bh = compositionHeight * tScale * ps;

    // Helper to get SVG-space mouse position
    const getSVGPoint = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!svgRef.current) return { sx: 0, sy: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
    }, []);

    // ── useEffect BEFORE any early return ──────────────────────────────────────
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const d = dragRef.current;
            if (!d || !selectedLayerId) return;

            const { sx, sy } = getSVGPoint(e);
            const dmouseX = sx - d.mouseX;
            const dmouseY = sy - d.mouseY;

            if (d.handle === 'body') {
                const { dx, dy } = toDelta(dmouseX, dmouseY);
                updateLayerTransform(selectedLayerId, {
                    x: d.initX + dx,
                    y: d.initY + dy,
                });
            } else if (d.handle === 'rotate') {
                const dxFromCenter = sx - cx;
                const dyFromCenter = sy - cy;
                const currentAngle = Math.atan2(dyFromCenter, dxFromCenter);
                const deltaAngle = ((currentAngle - d.initAngle) * 180) / Math.PI;
                updateLayerTransform(selectedLayerId, {
                    rotation: d.initRotation + deltaAngle,
                });
            } else {
                // Scale via distance from center
                const dxFromCenter = sx - cx;
                const dyFromCenter = sy - cy;
                const currentDist = Math.sqrt(dxFromCenter ** 2 + dyFromCenter ** 2);
                if (d.initDist > 0) {
                    const newScale = Math.max(0.05, d.initScale * (currentDist / d.initDist));
                    updateLayerTransform(selectedLayerId, { scale: newScale });
                }
            }
        };

        const handleMouseUp = () => {
            dragRef.current = null;
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selectedLayerId, cx, cy, toDelta, updateLayerTransform, getSVGPoint]);

    // ── Now safe to early-return (all hooks done) ──────────────────────────────
    if (!selectedLayer) {
        return (
            <svg
                ref={svgRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
        );
    }

    // ── Geometry helpers ───────────────────────────────────────────────────────
    const rot = tRotation;
    const rotPoint = (px: number, py: number) => {
        const rad = (rot * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = px - cx;
        const dy = py - cy;
        return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
    };

    const corners: Record<Exclude<HandleId, 'rotate' | 'body'>, { x: number; y: number }> = {
        nw: rotPoint(cx - bw / 2, cy - bh / 2),
        n: rotPoint(cx, cy - bh / 2),
        ne: rotPoint(cx + bw / 2, cy - bh / 2),
        w: rotPoint(cx - bw / 2, cy),
        e: rotPoint(cx + bw / 2, cy),
        sw: rotPoint(cx - bw / 2, cy + bh / 2),
        s: rotPoint(cx, cy + bh / 2),
        se: rotPoint(cx + bw / 2, cy + bh / 2),
    };

    const rotHandleBase = rotPoint(cx, cy - bh / 2 - ROTATE_OFFSET);
    const rotHandleLineEnd = rotPoint(cx, cy - bh / 2);

    const boxPoints = [
        rotPoint(cx - bw / 2, cy - bh / 2),
        rotPoint(cx + bw / 2, cy - bh / 2),
        rotPoint(cx + bw / 2, cy + bh / 2),
        rotPoint(cx - bw / 2, cy + bh / 2),
    ]
        .map((p) => `${p.x},${p.y}`)
        .join(' ');

    // ── Interaction ────────────────────────────────────────────────────────────
    const onMouseDown = (handle: HandleId) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const { sx, sy } = getSVGPoint(e);
        const dxFromCenter = sx - cx;
        const dyFromCenter = sy - cy;
        dragRef.current = {
            handle,
            mouseX: sx,
            mouseY: sy,
            initX: tx,
            initY: ty,
            initScale: tScale,
            initRotation: tRotation,
            initDist: Math.sqrt(dxFromCenter ** 2 + dyFromCenter ** 2),
            initAngle: Math.atan2(dyFromCenter, dxFromCenter),
        };
        setIsDragging(true);
    };

    const handleCursor = (h: HandleId): string => {
        switch (h) {
            case 'nw': case 'se': return 'nwse-resize';
            case 'ne': case 'sw': return 'nesw-resize';
            case 'n': case 's': return 'ns-resize';
            case 'w': case 'e': return 'ew-resize';
            case 'rotate': return 'crosshair';
            default: return 'move';
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <svg
            ref={svgRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                userSelect: 'none',
            }}
            onMouseDown={(e) => {
                if (e.target === svgRef.current) selectLayer(null);
            }}
        >
            <defs>
                <filter id="handle-shadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.5)" />
                </filter>
            </defs>

            {/* Selection box (dashed outline — stroke only, transparent fill) */}
            <polygon
                points={boxPoints}
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                style={{ cursor: 'move', pointerEvents: 'stroke' }}
                onMouseDown={onMouseDown('body')}
            />
            {/* Fill hit-area for drag-to-move */}
            <polygon
                points={boxPoints}
                fill="transparent"
                stroke="none"
                style={{ cursor: 'move', pointerEvents: 'fill' }}
                onMouseDown={onMouseDown('body')}
            />

            {/* Rotation connector line */}
            <line
                x1={rotHandleLineEnd.x}
                y1={rotHandleLineEnd.y}
                x2={rotHandleBase.x}
                y2={rotHandleBase.y}
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="3 2"
                style={{ pointerEvents: 'none' }}
            />

            {/* Rotation handle (circle with ↻) */}
            <circle
                cx={rotHandleBase.x}
                cy={rotHandleBase.y}
                r={HANDLE_SIZE}
                fill="white"
                stroke="#3b82f6"
                strokeWidth={2}
                filter="url(#handle-shadow)"
                style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                onMouseDown={onMouseDown('rotate')}
            />
            <text
                x={rotHandleBase.x}
                y={rotHandleBase.y + 4}
                textAnchor="middle"
                fontSize={10}
                fill="#3b82f6"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                ↻
            </text>

            {/* 8 resize handles */}
            {(Object.entries(corners) as [Exclude<HandleId, 'rotate' | 'body'>, { x: number; y: number }][]).map(
                ([id, pos]) => {
                    const isCorner = ['nw', 'ne', 'sw', 'se'].includes(id);
                    return (
                        <rect
                            key={id}
                            x={pos.x - HANDLE_SIZE / 2}
                            y={pos.y - HANDLE_SIZE / 2}
                            width={HANDLE_SIZE}
                            height={HANDLE_SIZE}
                            rx={isCorner ? 2 : 1}
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth={isCorner ? 2 : 1.5}
                            filter="url(#handle-shadow)"
                            style={{ cursor: handleCursor(id), pointerEvents: 'all' }}
                            onMouseDown={onMouseDown(id)}
                        />
                    );
                }
            )}

            {/* Live tooltip during drag */}
            {isDragging && (
                <g>
                    <rect
                        x={cx - bw / 2}
                        y={cy + bh / 2 + 6}
                        width={210}
                        height={18}
                        rx={3}
                        fill="rgba(0,0,0,0.75)"
                    />
                    <text
                        x={cx - bw / 2 + 6}
                        y={cy + bh / 2 + 18}
                        fontSize={10}
                        fill="#93c5fd"
                        style={{ pointerEvents: 'none', fontFamily: 'monospace' }}
                    >
                        {`x:${Math.round(tx)}  y:${Math.round(ty)}  s:${tScale.toFixed(2)}  r:${Math.round(tRotation)}°`}
                    </text>
                </g>
            )}
        </svg>
    );
};
