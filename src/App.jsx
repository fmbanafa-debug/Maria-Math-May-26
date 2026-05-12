import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, Volume2, VolumeX, Send, 
  Calculator, ChevronRight, GraduationCap, 
  Sparkles, RefreshCcw, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOPICS = [
  { id: 'gcf', title: 'GCF Practice', icon: <Calculator size={20}/>, color: 'blue', prompt: "Let's practice Greatest Common Factor. Can you give me a GCF problem from the worksheet?" },
  { id: 'fractions', title: 'Simplest Form', icon: <RefreshCcw size={20}/>, color: 'emerald', prompt: "I want to learn about simplifying fractions. How do I use GCF to simplify a fraction like 12/36?" },
  { id: 'lcm', title: 'LCM Practice', icon: <Sparkles size={20}/>, color: 'purple', prompt: "Help me find the Least Common Multiple (LCM) for numbers like 12 and 8." },
  { id: 'geometry', title: 'Quadrilaterals', icon: <Layout size={20}/>, color: 'orange', prompt: "Let's review shapes! What are the attributes of a trapezoid or a rhombus?" }
];

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm Mr. Imperial, your Grade 4 Math Tutor. I'm ready to help you prepare for your Second Semester Exam. Which topic should we explore?" }
  ]);
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const pcmToWav = (b64) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const samples = new Int16Array(bytes.buffer);
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buf);
    view.setUint32(0, 0x52494646, false); view.setUint32(4, 36 + samples.length * 2, true);
    view.setUint32(8, 0x57415645, false); view.setUint32(12, 0x666d7420, false);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, 24000, true); view.setUint32(28, 48000, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
    return new Blob([buf], { type: 'audio/wav' });
  };

  const speak = async (text) => {
    if (isMuted) return;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.replace(/[*_#$]/g, '') })
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(URL.createObjectURL(pcmToWav(data.audio)));
        audio.play();
      }
    } catch (e) { console.error("TTS Failed", e); }
  };

  const handleSend = async (overrideText = null) => {
    const text = overrideText || input.trim();
    if (!text || isLoading) return;

    const newMsgs = [...messages, { role: 'user', text }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      const reply = data.text || "I'm having a little trouble thinking. Could you try asking again?";
      setMessages([...newMsgs, { role: 'assistant', text: reply }]);
      speak(reply);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', text: "Oh no! I lost connection to the school server. Please check if your API key is set correctly in Vercel!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-quicksand">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[90vh]">
        
        {/* Sidebar */}
        <aside className="lg:col-span-3 h-full flex flex-col gap-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 flex flex-col h-full shadow-2xl">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <GraduationCap size={28}/>
              </div>
              <h2 className="font-bold text-xl text-slate-800">Imperial<br/><span className="text-blue-600 text-xs uppercase tracking-widest">Academy</span></h2>
            </div>
            
            <nav className="flex-grow space-y-3">
              {TOPICS.map(topic => (
                <button 
                  key={topic.id}
                  onClick={() => handleSend(topic.prompt)}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                >
                  <div className={`p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform`}>
                    {topic.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-600">{topic.title}</span>
                  <ChevronRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </button>
              ))}
            </nav>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`mt-auto flex items-center justify-center gap-2 p-5 rounded-2xl font-bold transition-all shadow-lg ${isMuted ? 'bg-red-50 text-red-600 shadow-red-100' : 'bg-blue-600 text-white shadow-blue-200'}`}
            >
              {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
              {isMuted ? 'Voice Off' : 'Voice On'}
            </button>
          </div>
        </aside>

        {/* Chat UI */}
        <main className="lg:col-span-9 bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
          <header className="p-6 border-b border-slate-100 flex items-center bg-white/50">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg mr-4 ring-4 ring-blue-50">👨‍🏫</div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Mr. Imperial</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-[10px] text-green-600 font-black uppercase tracking-tighter">Math Specialist</span>
              </div>
            </div>
          </header>

          <div className="flex-grow overflow-y-auto p-8 space-y-6 scrollbar-hide bg-slate-50/30">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] p-5 rounded-[2rem] shadow-sm text-[15px] leading-relaxed font-medium ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none flex gap-1.5 shadow-md">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </AnimatePresence>
            <div ref={scrollRef} />
          </div>

          <footer className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-3 bg-slate-50 p-2.5 rounded-[1.5rem] border border-slate-200 focus-within:ring-4 ring-blue-100 transition-all">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a math question..."
                className="flex-grow bg-transparent px-4 py-2 outline-none text-slate-600 font-bold placeholder:text-slate-400"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading}
                className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition shadow-xl disabled:opacity-50"
              >
                <Send size={22}/>
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
