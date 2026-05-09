import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Send, 
  Calculator, 
  ChevronRight,
  GraduationCap,
  Sparkles,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOPICS = [
  { id: 'gcf', title: 'GCF Practice', icon: <Calculator className="w-5 h-5"/>, color: 'blue' },
  { id: 'fractions', title: 'Simplest Form', icon: <RefreshCcw className="w-5 h-5"/>, color: 'emerald' },
  { id: 'lcm', title: 'Least Common Multiple', icon: <Sparkles className="w-5 h-5"/>, color: 'purple' },
  { id: 'geometry', title: 'Quadrilaterals', icon: <BookOpen className="w-5 h-5"/>, color: 'orange' }
];

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Welcome to Imperial Academy! I'm your G4 Math Tutor. Which topic shall we master today?" }
  ]);
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = async (text) => {
    if (isMuted) return;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.replace(/[*_#]/g, '') })
      });
      const data = await res.json();
      const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) {
        const audio = new Audio(URL.createObjectURL(pcmToBlob(b64)));
        audio.play();
      }
    } catch (e) { console.error("TTS Error", e); }
  };

  const pcmToBlob = (b64) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const samples = new Int16Array(bytes.buffer);
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buf);
    view.setUint32(0, 0x52494646, false); view.setUint32(4, 36 + samples.length * 2, true);
    view.setUint32(8, 0x57415645, false); view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, 24000, true); view.setUint32(28, 48000, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
    return new Blob([buf], { type: 'audio/wav' });
  };

  const handleSend = async (textOverride = null) => {
    const query = textOverride || input.trim();
    if (!query || isLoading) return;

    const newMsgs = [...messages, { role: 'user', text: query }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having a little trouble thinking. Could you repeat that?";
      setMessages([...newMsgs, { role: 'assistant', text: reply }]);
      speak(reply);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', text: "Connection error. Please check your Vercel settings." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[85vh]">
        
        {/* Sidebar */}
        <aside className="lg:col-span-3 flex flex-col gap-4 h-full">
          <div className="glass-panel rounded-[2rem] p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <GraduationCap className="w-6 h-6"/>
              </div>
              <h2 className="font-bold text-lg text-slate-800 leading-tight">Imperial<br/>Academy</h2>
            </div>
            
            <nav className="flex-grow space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 px-2">Exam Modules</p>
              {TOPICS.map(topic => (
                <button 
                  key={topic.id}
                  onClick={() => handleSend(`Let's talk about ${topic.title}`)}
                  className="w-full group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                >
                  <div className={`p-2 rounded-xl bg-${topic.color}-50 text-${topic.color}-600 group-hover:scale-110 transition-transform`}>
                    {topic.icon}
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{topic.title}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </button>
              ))}
            </nav>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`mt-auto flex items-center justify-center gap-2 p-4 rounded-2xl font-bold transition-colors ${isMuted ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
            >
              {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
              {isMuted ? 'Voice Off' : 'Voice On'}
            </button>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="lg:col-span-9 glass-panel rounded-[2rem] flex flex-col overflow-hidden relative">
          {/* Chat Header */}
          <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-md">👨‍🏫</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Mr. Imperial</h3>
                <p className="text-xs text-green-600 font-medium">Online • Ready to tutor</p>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <footer className="p-6 bg-white/50 border-t border-slate-100">
            <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-inner border border-slate-200">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me to explain GCF of 8 and 12..."
                className="flex-grow bg-transparent px-4 py-2 outline-none text-slate-600 font-medium"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
              >
                <Send size={20}/>
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
