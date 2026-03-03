# 🎬 Remotion Editor

A powerful **Just-in-Time (JIT) Component Studio** for creating dynamic videos with [Remotion](https://www.remotion.dev/). Build video compositions using React components with live compilation, preview, and timeline editing.

![Remotion Editor Screenshot](https://via.placeholder.com/800x450/1a1a2e/ffffff?text=Remotion+Editor)

## ✨ Features

- 🚀 **JIT Compilation** - Write and compile React components dynamically using Babel
- 🎨 **Multiple Templates** - Portrait (9:16), Landscape (16:9), and Square (1:1) formats
- 📐 **Visual Editor** - Edit code with real-time error checking and validation
- 🎬 **Live Preview** - Watch your changes instantly with Remotion Player
- 🕐 **Timeline Control** - Frame-accurate playback and seeking
- 🧩 **Component Parts** - Build complex videos from multiple component layers
- 💾 **Project Management** - Save and switch between multiple projects

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone atau buka folder project
cd remotoon

# Install dependencies
npm install

# Start development server
npm run dev
```

Buka browser dan akses `http://localhost:3000`

## 📝 Usage

### 1. Create a New Project

Klik tombol "Create New Project" atau ikon `+` di panel Projects. Pilih template:
- **Portrait (9:16)** - Untuk Instagram Reels, TikTok, YouTube Shorts
- **Landscape (16:9)** - Untuk video YouTube standard
- **Square (1:1)** - Untuk Instagram Feed

### 2. Edit Components

Setiap project terdiri dari satu atau lebih component parts:

1. Pilih tab **Components** untuk melihat daftar parts
2. Klik component untuk edit
3. Pindah ke tab **Code** untuk mengedit kode React

### 3. Write Dynamic Components

Kode component menggunakan React + Remotion APIs:

```tsx
const { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate } = React;

function Component() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Progress animation (0 to 1)
  const progress = frame / durationInFrames;
  
  // Interpolate values
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = interpolate(frame, [0, 60], [0.8, 1]);
  
  return (
    <AbsoluteFill
      style={{
        background: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1 style={{ 
        fontSize: '72px', 
        color: '#e94560',
        opacity,
        transform: `scale(${scale})`,
      }}>
        Hello World
      </h1>
      <p>Frame: {frame}</p>
    </AbsoluteFill>
  );
}
```

### 4. Available APIs

Dalam component code, Anda memiliki akses ke:

**React**
- `React` - Full React API

**Remotion**
- `useCurrentFrame()` - Get current frame number
- `useVideoConfig()` - Get video config (fps, duration, width, height)
- `AbsoluteFill` - Full-size container component
- `Sequence` - Time-based component wrapper
- `interpolate()` - Value interpolation utility
- `staticFile()` - Reference static files

**Utilities**
- `spring(frame, fps, config)` - Spring physics animation
- `Easing.linear`, `Easing.easeIn`, `Easing.easeOut`, `Easing.easeInOut`, `Easing.bounce`

### 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save code changes |
| `Space` | Play/Pause |
| `← / →` | Seek backward/forward |

## 🏗️ Project Structure

```
remotoon/
├── src/
│   ├── components/
│   │   ├── editor/          # Editor UI components
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── PartsPanel.tsx
│   │   │   ├── ProjectManager.tsx
│   │   │   └── TemplateSelector.tsx
│   │   └── preview/         # Preview components
│   │       └── PreviewPlayer.tsx
│   ├── compositions/        # Remotion compositions
│   │   └── DynamicComposition.tsx
│   ├── lib/
│   │   ├── jitCompiler.ts   # Babel JIT compiler
│   │   └── templates.ts     # Template definitions
│   ├── store/
│   │   └── editorStore.ts   # Zustand state management
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── App.tsx              # Main app component
│   ├── RemotionRoot.tsx     # Remotion context provider
│   └── main.tsx             # Entry point
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## 🛠️ Technologies

- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Remotion](https://www.remotion.dev/) - Video rendering
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Babel Standalone](https://babeljs.io/docs/en/babel-standalone) - JIT compilation
- [Lucide React](https://lucide.dev/) - Icons

## 🎨 Template System

Templates mendefinisikan dimensi dan default code untuk setiap format video:

| Template | Resolution | FPS | Duration | Best For |
|----------|------------|-----|----------|----------|
| Portrait | 1080×1920 | 30 | 150f (5s) | Reels, TikTok |
| Landscape | 1920×1080 | 30 | 150f (5s) | YouTube |
| Square | 1080×1080 | 30 | 150f (5s) | Instagram |

## 🧪 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Credits

Built with ❤️ using [Remotion](https://www.remotion.dev/) by [Jonny Burger](https://twitter.com/JNYBGR) and contributors.
