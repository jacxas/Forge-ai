<div align="center">
<img width="1200" height="475" alt="Forge-AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ⚡ Forge-AI

**Plataforma de IA conversacional con integración Gemini — construida con Next.js y TypeScript**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🧠 ¿Qué es Forge-AI?

Forge-AI es una plataforma de agentes conversacionales potenciada por **Gemini API**. Permite crear, probar y desplegar flujos de chat con IA de forma rápida, con soporte para prompts personalizados, historial de conversación y despliegue en Vercel.

## ✨ Características

- 💬 Chat conversacional con **Gemini Flash / Pro**
- 🧩 Prompts configurables por rol y contexto
- 📜 Historial de conversación persistente
- 🚀 Deploy optimizado para **Vercel**
- 🔐 Variables de entorno seguras
- 📱 UI responsiva con Tailwind CSS

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Estilos | Tailwind CSS 4 |
| IA | Gemini API (Google AI Studio) |
| Deploy | Vercel |

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 20+
- Cuenta en [Google AI Studio](https://ai.google.dev/) para obtener `GEMINI_API_KEY`

### Instalación

```bash
git clone https://github.com/jacxas/Forge-ai.git
cd Forge-ai
npm install
```

### Configuración

Copiá el archivo de entorno y completá tus claves:

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=tu_clave_aqui
```

### Ejecutar en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

## 🌐 Deploy en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jacxas/Forge-ai)

Recordá configurar `GEMINI_API_KEY` en las variables de entorno de Vercel.

## 📁 Estructura del Proyecto

```
Forge-ai/
├── app/                  # App Router de Next.js
│   ├── api/             # API Routes
│   ├── components/      # Componentes React
│   └── page.tsx         # Página principal
├── lib/                 # Utilidades y helpers
├── public/              # Assets estáticos
└── .env.local           # Variables de entorno (no commitear)
```

## 🤝 Contribuciones

Las PRs son bienvenidas. Para cambios grandes, abrí un issue primero para discutir qué querés cambiar.

## 📄 Licencia

MIT © [jacxas](https://github.com/jacxas)
