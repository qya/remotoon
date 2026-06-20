import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FolderOpen, Box, Github } from 'lucide-react';

const navItems = [
    { to: '/projects', icon: FolderOpen, label: 'Projects' },
    { to: '/components', icon: Box, label: 'Components' },
];

export const AppSidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="w-56 flex-shrink-0 h-screen bg-[#111] border-r border-[#2a2a2a] flex flex-col">
            {/* Brand */}
            <div className="px-5 py-6 flex items-center gap-3 border-b border-[#2a2a2a]">
                <img src="/logo.svg" alt="Remotoon Logo" className="w-9 h-9 object-contain" />
                <div>
                    <span className="text-white font-bold text-base tracking-tight">Remotoon</span>
                    <p className="text-[10px] text-gray-500 leading-none mt-0.5">Programatic Video Editor</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => {
                    const isActive =
                        to === '/projects'
                            ? location.pathname === '/projects' || location.pathname === '/'
                            : location.pathname.startsWith(to);

                    return (
                        <Link
                            key={to}
                            to={to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${isActive
                                ? 'bg-[#00a8e8]/15 text-[#00a8e8] shadow-sm'
                                : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-gray-100'
                                }`}
                        >
                            <Icon
                                className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#00a8e8]' : 'text-gray-500 group-hover:text-gray-300'
                                    }`}
                            />
                            {label}
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a8e8]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#2a2a2a] flex items-center justify-between text-[10px] text-gray-600">
                <span>Remotoon 0.1.0</span>
                <div className="flex items-center gap-2">
                    <a
                        href="http://github.com/qya/remotoon"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-400 transition-colors flex items-center"
                    >
                        <Github className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </aside>
    );
};
