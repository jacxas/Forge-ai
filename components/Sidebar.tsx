import React from 'react';
import { Bot, Plus, Settings, MessageSquare, X, LogOut, User as UserIcon } from 'lucide-react';
import { Bot as BotType } from '../types';
import * as Icons from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

interface SidebarProps {
  bots: BotType[];
  activeBotId: string;
  onSelectBot: (botId: string) => void;
  onOpenCreator: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onEditBot: (bot: BotType) => void;
  onDeleteBot: (botId: string) => void;
  onDuplicateBot: (bot: BotType) => void;
  user: User | null;
  userProfile: UserProfile | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  activeView: 'chat' | 'gallery' | 'video';
  onViewChange: (view: 'chat' | 'gallery' | 'video') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  bots, 
  activeBotId, 
  onSelectBot, 
  onOpenCreator,
  isOpen,
  onCloseMobile,
  onEditBot,
  onDeleteBot,
  onDuplicateBot,
  user,
  userProfile,
  onLogout,
  onOpenSettings,
  onOpenAdmin,
  activeView,
  onViewChange
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
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600 p-1 rounded shadow-lg shadow-blue-600/20">AI</span> Forge
          </h1>
          <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <button 
              onClick={() => {
                onViewChange('chat');
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeView === 'chat' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <MessageSquare size={13} />
              Chat
            </button>
            <button 
              onClick={() => {
                onViewChange('video');
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeView === 'video' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icons.Video size={13} />
              Video
            </button>
            <button 
              onClick={() => {
                onViewChange('gallery');
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeView === 'gallery' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icons.Image size={13} />
              Galería
            </button>
          </div>
        </div>

        <div className="p-4 pt-0">
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
            <div
              key={bot.id}
              onClick={() => {
                onSelectBot(bot.id);
                onCloseMobile();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectBot(bot.id);
                  onCloseMobile();
                }
              }}
              role="button"
              tabIndex={0}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${activeBotId === bot.id 
                  ? 'bg-slate-800 text-white ring-1 ring-slate-700' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${bot.avatarColor} text-white shadow-sm overflow-hidden
              `}>
                {bot.avatarUrl ? (
                  <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                ) : (
                  renderIcon(bot.icon)
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium truncate">{bot.name}</div>
                <div className="text-xs opacity-70 truncate">{bot.description}</div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateBot(bot);
                  }}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                  title="Duplicar bot"
                >
                  <Icons.Copy size={14} />
                </button>
                {!bot.isDefault && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBot(bot);
                      }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                      title="Editar bot"
                    >
                      <Icons.Settings size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBot(bot.id);
                      }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400"
                      title="Eliminar bot"
                    >
                      <Icons.Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {userProfile?.isAdmin && (
            <div className="px-2 pb-2">
              <button
                onClick={onOpenAdmin}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 group hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5"
              >
                <div className="flex items-center gap-3">
                  <Icons.Shield size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Panel Admin</span>
                </div>
                <Icons.ChevronRight size={14} className="opacity-40" />
              </button>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-3 px-2 py-3 bg-slate-800/30 rounded-xl border border-slate-800 mb-2">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700 border border-slate-600 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-white truncate">{user.displayName || 'Usuario'}</div>
                  {userProfile?.isAdmin && (
                    <span className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 rounded font-black uppercase tracking-tighter shadow-sm">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
          )}
          
          <div className="flex gap-1">
            <button 
              onClick={onOpenSettings}
              className="flex-1 flex items-center gap-2 text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
            >
              <Settings size={18} />
              <span>Ajustes</span>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};