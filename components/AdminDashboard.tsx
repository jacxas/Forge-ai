
import React, { useState, useEffect } from 'react';
import { 
  Users, Bot, MessageSquare, Shield, Activity, 
  Search, ExternalLink, X, ChevronRight, BarChart3,
  Clock, Database, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react';
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Panel Administrativo</h2>
              <p className="text-xs text-slate-500 font-mono">FORGE AI CORE ENGINE • V1.0</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X size={24} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-800 bg-slate-900/30">
          {[
            { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
            { id: 'users', label: 'Usuarios', icon: Users },
            { id: 'bots', label: 'Explorador de Bots', icon: Bot },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-white bg-blue-500/5' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <RefreshCw className="text-blue-500 animate-spin" size={32} />
              <p className="text-slate-500 font-mono text-xs animate-pulse">Sincronizando con Forge DB...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stat Cards */}
                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                        <Users size={24} />
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
                      <div className="text-slate-500 text-xs font-medium">Usuarios Registrados</div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                        <Bot size={24} />
                      </div>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Activo</span>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-white">42</div>
                      <div className="text-slate-500 text-xs font-medium">Modelos en Despliegue</div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl ${watchdog?.lastStatus === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {watchdog?.lastStatus === 'OK' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <span className={`text-[10px] ${watchdog?.lastStatus === 'OK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter`}>
                        {watchdog?.lastStatus === 'OK' ? 'SISTEMA ONLINE' : 'INCIDENTE'}
                      </span>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-white">{watchdog?.lastStatus === 'OK' ? 'Saludable' : 'Fallo'}</div>
                      <div className="text-slate-500 text-xs font-medium">Estado del Watchdog</div>
                    </div>
                  </div>

                  {/* System Log */}
                  <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-blue-500" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Monitor de Autoreparación (Logs en Vivo)</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        {watchdog?.isHealing && (
                          <div className="flex items-center gap-2 text-orange-400 animate-pulse mr-4">
                            <RefreshCw size={12} className="animate-spin" />
                            REPARANDO...
                          </div>
                        )}
                        <Clock size={14} />
                      </div>
                    </div>
                    <div className="p-4 font-mono text-[11px] space-y-2 h-40 overflow-y-auto bg-slate-950/40 custom-scrollbar">
                       {watchdog?.history.length === 0 ? (
                         <p className="text-slate-600 italic">No hay eventos registrados recientemente.</p>
                       ) : (
                         watchdog?.history.map((log, idx) => (
                           <div key={idx} className="flex gap-4 group animate-in slide-in-from-left-2 duration-200">
                             <span className="text-slate-600 shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                             <span className={`${
                               log.event.includes('Fallo') ? 'text-red-400' : 
                               log.event.includes('recuperado') ? 'text-emerald-400' : 
                               log.event.includes('Iniciando') ? 'text-orange-400' : 
                               'text-blue-400'
                             } font-bold shrink-0 min-w-[80px]`}>{log.event.split(':')[0]}</span>
                             <span className="text-slate-300 group-hover:text-white transition-colors">{log.event.includes(':') ? log.event.split(':')[1] : log.event}</span>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                    <Search className="text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar usuarios por email o nombre..." 
                      className="bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 text-sm w-full"
                    />
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/20">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registrado</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {users.map((user) => (
                          <tr key={user.uid} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={user.photoURL || ''} className="w-8 h-8 rounded-lg" alt="" />
                                <span className="text-sm font-medium text-white">{user.displayName || 'Anónimo'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400 font-mono">{user.email}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                <ExternalLink size={16} />
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
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                   <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center text-slate-700 border-2 border-dashed border-slate-800">
                     <Bot size={40} />
                   </div>
                   <div>
                     <h3 className="text-white font-bold">Listado Global de Bots</h3>
                     <p className="text-slate-500 text-sm max-w-xs mx-auto">Esta función requiere que realices una consulta a través de todas las subcolecciones de usuarios.</p>
                   </div>
                   <button className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors">
                     Escanear Subcolecciones
                   </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-600 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Database size={10} /> FIREBASE_CONNECTED</span>
            <span className="flex items-center gap-1"><Shield size={10} /> ADMIN_SESSION_SECURE</span>
          </div>
          <div>© 2026 FORGE AI ADMIN PANEL</div>
        </footer>
      </div>
    </div>
  );
};
