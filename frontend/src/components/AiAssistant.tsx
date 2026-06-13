import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles } from 'lucide-react';
import { apiRequest } from '../services/api';

interface Message {
  sender: 'USER' | 'AI';
  text: string;
}

interface AiAssistantProps {
  role?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ role, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Dynamic greetings and prompts depending on user role
  const getRoleAisettings = () => {
    switch (role) {
      case 'STUDENT':
        return {
          greeting: "Hello! I am your student assistant. Ask me about your room details, fee dues, leave requests, or today's food menu.",
          prompts: ["Show my fee dues", "Today's food menu", "Where is my room?", "Track my complaints"]
        };
      case 'WARDEN':
        return {
          greeting: "Welcome Warden! I can assist you with building occupancy rates, pending outing approvals, or maintenance ticket summaries.",
          prompts: ["Show occupancy", "Show leave approvals", "Track open tickets"]
        };
      case 'GUARD':
        return {
          greeting: "Security Guard Assistant. Ask about shift activity logs, visitor details, or student entry rules.",
          prompts: ["Awaiting outings list", "Visitor status report"]
        };
      case 'PARENT':
        return {
          greeting: "Parent Portal Assistant. Track your student's leave history, billing invoices, or room index.",
          prompts: ["Track child outings", "Show child fee bills"]
        };
      case 'STAFF':
        return {
          greeting: "Maintenance Staff Assistant. Review your active repair tickets and completion logs.",
          prompts: ["List my open jobs", "Escalated complaints"]
        };
      case 'ADMIN':
        return {
          greeting: "Hostel Administrator Assistant. Generate billing dues, configure rooms, or review analytical predictions.",
          prompts: ["Generate predictive report", "Show occupancy rates"]
        };
      default:
        return {
          greeting: "Hello! I am your AI Hostel Assistant. Ask me anything about the hostel ecosystem.",
          prompts: ["Show today's menu", "System health report"]
        };
    }
  };

  const { greeting, prompts } = getRoleAisettings();

  // Reset dialogue messages when role is loaded or changed
  useEffect(() => {
    setMessages([
      { sender: 'AI', text: greeting }
    ]);
  }, [role, greeting]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');
    setMessages(prev => [...prev, { sender: 'USER', text: messageText }]);
    setSending(true);

    try {
      const data = await apiRequest('/api/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({ message: messageText }),
      });
      setMessages(prev => [...prev, { sender: 'AI', text: data.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'AI', text: 'Sorry, I encountered an error: ' + err.message }]);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-[400px] h-[550px] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform scale-100">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-slate-200 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <div className="bg-white/10 p-2 rounded-xl">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center">
              Hostel AI Assistant <Sparkles size={12} className="ml-1.5 text-indigo-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest">{role} Portal</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
              m.sender === 'USER'
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-400 rounded-2xl rounded-tl-none p-3 border border-slate-200 shadow-sm text-xs flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div className="px-4 py-2 bg-slate-100/40 flex flex-wrap gap-1.5 border-t border-slate-200/60">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-500/40 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-500/60"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
export default AiAssistant;
