import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Volume2, Sparkles, User, RefreshCw, MessageSquare, Zap } from 'lucide-react';
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
    <div className="space-y-6 lg:space-y-8 max-w-5xl lg:max-w-6xl mx-auto w-full pb-16">
      {/* ── Top Header Banner (Spacious & Clean Light Theme) ── */}
      <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-100 text-cyan-800 border border-cyan-200 shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                  MedTwin Operational AI Copilot
                </h1>
                <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Context-aware clinical and operations assistant inspecting live hospital telemetry, beds, and forecasts in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Prompt Chips (Spacious & Interactive) ── */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
          Suggested Queries & Live Diagnostics:
        </span>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-cyan-50/80 border border-slate-200 hover:border-cyan-300 text-slate-700 hover:text-cyan-900 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>{preset}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat Messages Container (Tall & Spacious) ── */}
      <div className="p-6 sm:p-8 h-[600px] flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div className="overflow-y-auto space-y-6 pr-2">
          {chatMessages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3.5 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200 shrink-0 mt-1">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`p-5 rounded-2xl max-w-2xl text-sm leading-relaxed space-y-2 relative shadow-xs ${
                    isBot
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-cyan-700 text-white font-medium shadow-md shadow-cyan-700/20'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  <div className="flex items-center justify-between pt-2 text-xs opacity-70 border-t border-slate-200/50">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isBot && (
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="hover:text-cyan-700 transition-colors p-1 rounded-md hover:bg-slate-200/60 cursor-pointer"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!isBot && (
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0 mt-1">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls Form */}
        <form onSubmit={handleSend} className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-200">
          <input
            type="text"
            placeholder="Ask MedTwin AI about bed allocation, oxygen reserves, staff ratios, or surge forecasts..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-600 focus:bg-white transition-all shadow-inner"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-2xl shadow-md shadow-cyan-700/20 transition-all cursor-pointer text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
