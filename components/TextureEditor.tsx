import React, { useState } from 'react';
import { CelestialBody } from '../types';
import { generateTexture } from '../services/geminiService';
import { X, Wand2, Loader2, Save } from 'lucide-react';

interface TextureEditorProps {
  body: CelestialBody;
  onClose: () => void;
  onUpdateTexture: (id: string, texture: string) => void;
}

export const TextureEditor: React.FC<TextureEditorProps> = ({ body, onClose, onUpdateTexture }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(body.texture || null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError('');
    
    try {
      // Pass the current preview (if it exists) as the base image for editing
      const result = await generateTexture(prompt, preview || undefined);
      if (result) {
        setPreview(result);
      } else {
        setError('Failed to generate image. Try a different prompt.');
      }
    } catch (e) {
      setError('An error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (preview) {
      onUpdateTexture(body.id, preview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            Edit {body.name} Appearance
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="aspect-square w-full bg-black rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative group">
            {preview ? (
              <img src={preview} alt="Texture preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-full" style={{ backgroundColor: body.color }}></div>
            )}
            {isGenerating && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                </div>
            )}
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">
                Gemini Prompt (Nano Banana)
             </label>
             <div className="flex gap-2">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='e.g., "Make it look like a molten lava world"'
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                >
                    {isGenerating ? '...' : <Wand2 className="w-4 h-4" />}
                </button>
             </div>
             <p className="text-xs text-gray-500 mt-2">
                Uses <strong>gemini-2.5-flash-image</strong> to generate or edit the planet's texture based on your text.
             </p>
             {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
        </div>

        <div className="p-4 bg-gray-950 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white transition">Cancel</button>
            <button 
                onClick={handleSave}
                disabled={!preview}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                Apply Texture
            </button>
        </div>
      </div>
    </div>
  );
};
