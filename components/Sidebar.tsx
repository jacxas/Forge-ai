import React from 'react';
import { Bot, Plus, Settings, MessageSquare, X } from 'lucide-react';
import { Bot as BotType } from '../types';
import * as Icons from 'lucide-react';

interface SidebarProps {
  bots: BotType[];
  activeBotId: string;
  onSelectBot: (botId: string) => void;
  onOpenCreator: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  bots, 
  activeBotId, 
  onSelectBot, 
  onOpenCreator,
  isOpen,
  onCloseMobile
}) => {
  
  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Bot;
    return <IconComponent size={20} />;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600 p-1 rounded">AI</span> PoeClone
          </h1>
          <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
           <button 
            onClick={() => {
              onOpenCreator();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus size={20} />
            Crear Bot
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tus Bots
          </div>
          {bots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => {
                onSelectBot(bot.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left group
                ${activeBotId === bot.id 
                  ? 'bg-slate-800 text-white ring-1 ring-slate-700' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${bot.avatarColor} text-white shadow-sm
              `}>
                {renderIcon(bot.icon)}
              </div>
              <div className="overflow-hidden">
                <div className="font-medium truncate">{bot.name}</div>
                <div className="text-xs opacity-70 truncate">{bot.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 text-slate-400 hover:text-white px-2 py-2 rounded hover:bg-slate-800 transition-colors">
            <Settings size={20} />
            <span>Configuración</span>
          </button>
        </div>
      </aside>
    </>
  );
};