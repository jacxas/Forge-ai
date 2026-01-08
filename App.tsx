
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { BotCreator } from './components/BotCreator';
import { DEFAULT_BOTS } from './constants';
import { Bot, ChatSession, Message, BotFormData, ModelType } from './types';
import { streamResponse, generateImage } from './services/geminiService';
import { Menu } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>(() => {
    const saved = localStorage.getItem('poe_clone_bots');
    return saved ? JSON.parse(saved) : DEFAULT_BOTS;
  });

  const [activeBotId, setActiveBotId] = useState<string>(bots[0].id);
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('poe_clone_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCreatorOpen, setCreatorOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    localStorage.setItem('poe_clone_bots', JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
    localStorage.setItem('poe_clone_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const activeBot = bots.find(b => b.id === activeBotId) || bots[0];
  const activeSession = sessions.find(s => s.botId === activeBotId);
  const activeMessages = activeSession?.messages || [];

  const handleBotSelect = (botId: string) => {
    setActiveBotId(botId);
  };

  const handleCreateBot = (data: BotFormData) => {
    const newBot: Bot = {
      id: `bot-${generateId()}`,
      ...data,
      avatarColor: data.avatarColor || 'bg-indigo-500',
      icon: data.icon || 'Bot',
      isDefault: false
    };
    setBots([...bots, newBot]);
    setCreatorOpen(false);
    setActiveBotId(newBot.id);
  };

  const handleClearHistory = () => {
    setSessions(prev => prev.filter(s => s.botId !== activeBotId));
  };

  const handleSendMessage = async (text: string, image?: { data: string; mimeType: string }) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text || (image ? "Analiza esta imagen." : ""),
      timestamp: Date.now(),
      botId: activeBotId,
      attachedImage: image
    };

    updateSession(activeBotId, userMessage);
    await processModelResponse(activeBotId, text, image, [...activeMessages, userMessage]);
  };

  const handleRegenerate = async () => {
    if (activeMessages.length < 2) return;
    
    // Find last user message
    const lastUserMsgIndex = [...activeMessages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex === -1) return;
    
    const realIndex = activeMessages.length - 1 - lastUserMsgIndex;
    const lastUserMsg = activeMessages[realIndex];
    
    // Remove all messages after the last user message
    const newMessages = activeMessages.slice(0, realIndex + 1);
    setSessions(prev => prev.map(s => s.botId === activeBotId ? { ...s, messages: newMessages } : s));
    
    await processModelResponse(activeBotId, lastUserMsg.content, lastUserMsg.attachedImage, newMessages);
  };

  const processModelResponse = async (
    botId: string, 
    text: string, 
    image: { data: string; mimeType: string } | undefined,
    currentHistory: Message[]
  ) => {
    setIsStreaming(true);
    const bot = bots.find(b => b.id === botId) || bots[0];

    try {
      if (bot.model === ModelType.IMAGE) {
        const imageUrl = await generateImage(text);
        const imageMessage: Message = {
          id: generateId(),
          role: 'model',
          content: `Imagen generada para: "${text}"`,
          isImage: true,
          imageUrl: imageUrl,
          timestamp: Date.now(),
          botId: botId
        };
        updateSession(botId, imageMessage);
      } else {
        const modelMessageId = generateId();
        const modelMessage: Message = {
          id: modelMessageId,
          role: 'model',
          content: '',
          timestamp: Date.now(),
          botId: botId
        };
        
        updateSession(botId, modelMessage);

        const historyContext = currentHistory.slice(0, -1).slice(-8); 

        await streamResponse(
          bot.model,
          bot.systemInstruction,
          historyContext,
          text,
          bot.useSearch || false,
          image || null,
          (chunk) => {
            setSessions(prev => {
              const newSessions = [...prev];
              const sessionIndex = newSessions.findIndex(s => s.botId === botId);
              if (sessionIndex > -1) {
                const msgs = [...newSessions[sessionIndex].messages];
                const msgIndex = msgs.findIndex(m => m.id === modelMessageId);
                if (msgIndex > -1) {
                  msgs[msgIndex] = { ...msgs[msgIndex], content: msgs[msgIndex].content + chunk };
                  newSessions[sessionIndex].messages = msgs;
                }
              }
              return newSessions;
            });
          },
          (groundingChunks) => {
             setSessions(prev => {
                const newSessions = [...prev];
                const sessionIndex = newSessions.findIndex(s => s.botId === botId);
                if (sessionIndex > -1) {
                  const msgs = [...newSessions[sessionIndex].messages];
                  const msgIndex = msgs.findIndex(m => m.id === modelMessageId);
                  if (msgIndex > -1) {
                    msgs[msgIndex] = { ...msgs[msgIndex], groundingChunks: groundingChunks };
                    newSessions[sessionIndex].messages = msgs;
                  }
                }
                return newSessions;
              });
          }
        );
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'model',
        content: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: Date.now(),
        botId: botId
      };
      updateSession(botId, errorMsg);
    } finally {
      setIsStreaming(false);
    }
  };

  const updateSession = (botId: string, message: Message) => {
    setSessions(prev => {
      const existingSessionIndex = prev.findIndex(s => s.botId === botId);
      if (existingSessionIndex > -1) {
        const newSessions = [...prev];
        newSessions[existingSessionIndex] = {
          ...newSessions[existingSessionIndex],
          messages: [...newSessions[existingSessionIndex].messages, message]
        };
        return newSessions;
      } else {
        return [...prev, { botId, messages: [message] }];
      }
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-200 shadow-2xl"
        >
          <Menu size={24} />
        </button>
      </div>

      <Sidebar 
        bots={bots} 
        activeBotId={activeBotId} 
        onSelectBot={handleBotSelect}
        onOpenCreator={() => setCreatorOpen(true)}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatArea 
          activeBot={activeBot}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onClearHistory={handleClearHistory}
          onRegenerate={handleRegenerate}
        />
      </main>

      {isCreatorOpen && (
        <BotCreator 
          onClose={() => setCreatorOpen(false)}
          onCreate={handleCreateBot}
        />
      )}
    </div>
  );
};

export default App;
