import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Volume2, Sparkles, User, RefreshCw, MessageSquare } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { ActionButton } from '../common/ActionButton';

export const MedTwinChat = () => {
  const { chatMessages, sendChatMessage } = useHospital();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await sendChatMessage(text);
  };

  const handlePresetClick = async (presetText) => {
    await sendChatMessage(presetText);
  };

  const handleSpeakText = (text) => {
    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const presets = [
    "What is our current ICU bed availability?",
    "Show me liquid oxygen burn rate and pressure",
    "Predict surge risk for next 12 hours",
    "List active critical priority alerts"
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <GlassCard className="border-cyan-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Bot className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MedTwin Operational AI Copilot</h2>
              <p className="text-xs text-slate-400">Context-aware assistant inspecting live hospital telemetry & forecasts</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Preset Question Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> {preset}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel p-6 h-[480px] flex flex-col justify-between rounded-2xl border-white/10">
        <div className="overflow-y-auto space-y-4 pr-2">
          {chatMessages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed space-y-2 relative group ${
                    isBot
                      ? 'bg-slate-900/90 border border-cyan-500/20 text-slate-200 shadow-md'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  <div className="flex items-center justify-between pt-1 text-[10px] opacity-60">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isBot && (
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="hover:text-cyan-300 transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {!isBot && (
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls Form */}
        <form onSubmit={handleSend} className="mt-4 flex items-center gap-3 pt-3 border-t border-white/10">
          <input
            type="text"
            placeholder="Ask MedTwin AI about bed allocation, oxygen reserves, or surge forecasts..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 input-glass"
          />
          <ActionButton type="submit" variant="primary" icon={Send}>
            Send
          </ActionButton>
        </form>
      </div>
    </div>
  );
};
