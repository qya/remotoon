import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { X } from 'lucide-react';

interface PreviewSettingsModalProps {
    onClose: () => void;
}

export const PreviewSettingsModal: React.FC<PreviewSettingsModalProps> = ({ onClose }) => {
    const currentProject = useEditorStore((state) => state.currentProject);
    const updateProjectTemplate = useEditorStore((state) => state.updateProjectTemplate);

    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [fps, setFps] = useState(30);
    const [durationInSeconds, setDurationInSeconds] = useState(5);

    useEffect(() => {
        if (currentProject) {
            setWidth(currentProject.template.width);
            setHeight(currentProject.template.height);
            setFps(currentProject.template.fps);
            setDurationInSeconds(currentProject.template.durationInFrames / currentProject.template.fps);
        }
    }, [currentProject]);

    const handleSave = () => {
        if (!currentProject) return;

        updateProjectTemplate({
            width,
            height,
            fps,
            durationInFrames: Math.round(durationInSeconds * fps),
        });
        onClose();
    };

    if (!currentProject) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] shadow-xl w-[400px] overflow-hidden text-white">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#333]">
                    <h2 className="text-sm font-semibold">Project Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#333] rounded transition-colors text-gray-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-gray-400 text-xs text-xs font-semibold">Width</label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => setWidth(Number(e.target.value))}
                                className="w-full bg-[#0f0f0f] border border-[#333] rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                min="100"
                                max="3840"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-gray-400 text-xs font-semibold">Height</label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(Number(e.target.value))}
                                className="w-full bg-[#0f0f0f] border border-[#333] rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                min="100"
                                max="2160"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-400 text-xs font-semibold">Framerate (FPS)</label>
                        <select
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            className="w-full bg-[#0f0f0f] border border-[#333] rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="24">24</option>
                            <option value="30">30</option>
                            <option value="60">60</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-400 text-xs font-semibold">Duration (Seconds)</label>
                        <input
                            type="number"
                            value={durationInSeconds}
                            onChange={(e) => setDurationInSeconds(Number(e.target.value))}
                            className="w-full bg-[#0f0f0f] border border-[#333] rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            min="1"
                            max="3600"
                            step="0.1"
                        />
                        <p className="text-[#888] text-xs">
                            Total frames: {Math.round(durationInSeconds * fps)}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#333] flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded text-sm hover:bg-[#333] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
