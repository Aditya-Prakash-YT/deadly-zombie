import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scene3D } from './components/Scene3D';
import { CelestialBody, BodyType, ChatMessage, Vector3 } from './types';
import { INITIAL_BODIES } from './constants';
import { TextureEditor } from './components/TextureEditor';
import { createChatSession, searchFact, getFastResponse } from './services/geminiService';
import { 
    MessageSquare, 
    Search, 
    Play, 
    Pause, 
    PlusCircle, 
    Trash2, 
    Globe2, 
    Sparkles,
    Menu,
    X,
    Send,
    AlertTriangle
} from 'lucide-react';
import { Chat } from '@google/genai';

// Simple Modal Component
const DeleteDialog = ({ body, onConfirm, onCancel }: { body: CelestialBody, onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100">
            <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-xl font-bold text-white">Destroy Celestial Body?</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-white">{body.name}</span> from the simulation? 
                This action involves physics calculations that cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Destroy
                </button>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
  // --- State ---
  const [bodies, setBodies] = useState<CelestialBody[]>(INITIAL_BODIES);
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(null);
  const [paused, setPaused] = useState(false);
  const [gravityViz, setGravityViz] = useState(true);
  const [showTextureEditor, setShowTextureEditor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Dialog State
  const [bodyToDelete, setBodyToDelete] = useState<CelestialBody | null>(null);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: '1', role: 'model', content: 'Welcome, explorer! I am your Solar Assistant. Ask me anything about the cosmos or the simulation.', timestamp: Date.now() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{text: string, sources: any[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'CHAT' | 'SEARCH'>('CHAT');

  // --- Handlers ---

  const handleSpawn = () => {
      const newBody: CelestialBody = {
          id: `asteroid_${Date.now()}`,
          name: `Asteroid ${bodies.length}`,
          type: BodyType.ASTEROID,
          mass: 0.5 + Math.random(),
          radius: 0.5,
          color: '#888',
          // Random pos near earth
          position: { x: 20 + (Math.random() - 0.5) * 10, y: 0, z: (Math.random() - 0.5) * 10 },
          velocity: { x: (Math.random() - 0.5), y: 0, z: (Math.random() - 0.5) },
          isLocked: false,
          description: 'A newly discovered asteroid drifting through space.'
      };
      setBodies([...bodies, newBody]);
      
      // Get a funny name from Fast AI
      getFastResponse("Give me a short, funny name for a newly discovered asteroid.").then(name => {
          if (name) {
              setBodies(prev => prev.map(b => b.id === newBody.id ? { ...b, name: name.trim() } : b));
          }
      });
  };

  const handleRemove = () => {
      if (bodyToDelete) {
          setBodies(bodies.filter(b => b.id !== bodyToDelete.id));
          if (selectedBody?.id === bodyToDelete.id) setSelectedBody(null);
          setBodyToDelete(null);
      }
  };

  const handleTextureUpdate = (id: string, texture: string) => {
      setBodies(bodies.map(b => b.id === id ? { ...b, texture } : b));
  };

  // --- AI Chat Logic ---

  useEffect(() => {
    // Initialize Chat Session
    try {
        chatSessionRef.current = createChatSession();
    } catch (e) {
        console.error("Failed to init chat", e);
    }
  }, []);

  const handleSendMessage = async () => {
      if (!chatInput.trim()) return;
      
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: Date.now() };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput('');
      setIsChatLoading(true);

      try {
          if (chatSessionRef.current) {
              const result = await chatSessionRef.current.sendMessage({ message: userMsg.content });
              const modelMsg: ChatMessage = { 
                  id: (Date.now() + 1).toString(), 
                  role: 'model', 
                  content: result.text || "I'm thinking...", 
                  timestamp: Date.now() 
              };
              setChatMessages(prev => [...prev, modelMsg]);
          }
      } catch (e) {
          const errorMsg: ChatMessage = { id: Date.now().toString(), role: 'model', content: "Error connecting to Gemini.", isError: true, timestamp: Date.now() };
          setChatMessages(prev => [...prev, errorMsg]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const handleSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      setSearchResults(null);
      try {
          const result = await searchFact(searchQuery);
          setSearchResults(result);
      } catch (e) {
          setSearchResults({ text: "Failed to fetch information.", sources: [] });
      } finally {
          setIsSearching(false);
      }
  };

  // --- Render ---

  return (
    <div className="w-screen h-screen bg-black text-white font-sans flex overflow-hidden">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
          <Scene3D 
            bodies={bodies} 
            setBodies={setBodies} 
            paused={paused} 
            gravityViz={gravityViz}
            onBodyClick={setSelectedBody}
            selectedBody={selectedBody}
          />
      </div>

      {/* Top Overlay UI (Controls) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 flex gap-2 pointer-events-auto">
             <button onClick={() => setPaused(!paused)} className="p-2 hover:bg-white/10 rounded-lg transition" title={paused ? "Resume" : "Pause"}>
                 {paused ? <Play className="w-6 h-6 text-green-400" /> : <Pause className="w-6 h-6 text-yellow-400" />}
             </button>
             <div className="w-px bg-white/10 mx-1"></div>
             <button onClick={handleSpawn} className="p-2 hover:bg-white/10 rounded-lg transition" title="Spawn Random Mass">
                 <PlusCircle className="w-6 h-6 text-blue-400" />
             </button>
             <button onClick={() => setGravityViz(!gravityViz)} className="p-2 hover:bg-white/10 rounded-lg transition" title="Toggle Gravity Grid">
                 <Globe2 className={`w-6 h-6 ${gravityViz ? 'text-purple-400' : 'text-gray-400'}`} />
             </button>
          </div>

          <div className="pointer-events-auto">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 hover:bg-white/10 transition"
              >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
          </div>
      </div>

      {/* Selected Body Info Panel */}
      {selectedBody && (
          <div className="absolute bottom-8 left-8 z-20 w-80 bg-black/80 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h2 className="text-2xl font-bold text-white">{selectedBody.name}</h2>
                      <p className="text-sm text-gray-400">{selectedBody.type}</p>
                  </div>
                  <button onClick={() => setSelectedBody(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="space-y-3 mb-6">
                  {selectedBody.description && (
                      <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                          {selectedBody.description}
                      </p>
                  )}
                  <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-500">Mass</span>
                      <span className="font-mono text-blue-300">{selectedBody.mass.toFixed(2)} M</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Velocity</span>
                      <span className="font-mono text-blue-300">{Math.sqrt(selectedBody.velocity.x**2 + selectedBody.velocity.z**2).toFixed(2)} km/s</span>
                  </div>
              </div>

              <div className="flex gap-2">
                  <button 
                    onClick={() => setShowTextureEditor(true)}
                    className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-200 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                  >
                      <Sparkles className="w-4 h-4" />
                      Edit Texture
                  </button>
                  <button 
                    onClick={() => setBodyToDelete(selectedBody)}
                    className="p-2 rounded-lg transition border flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border-red-500/50 text-red-200"
                    title="Destroy"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>
              </div>
          </div>
      )}

      {/* Right Sidebar (Chat & Search) */}
      <div 
        className={`absolute top-0 right-0 bottom-0 w-96 bg-gray-950/90 backdrop-blur-xl border-l border-white/10 z-10 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
          <div className="h-16 border-b border-white/10 flex items-center px-4 gap-4 mt-16">
              <button 
                onClick={() => setSearchMode('CHAT')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex justify-center items-center gap-2 ${searchMode === 'CHAT' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <MessageSquare className="w-4 h-4" /> Chat
              </button>
              <button 
                onClick={() => setSearchMode('SEARCH')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex justify-center items-center gap-2 ${searchMode === 'SEARCH' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  <Search className="w-4 h-4" /> Grounding
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {searchMode === 'CHAT' ? (
                  // Chat History
                  <>
                    {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start">
                             <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700 flex gap-2 items-center">
                                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                             </div>
                        </div>
                    )}
                  </>
              ) : (
                  // Search Interface
                  <div className="space-y-6">
                      <div>
                          <p className="text-gray-400 text-sm mb-2">Search the real universe (Google Grounding)</p>
                          <div className="relative">
                            <input 
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-3 pr-10 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="e.g. Mass of Jupiter"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <button 
                                onClick={handleSearch}
                                className="absolute right-2 top-2 text-gray-400 hover:text-white"
                            >
                                {isSearching ? <span className="animate-spin text-lg">⟳</span> : <Search className="w-4 h-4"/>}
                            </button>
                          </div>
                      </div>

                      {searchResults && (
                          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                              <p className="text-sm text-gray-200 leading-relaxed">{searchResults.text}</p>
                              {searchResults.sources.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-800">
                                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Sources</p>
                                      <div className="space-y-2">
                                          {searchResults.sources.map((src, idx) => (
                                              <a key={idx} href={src.uri} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 hover:underline truncate">
                                                  {src.title}
                                              </a>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>

          {searchMode === 'CHAT' && (
              <div className="p-4 border-t border-white/10 bg-gray-950">
                  <div className="relative">
                      <input 
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Ask Gemini..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition disabled:opacity-50"
                      >
                          <Send className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* Modals */}
      {showTextureEditor && selectedBody && (
          <TextureEditor 
            body={selectedBody}
            allBodies={bodies} 
            onClose={() => setShowTextureEditor(false)} 
            onUpdateTexture={handleTextureUpdate} 
          />
      )}

      {bodyToDelete && (
          <DeleteDialog 
             body={bodyToDelete} 
             onConfirm={handleRemove} 
             onCancel={() => setBodyToDelete(null)} 
          />
      )}
    </div>
  );
};

export default App;