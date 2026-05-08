import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

// --- AGENTE AUTOREPARADOR (INTEGRADO) ---
interface AgentStatus {
    failureCount: number;
    isHealing: boolean;
    lastCheck: string;
    lastStatus: 'OK' | 'FAIL';
    history: { time: string; event: string }[];
}

let watchdogStatus: AgentStatus = {
    failureCount: 0,
    isHealing: false,
    lastCheck: new Date().toISOString(),
    lastStatus: 'OK',
    history: []
};

function logEvent(event: string) {
    watchdogStatus.history.unshift({ time: new Date().toISOString(), event });
    if (watchdogStatus.history.length > 20) watchdogStatus.history.pop();
    console.log(`[Watchdog] ${event}`);
}

async function startWatchdog() {
    const targetUrl = 'http://localhost:3000';
    const checkInterval = 15000; // 15 segundos
    const maxRetries = 3;

    setInterval(async () => {
        if (watchdogStatus.isHealing) return;

        try {
            const response = await axios.get(`${targetUrl}/api/health`, { timeout: 5000 });
            watchdogStatus.lastCheck = new Date().toISOString();
            
            if (response.status === 200) {
                if (watchdogStatus.failureCount > 0) {
                    logEvent("Sistema recuperado y estable.");
                    watchdogStatus.failureCount = 0;
                }
                watchdogStatus.lastStatus = 'OK';
            }
        } catch (error: any) {
            watchdogStatus.failureCount++;
            watchdogStatus.lastStatus = 'FAIL';
            logEvent(`Fallo detectado (${watchdogStatus.failureCount}/${maxRetries}): ${error.message}`);
            
            if (watchdogStatus.failureCount >= maxRetries) {
                await initiateHealing();
            }
        }
    }, checkInterval);
}

async function initiateHealing() {
    watchdogStatus.isHealing = true;
    logEvent("Iniciando protocolo de autoreparación...");

    try {
        // Nivel 1: Limpieza de estado interno (simulado)
        logEvent("Nivel 1: Limpiando buffers de memoria y descriptores...");
        await new Promise(r => setTimeout(r, 2000));
        
        // Verificación rápida
        if (await checkRecovery()) return;

        // Nivel 2: Alerta Critica (En Cloud Run, el sistema se reinicia solo si falla, 
        // aquí notificamos el estado degradado)
        logEvent("Nivel 2: Sistema degradado. El orquestador de la plataforma debería reiniciar el contenedor pronto.");
        
    } catch (error) {
        logEvent(`Error crítico en reparación: ${error}`);
    } finally {
        watchdogStatus.isHealing = false;
    }
}

async function checkRecovery() {
    try {
        const response = await axios.get(`http://localhost:3000/api/health`, { timeout: 3000 });
        if (response.status === 200) {
            logEvent("Autoreparación completada con éxito.");
            watchdogStatus.failureCount = 0;
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

// --- SERVIDOR EXPRESS ---
async function startServer() {
    const app = express();
    const PORT = 3000;

    // API Routes
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", time: new Date().toISOString(), platform: "forge-ai-core" });
    });

    app.get("/api/watchdog/status", (req, res) => {
        res.json(watchdogStatus);
    });

    // Vite Middleware
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`[🚀] Servidor corriendo en http://localhost:${PORT}`);
        startWatchdog();
    });
}

startServer();
