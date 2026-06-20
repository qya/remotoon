import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Layers, 
  Zap, 
  ArrowRight,
  Play,
  Github,
  Twitter,
  Film,
  Palette,
  Wand2
} from 'lucide-react';
import { MetaTags } from '../components/MetaTags';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <MetaTags 
        title="Home" 
        description="Remotoon is a powerful yet intuitive video editor. Create professional content with layers, effects, and animations — all in your browser."
        keywords="video editor, remotion, react, jit animation, video template"
      />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-[#333]/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Remotoon Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-white">Remotoon</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
                How it Works
              </a>
              <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-full border border-[#333] mb-8">
            <Sparkles className="w-4 h-4 text-[#00a8e8]" />
            <span className="text-sm text-gray-300">Create stunning videos in minutes</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Video editing made
            <span className="text-[#00a8e8]"> simple</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Remotoon is a powerful yet intuitive video editor. Create professional content 
            with layers, effects, and animations — all in your browser.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2 px-8 py-4 bg-[#00a8e8] hover:bg-[#0086b6] rounded-xl text-white font-semibold transition-all hover:scale-105"
            >
              <Play className="w-5 h-5" />
              Start Creating
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="px-8 py-4 bg-[#1a1a1a] hover:bg-[#252525] rounded-xl text-white font-semibold border border-[#333] transition-all"
            >
              View Projects
            </button>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent z-10" />
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] p-2 shadow-2xl">
              <div className="bg-[#0f0f0f] rounded-xl overflow-hidden aspect-video relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]" />
                
                {/* Editor UI Mockup */}
                <div className="absolute inset-0 flex">
                  {/* Left Sidebar */}
                  <div className="w-14 bg-[#1a1a1a] border-r border-[#333] flex flex-col items-center py-4 gap-3">
                    <div className="w-8 h-8 bg-[#252525] rounded-lg" />
                    <div className="w-8 h-8 bg-[#252525] rounded-lg" />
                    <div className="w-8 h-8 bg-[#00a8e8]/20 rounded-lg" />
                    <div className="w-8 h-8 bg-[#252525] rounded-lg" />
                  </div>
                  
                  {/* Main Area */}
                  <div className="flex-1 flex flex-col">
                    {/* Preview */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-2/3 aspect-video bg-black rounded-lg flex items-center justify-center">
                        <Film className="w-16 h-16 text-[#333]" />
                      </div>
                    </div>
                    
                    {/* Timeline */}
                    <div className="h-24 bg-[#1a1a1a] border-t border-[#333]">
                      <div className="flex items-center gap-2 px-4 py-2">
                        <div className="flex-1 h-8 bg-[#00a8e8]/30 rounded" />
                        <div className="flex-1 h-8 bg-[#10b981]/30 rounded" />
                        <div className="flex-1 h-8 bg-[#f59e0b]/30 rounded" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Sidebar */}
                  <div className="w-56 bg-[#1a1a1a] border-l border-[#333] p-4">
                    <div className="w-full h-4 bg-[#252525] rounded mb-3" />
                    <div className="w-2/3 h-4 bg-[#252525] rounded mb-6" />
                    <div className="w-full h-20 bg-[#252525] rounded mb-3" />
                    <div className="w-full h-20 bg-[#252525] rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-[#333]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to create
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional video editing features in a simple, intuitive interface
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-[#444] transition-colors">
              <div className="w-12 h-12 bg-[#00a8e8]/10 rounded-xl flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-[#00a8e8]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Layer System</h3>
              <p className="text-gray-400 text-sm">
                Stack videos, images, text, and effects with full control over position, timing, and blending.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-[#444] transition-colors">
              <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center mb-4">
                <Film className="w-6 h-6 text-[#10b981]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Timeline Editing</h3>
              <p className="text-gray-400 text-sm">
                Trim, split, and arrange clips with precision. Drag, resize, and cut with ease.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-[#444] transition-colors">
              <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Effects & Filters</h3>
              <p className="text-gray-400 text-sm">
                Apply transitions, filters, and animations to bring your vision to life.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-[#444] transition-colors">
              <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast Rendering</h3>
              <p className="text-gray-400 text-sm">
                Powered by Remotion for efficient, high-quality video rendering in the browser.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-[#444] transition-colors">
              <div className="w-12 h-12 bg-[#ec4899]/10 rounded-xl flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-[#ec4899]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Components</h3>
              <p className="text-gray-400 text-sm">
                Pre-built animated components and templates to jumpstart your projects.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] hover:border-[#444] transition-colors">
              <div className="w-12 h-12 bg-[#ef4444]/10 rounded-xl flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Preview</h3>
              <p className="text-gray-400 text-sm">
                See your changes instantly with smooth, real-time playback preview.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[#333]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Create stunning videos in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00a8e8] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create Project</h3>
              <p className="text-gray-400 text-sm">
                Choose from templates or start from scratch with your preferred aspect ratio.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#10b981] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Content</h3>
              <p className="text-gray-400 text-sm">
                Import media, arrange layers on the timeline, and apply effects.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#f59e0b] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Export & Share</h3>
              <p className="text-gray-400 text-sm">
                Render your video in high quality and share it with the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-[#333]/50">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl p-12 border border-[#333]">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start creating?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join thousands of creators using Remotoon to bring their video ideas to life.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#00a8e8] hover:bg-[#0086b6] rounded-xl text-white font-semibold transition-all hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#333]/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Remotoon Logo" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold text-white">Remotoon</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>

            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-[#333]/50 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Remotoon. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
