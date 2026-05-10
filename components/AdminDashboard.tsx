
import React, { useState, useEffect } from 'react';
import { 
  Users, Bot, MessageSquare, Shield, Activity, 
  Search, ExternalLink, X, ChevronRight, BarChart3,
  Clock, Database, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, Bot as BotType } from '../types';
import axios from 'axios';

interface WatchdogStatus {
  failureCount: number;
  isHealing: boolean;
  lastCheck: string;
  lastStatus: 'OK' | 'FAIL';
  history: { time: string; event: string }[];
}

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'bots'>('stats');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [watchdog, setWatchdog] = useState<WatchdogStatus | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBots: 0,
    totalMessages: 0
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchWatchdogStatus, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchWatchdogStatus = async () => {
    try {
      const response = await axios.get('/api/watchdog/status');
      setWatchdog(response.data);
    } catch (error) {
      console.error("Error fetching watchdog status:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const path = 'users';
    try {
      if (activeTab === 'stats' || activeTab === 'users') {
        const usersSnap = await getDocs(query(collection(db, path), limit(50)));
        const usersList = usersSnap.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersList);
        setStats(prev => ({ ...prev, totalUsers: usersSnap.size }));
      }
      await fetchWatchdogStatus();
    } catch (error) {
      console.error("Error fetching admin data:", error);
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-[100px] z-[100] flex items-center justify-center p-4">
      <div className="glass border border-white/10 w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-[0_100px_200px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-700">
        {/* Header */}
        <header className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)]">
              <Shield size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white leading-tight font-display tracking-tighter uppercase">NÚCLEO MAESTRO</h2>
              <p className="text-[10px] text-slate-500 font-mono font-bold tracking-[0.4em]">SISTEMA DE CONTROL • VERTEX V1.0</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-14 h-14 rounded-full glass-light border border-white/10 text-slate-400 hover:text-white hover:rotate-90 transition-all flex items-center justify-center"
          >
            <X size={28} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex px-10 gap-2 border-b border-white/5 bg-white/[0.01]">
          {[
            { id: 'stats', label: 'ANÁLITICA', icon: BarChart3 },
            { id: 'users', label: 'USUARIOS', icon: Users },
            { id: 'bots', label: 'EXPLORADOR', icon: Bot },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-6 text-[10px] font-black tracking-[0.3em] uppercase transition-all relative ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="adminTabLine" 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-8">
              <div className="w-20 h-20 rounded-[2rem] glass flex items-center justify-center border border-white/5 shadow-2xl">
                <RefreshCw className="text-blue-500 animate-spin" size={40} />
              </div>
              <p className="text-slate-500 font-mono text-xs font-bold tracking-[0.5em] animate-pulse">SINCRONIZANDO NÚCLEO...</p>
            </div>
          ) : (
            <div className="space-y-10">
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {/* Stat Cards */}
                  <div className="p-8 rounded-[3rem] glass-light border border-white/5 space-y-6 hover:border-white/20 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                        <Users size={32} />
                      </div>
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest">+12%</span>
                    </div>
                    <div>
                      <div className="text-5xl font-black text-white tracking-tighter mb-2">{stats.totalUsers}</div>
                      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Entidades Activas</div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[3rem] glass-light border border-white/5 space-y-6 hover:border-white/20 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                        <Bot size={32} />
                      </div>
                      <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">ESTABLE</span>
                    </div>
                    <div>
                      <div className="text-5xl font-black text-white tracking-tighter mb-2">42</div>
                      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Nodos de Inteligencia</div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[3rem] glass-light border border-white/5 space-y-6 hover:border-white/20 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${watchdog?.lastStatus === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {watchdog?.lastStatus === 'OK' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                      </div>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] ${watchdog?.lastStatus === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {watchdog?.lastStatus === 'OK' ? 'ONLINE' : 'INCIDENTE'}
                      </span>
                    </div>
                    <div>
                      <div className="text-5xl font-black text-white tracking-tighter mb-2">{watchdog?.lastStatus === 'OK' ? 'NORMAL' : 'FALLO'}</div>
                      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Salud del Watchdog</div>
                    </div>
                  </div>

                  {/* System Log */}
                  <div className="md:col-span-3 glass border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                    <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <Activity size={20} className="text-blue-500" />
                        <h3 className="font-black text-white tracking-[0.2em] uppercase text-[10px]">MONITOR DE AUTORREPARACIÓN</h3>
                      </div>
                      <div className="flex items-center gap-6 text-[9px] font-bold font-mono text-slate-500 tracking-widest">
                        {watchdog?.isHealing && (
                          <div className="flex items-center gap-3 text-orange-400 animate-pulse">
                            <RefreshCw size={14} className="animate-spin" />
                            REPARANDO ESTRUCTURA...
                          </div>
                        )}
                        <span className="flex items-center gap-2">
                           <Clock size={16} className="text-white/20" />
                           TIEMPO REAL
                        </span>
                      </div>
                    </div>
                    <div className="p-8 font-mono text-[11px] space-y-4 h-60 overflow-y-auto bg-black/20 custom-scrollbar">
                       {watchdog?.history.length === 0 ? (
                         <p className="text-slate-600 italic tracking-[0.1em]">Esperando eventos de sistema...</p>
                       ) : (
                         watchdog?.history.map((log, idx) => (
                           <div key={idx} className="flex gap-6 group animate-in slide-in-from-left-4 duration-500 items-start">
                             <span className="text-slate-600 shrink-0 font-bold tracking-tighter">[{new Date(log.time).toLocaleTimeString()}]</span>
                             <div className="flex flex-col gap-1 flex-1">
                                <span className={`${
                                  log.event.includes('Fallo') ? 'text-red-400' : 
                                  log.event.includes('recuperado') ? 'text-emerald-400' : 
                                  log.event.includes('Iniciando') ? 'text-orange-400' : 
                                  'text-blue-400'
                                } font-black tracking-widest text-[9px] uppercase`}>{log.event.split(':')[0]}</span>
                                <span className="text-slate-400 group-hover:text-white transition-colors leading-relaxed">{log.event.includes(':') ? log.event.split(':')[1] : log.event}</span>
                             </div>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex items-center gap-6 glass-light border border-white/10 p-6 rounded-[2rem] shadow-xl group">
                    <Search className="text-slate-500 group-hover:text-blue-400 transition-colors" size={24} />
                    <input 
                      type="text" 
                      placeholder="Identificar usuario por parámetro..." 
                      className="bg-transparent border-none focus:ring-0 text-white placeholder-slate-700 text-lg w-full font-light"
                    />
                  </div>

                  <div className="glass border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">ENTIDAD</th>
                          <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">IDENTIFICADOR</th>
                          <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">GÉNESIS</th>
                          <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">ACCESO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.map((user) => (
                          <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden glass border border-white/10 group-hover:border-blue-500 transition-all">
                                   <img src={user.photoURL || ''} className="w-full h-full object-cover" alt="" />
                                </div>
                                <span className="text-base font-black text-white tracking-tight uppercase">{user.displayName || 'ENTIDAD ANÓNIMA'}</span>
                              </div>
                            </td>
                            <td className="px-10 py-8 text-sm text-slate-500 font-mono tracking-tighter">{user.email}</td>
                            <td className="px-10 py-8 text-[11px] text-slate-600 font-bold uppercase">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="px-10 py-8 text-right">
                              <button className="w-10 h-10 rounded-xl glass-light border border-white/10 text-slate-500 hover:text-white flex items-center justify-center transition-all ml-auto">
                                <ExternalLink size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'bots' && (
                <div className="h-96 flex flex-col items-center justify-center text-center p-12 space-y-10 animate-in fade-in duration-700">
                   <div className="w-32 h-32 rounded-[3.5rem] glass flex items-center justify-center text-slate-700 border-2 border-dashed border-white/10 relative group">
                      <div className="absolute inset-0 bg-blue-500/5 rounded-[3.5rem] blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                      <Bot size={48} className="relative z-10" />
                   </div>
                   <div className="space-y-4">
                     <h3 className="text-4xl font-black text-white font-display tracking-tight uppercase">ESCANEO DE NODOS</h3>
                     <p className="text-slate-500 text-xl font-light max-w-lg mx-auto leading-relaxed">
                       Sincroniza el mapa global de inteligencia a través de las mallas de datos del servidor.
                     </p>
                   </div>
                   <button className="px-12 py-5 rounded-[2rem] bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-2xl active:scale-95 shadow-blue-600/30">
                     INICIAR ESCANEO DE MALLA
                   </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-8 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-600 font-mono font-bold tracking-[0.4em] bg-white/[0.01]">
          <div className="flex items-center gap-10">
            <span className="flex items-center gap-3 text-emerald-500/60"><Database size={14} /> FORGE_LINK_ACTIVE</span>
            <span className="flex items-center gap-3 text-blue-500/60"><Shield size={14} /> SESSION_PROTOCOL_ENCRYPTED</span>
          </div>
          <div className="opacity-40">© 2026 FORGE AI ADMINISTRATIVE CORE</div>
        </footer>
      </div>
    </div>
  );
};
