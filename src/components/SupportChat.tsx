import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const PAKISTANI_NAMES = ['Ali', 'Fatima', 'Ahmed', 'Zainab', 'Bilal', 'Ayesha', 'Hassan', 'Sana', 'Usman', 'Maria'];

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [botName, setBotName] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'السلام علیکم! میں آپ کی کیا مدد کر سکتا ہوں؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBotName(PAKISTANI_NAMES[Math.floor(Math.random() * PAKISTANI_NAMES.length)]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are ${botName}, a helpful support assistant for the "Watch & Earn" app. Always reply in Urdu. Answer the user's question: ${userMessage}`,
      });
      setMessages(prev => [...prev, { role: 'bot', text: response.text || 'معذرت، میں سمجھ نہیں سکا۔' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'معذرت، کچھ غلط ہو گیا۔' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all z-50"
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col h-[500px]">
            <div className="p-4 border-b flex justify-between items-center bg-emerald-600 text-white rounded-t-2xl">
              <h3 className="font-bold">{botName}</h3>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-emerald-100 ml-auto' : 'bg-stone-100'}`}>
                  {msg.text}
                </div>
              ))}
              {loading && <Loader2 className="animate-spin text-emerald-600" />}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 border rounded-full px-4 py-2"
                placeholder="کچھ پوچھیں..."
              />
              <button onClick={sendMessage} className="bg-emerald-600 text-white p-2 rounded-full"><Send size={20} /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
