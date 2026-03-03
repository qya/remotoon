import React, { useCallback, useRef } from 'react';

type Direction = 'horizontal' | 'vertical';

interface ResizeHandleProps {
    direction: Direction;
    onResize: (delta: number) => void;
    className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
    direction,
    onResize,
    className = '',
}) => {
    const isDragging = useRef(false);
    const lastPos = useRef(0);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            isDragging.current = true;
            lastPos.current = direction === 'horizontal' ? e.clientX : e.clientY;

            const onMouseMove = (ev: MouseEvent) => {
                if (!isDragging.current) return;
                const current = direction === 'horizontal' ? ev.clientX : ev.clientY;
                const delta = current - lastPos.current;
                lastPos.current = current;
                onResize(delta);
            };

            const onMouseUp = () => {
                isDragging.current = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        },
        [direction, onResize]
    );

    const isHorizontal = direction === 'horizontal';

    return (
        <div
            onMouseDown={onMouseDown}
            className={`
        flex-shrink-0
        ${isHorizontal
                    ? 'w-1 cursor-col-resize hover:bg-[#00a8e8]/60 active:bg-[#00a8e8]'
                    : 'h-1 cursor-row-resize hover:bg-[#00a8e8]/60 active:bg-[#00a8e8]'
                }
        bg-transparent transition-colors duration-150
        ${className}
      `}
            title="Drag to resize"
        />
    );
};
