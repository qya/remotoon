import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { getAvailableEmojis } from '@remotion/animated-emoji';
import {
  Sparkles,
  Smile,
  Search,
  Plus,
  Box,
  Heart as HeartIcon,
  Circle as CircleIcon,
  Square as SquareIcon,
  Triangle as TriangleIcon,
  Star as StarIcon
} from 'lucide-react';

type Tab = 'emoji' | 'shapes';

interface ShapePreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  code: string;
  defaultProps: Record<string, any>;
}

export const StickersPanel: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const addComponentLayer = useEditorStore((state) => state.addComponentLayer);

  const [activeTab, setActiveTab] = useState<Tab>('emoji');
  const [searchQuery, setSearchQuery] = useState('');

  // Get available emojis from @remotion/animated-emoji
  const emojis = useMemo(() => {
    try {
      return getAvailableEmojis();
    } catch (e) {
      console.error('Failed to load emojis', e);
      return [];
    }
  }, []);

  // Filtered emojis based on search query
  const filteredEmojis = useMemo(() => {
    return emojis.filter((emoji) => {
      const matchesSearch =
        emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emoji.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        emoji.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [emojis, searchQuery]);

  // Shapes presets using @remotion/shapes
  const shapes: ShapePreset[] = [
    {
      id: 'circle',
      name: 'Circle',
      icon: <CircleIcon className="w-6 h-6 text-pink-500" />,
      defaultProps: {
        radius: 120,
        fill: '#ec4899',
        stroke: '#ffffff',
        strokeWidth: 4,
      },
      code: `import { Circle } from "@remotion/shapes";
import { AbsoluteFill } from "remotion";

export const MyShape = () => {
  const radius = $PROPS.radius || 120;
  const fill = $PROPS.fill || "#ec4899";
  const stroke = $PROPS.stroke || "#ffffff";
  const strokeWidth = $PROPS.strokeWidth || 4;

  return (
    <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Circle
        radius={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </AbsoluteFill>
  );
};`
    },
    {
      id: 'rect',
      name: 'Rectangle',
      icon: <SquareIcon className="w-6 h-6 text-indigo-500" />,
      defaultProps: {
        width: 250,
        height: 250,
        cornerRadius: 16,
        fill: '#6366f1',
        stroke: '#ffffff',
        strokeWidth: 4,
      },
      code: `import { Rect } from "@remotion/shapes";
import { AbsoluteFill } from "remotion";

export const MyShape = () => {
  const width = $PROPS.width || 250;
  const height = $PROPS.height || 250;
  const cornerRadius = $PROPS.cornerRadius || 16;
  const fill = $PROPS.fill || "#6366f1";
  const stroke = $PROPS.stroke || "#ffffff";
  const strokeWidth = $PROPS.strokeWidth || 4;

  return (
    <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Rect
        width={width}
        height={height}
        cornerRadius={cornerRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </AbsoluteFill>
  );
};`
    },
    {
      id: 'triangle',
      name: 'Triangle',
      icon: <TriangleIcon className="w-6 h-6 text-emerald-500" />,
      defaultProps: {
        length: 250,
        direction: 'up',
        fill: '#10b981',
        stroke: '#ffffff',
        strokeWidth: 4,
      },
      code: `import { Triangle } from "@remotion/shapes";
import { AbsoluteFill } from "remotion";

export const MyShape = () => {
  const length = $PROPS.length || 250;
  const direction = $PROPS.direction || "up";
  const fill = $PROPS.fill || "#10b981";
  const stroke = $PROPS.stroke || "#ffffff";
  const strokeWidth = $PROPS.strokeWidth || 4;

  return (
    <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Triangle
        length={length}
        direction={direction}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </AbsoluteFill>
  );
};`
    },
    {
      id: 'star',
      name: 'Star',
      icon: <StarIcon className="w-6 h-6 text-amber-500" />,
      defaultProps: {
        points: 5,
        innerRadius: 60,
        outerRadius: 130,
        fill: '#f59e0b',
        stroke: '#ffffff',
        strokeWidth: 4,
      },
      code: `import { Star } from "@remotion/shapes";
import { AbsoluteFill } from "remotion";

export const MyShape = () => {
  const points = $PROPS.points || 5;
  const innerRadius = $PROPS.innerRadius || 60;
  const outerRadius = $PROPS.outerRadius || 130;
  const fill = $PROPS.fill || "#f59e0b";
  const stroke = $PROPS.stroke || "#ffffff";
  const strokeWidth = $PROPS.strokeWidth || 4;

  return (
    <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Star
        points={points}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </AbsoluteFill>
  );
};`
    },
    {
      id: 'heart',
      name: 'Heart',
      icon: <HeartIcon className="w-6 h-6 text-rose-500" />,
      defaultProps: {
        width: 250,
        height: 250,
        fill: '#f43f5e',
        stroke: '#ffffff',
        strokeWidth: 4,
      },
      code: `import { Heart } from "@remotion/shapes";
import { AbsoluteFill } from "remotion";

export const MyShape = () => {
  const width = $PROPS.width || 250;
  const height = $PROPS.height || 250;
  const fill = $PROPS.fill || "#f43f5e";
  const stroke = $PROPS.stroke || "#ffffff";
  const strokeWidth = $PROPS.strokeWidth || 4;

  return (
    <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Heart
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </AbsoluteFill>
  );
};`
    }
  ];

  const handleAddEmoji = (emojiName: string) => {
    if (!currentProject) {
      alert('Please create a project first');
      return;
    }

    const name = `Emoji: ${emojiName}`;
    const code = `import { AnimatedEmoji } from "@remotion/animated-emoji";
import { AbsoluteFill } from "remotion";

export const MyEmoji = () => {
  const emoji = $PROPS.emoji || "${emojiName}";

  return (
    <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: "80%", height: "80%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <AnimatedEmoji 
          emoji={emoji} 
          calculateSrc={({ emoji, scale, format }) => {
            const extension = format === "hevc" ? "mp4" : "webm";
            return \`https://raw.githubusercontent.com/remotion-dev/animated-emoji/main/public/\${emoji}-\${scale}x.\${extension}\`;
          }}
        />
      </div>
    </AbsoluteFill>
  );
};`;

    addComponentLayer(code, name, 0, { emoji: emojiName });
  };

  const handleAddShape = (preset: ShapePreset) => {
    if (!currentProject) {
      alert('Please create a project first');
      return;
    }
    addComponentLayer(preset.code, preset.name, 0, preset.defaultProps);
  };

  // Convert Unicode codepoint to browser emoji for high-performance preview grid
  const codepointToEmoji = (codepoint: string) => {
    try {
      return String.fromCodePoint(parseInt(codepoint, 16));
    } catch (e) {
      return '😀';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#333]">
        <Sparkles className="w-4 h-4 text-editor-accent" />
        <span className="text-sm font-medium">Stickers & Elements</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333] px-2 bg-[#161616]">
        <button
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'emoji'
              ? 'border-editor-accent text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Emoji</span>
        </button>
        <button
          onClick={() => setActiveTab('shapes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'shapes'
              ? 'border-editor-accent text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Shapes</span>
        </button>
      </div>

      {/* Search Input (For Emoji Tab) */}
      {activeTab === 'emoji' && (
        <div className="p-2.5 border-b border-[#333]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#252525] border border-[#333] rounded text-xs text-white placeholder-gray-500 focus:border-editor-accent focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'emoji' ? (
          filteredEmojis.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs text-gray-400">No emojis found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filteredEmojis.map((emoji) => (
                <button
                  key={emoji.name}
                  onClick={() => handleAddEmoji(emoji.name)}
                  disabled={!currentProject}
                  title={emoji.name}
                  className="group relative flex flex-col items-center justify-center p-2.5 bg-[#252525] border border-[#333] hover:border-editor-accent rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2d2d2d]"
                >
                  <span className="text-2xl select-none mb-1">
                    {codepointToEmoji(emoji.codepoint)}
                  </span>
                  <span className="text-[8px] text-gray-400 truncate w-full text-center">
                    {emoji.name}
                  </span>

                  {/* Add Icon Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {shapes.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleAddShape(preset)}
                disabled={!currentProject}
                className="w-full group relative flex items-center gap-3 p-3 bg-[#252525] border border-[#333] hover:border-editor-accent rounded transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2d2d2d]"
              >
                <div className="w-10 h-10 rounded bg-[#1c1c1c] border border-[#333] flex items-center justify-center flex-shrink-0">
                  {preset.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">{preset.name}</h4>
                  <p className="text-[9px] text-gray-500 uppercase">Remotion Shape</p>
                </div>
                <div className="p-1 rounded bg-[#333] group-hover:bg-editor-accent text-gray-400 group-hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-[#333] flex justify-between items-center text-[10px] text-gray-500 bg-[#161616]">
        <span>
          {activeTab === 'emoji'
            ? `${filteredEmojis.length} emoji(s) available`
            : `${shapes.length} shape presets`}
        </span>
        {!currentProject && <span className="text-editor-accent font-medium">No project open</span>}
      </div>
    </div>
  );
};
