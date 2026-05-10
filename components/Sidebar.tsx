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
        fixed inset-y-0 left-0 z-30 w-80 glass border-r border-white/5 shadow-2xl
        transform transition-transform duration-500 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter font-display">
            <span className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20 rotate-6">AI</span> 
            <span>FORGE</span>
          </h1>
          <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex glass-light p-1 rounded-2xl border border-white/5 shadow-inner">
            <button 
              onClick={() => {
                onViewChange('chat');
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'chat' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <MessageSquare size={14} />
              Chat
            </button>
            <button 
              onClick={() => {
                onViewChange('video');
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'video' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icons.Video size={14} />
              Video
            </button>
            <button 
              onClick={() => {
                onViewChange('gallery');
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'gallery' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icons.Image size={14} />
              Galería
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
           <button 
            onClick={() => {
              onOpenCreator();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] uppercase tracking-widest text-[10px]"
          >
            <Plus size={18} />
            Crear Nuevo Bot
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Mis Compañeros AI
          </div>
          <div className="space-y-1">
            {bots.map((bot) => (
              <div
                key={bot.id}
                onClick={() => {
                  onSelectBot(bot.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 text-left group cursor-pointer
                  ${activeBotId === bot.id 
                    ? 'bg-white/[0.07] text-white border border-white/10 shadow-lg' 
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border border-transparent'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                  ${bot.avatarColor} text-white shadow-2xl transition-transform group-hover:scale-105 duration-500 overflow-hidden
                `}>
                  {bot.avatarUrl ? (
                    <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                  ) : (
                    renderIcon(bot.icon)
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-sm truncate tracking-tight">{bot.name}</div>
                  <div className="text-[11px] opacity-50 truncate tracking-wide font-light">{bot.description}</div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateBot(bot);
                    }}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-colors"
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
                        className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        <Icons.Settings size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBot(bot.id);
                        }}
                        className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 space-y-4">
          {userProfile?.isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full flex items-center justify-between px-5 py-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group hover:bg-blue-500/20 transition-all shadow-2xl shadow-blue-500/5"
            >
              <div className="flex items-center gap-3">
                <Icons.Shield size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Panel Control</span>
              </div>
              <Icons.ChevronRight size={14} className="opacity-30" />
            </button>
          )}
          
          {user && (
            <div className="flex items-center gap-4 px-4 py-4 bg-white/[0.03] rounded-3xl border border-white/5">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shrink-0 shadow-lg">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-white truncate tracking-tight">{user.displayName || 'Usuario'}</div>
                  {userProfile?.isAdmin && (
                    <span className="text-[7px] bg-blue-500/40 text-blue-100 px-1 py-0.5 rounded-sm font-black uppercase tracking-tighter">
                      ADM
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-500 truncate font-mono uppercase tracking-widest">{user.email}</div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={onOpenSettings}
              className="flex-1 flex items-center justify-center gap-2 text-slate-400 hover:text-white px-4 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Settings size={16} />
              <span>Ajustes</span>
            </button>
            <button 
              onClick={onLogout}
              className="p-3 text-slate-400 hover:text-red-400 bg-white/[0.03] hover:bg-red-500/10 border border-white/5 rounded-2xl transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};