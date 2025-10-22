import { useEffect, useRef, useState } from 'react';

function App() {
  const [messages, setMessages] = useState<{ id: string; user: string; text: string; time: string }[]>([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ambil username dari localStorage saat pertama kali
  useEffect(() => {
    const saved = localStorage.getItem('chat-username');
    if (saved) {
      setUsername(saved);
    }
  }, []);

  // Setup WebSocket saat username diisi
  useEffect(() => {
    if (!username.trim()) return;

    localStorage.setItem('chat-username', username);

    ws.current = new WebSocket('ws://192.168.200.7:8080/ws');

    ws.current.onopen = () => {
      console.log('Connected to Go WebSocket server');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [...prev, { ...data, time: now, id: Math.random().toString() }]);
      } catch (e) {
        console.warn('Invalid message format:', event.data);
      }
    };

    ws.current.onerror = (error) => {
      if (ws.current?.readyState === WebSocket.CLOSED || ws.current?.readyState === WebSocket.CLOSING) {
        console.log('WebSocket: koneksi ditutup (normal saat dev reload)');
        return;
      }
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, [username]);

  // Auto-scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetUsername = () => {
    if (username.trim()) {
      // WebSocket akan di-setup otomatis via useEffect di atas
    }
  };

  const sendMessage = () => {
    if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const payload = {
        user: username,
        text: input,
      };
      ws.current.send(JSON.stringify(payload));
      setInput('');
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">💬 Live Chat</h1>
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan nama kamu..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
            />
            <button
              onClick={handleSetUsername}
              disabled={!username.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Masuk ke Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-semibold">Live Chat • {username}</h1>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.user === username ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                msg.user === username
                  ? 'bg-indigo-500 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
              }`}
            >
              <div className="text-xs opacity-80 mb-1">
                {msg.user} • {msg.time}
              </div>
              <div>{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-300 bg-white p-3 max-w-4xl mx-auto w-full">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || ws.current?.readyState !== WebSocket.OPEN}
            className="bg-indigo-600 text-white px-6 rounded-full font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;