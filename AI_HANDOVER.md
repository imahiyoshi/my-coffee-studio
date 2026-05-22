# 🤖 SUCCESSOR AI HANDOVER: DEVELOPMENT & COLD START ARCHITECTURE

```json
{
  "target_reader": "Successor AI Agent",
  "project_context": "Vite-React (SPA) + Firebase Client SDK & Gemini API",
  "deployment_characteristics": "Cloud Run Preview (AI Studio) & Vercel Production",
  "version": "1.1.0"
}
```

---

## 1. ⚡ COLD START COUNTERMEASURES (コールドスタート高速化方針)

This project prevents cold starts and achieves instantaneous response speeds using the following engineering practices:

### A. Client-Side SPA (Static Single Page Application) Architecture
* **Rule**: Maintain the application strictly as a Client-Side SPA.
* **Why**: Dynamic custom servers (like Express or node runtimes) running on Cloud Run require initializing runtime bundles, node modules, and route configurations on every new instance boot (loading in ~15-30s). 
* **Our Solution**: The application compiles strictly to lightweight static HTML, Javascript, and CSS in the `/dist` directory via `Vite` during `npm run build`. Vercel or Cloud Run's static file handler serves these pre-compiled assets directly. Static assets require **zero server execution initialization**, cutting cold start down to **0ms (Vercel Edge CDN)**.

### B. Lazy Initialization of Heavy Modules & SDKs
* **Rule**: Never load heavy third-party configurations or APIs on page load or at module load time.
* **Why**: Heavy imports create massive initial render blocks, slowing down the Browser's Largest Contentful Paint (LCP).
* **Our Solution**:
  - The **Gemini API Key validation** and query instantiation happen **lazily (on-demand)** only when recommending beans (inside `RecommendationModal.tsx`).
  - **Firebase Auth & Firestore state loading** is coupled with React's context to prevent rendering blocking before auth synchronization completes.

### C. Tree-Shaking and Tailwind CSS v4 Build Layer
* **Rule**: Keep global imports isolated.
* **Why**: Monolithic components or deep library dependencies choke dynamic bundlers.
* **Our Solution**: We use **Vite + Tailwind CSS v4**'s native CSS parsing plugin (`@tailwindcss/vite`), eliminating extra PostCSS layers and bundling unused CSS classes, reducing file sizes drastically.

---

## 2. 🏛️ CODE STRUCTURE & ROLE ARCHITECTURE (コード構造と各パーツの役割)

The codebase is split into modular segments ensuring clean context loading:

```
├── AGENTS.md                 <-- Critical AI Rules (Loaded by system prompt automatically)
├── AI_HANDOVER.md            <-- This file (Explains architecture and optimizations to current AI)
├── HANDOVER.md               <-- Human/AI historical transitions and contextual tracking
├── package.json              <-- SPA build configuration with zero backend startup overhead
├── index.html                <-- Simple SPA entry point
├── src/
│   ├── main.tsx              <-- App Bootstrap
│   ├── App.tsx               <-- Auth listener and layout controller (Thin Core)
│   ├── firebase.ts           <-- Singleton client-side database layer with built-in retry and sanitization
│   ├── types.ts              <-- Shared Types & Schemas
│   └── components/
│       ├── AuthScreen.tsx    <-- Google OAuth login screen using Firebase Client SDK
│       ├── Dashboard.tsx     <-- Standard logs UI
│       ├── RecordForm.tsx    <-- Custom records creation
│       ├── RecordDetail.tsx  <-- Displaying specific notes and individually compiled insights
│       └── RecommendationModal.tsx   <-- Heavy Gemini recommendations relying on customized prompts / exclusion lists
```

---

## 3. 📝 ACTIONS REQUIRED BY THE USER (imahiyoshi) & SUCCESSOR AI

To keep this ecosystem functioning smoothly, both the AI agent and the human owner must maintain these roles:

### For the Core AI Agent:
1. **Never create backend endpoint APIs** unless explicitly requested. Adding express code forces the container into a dynamic runtime state, immediately introducing 20-30s cold starts.
2. **Sanitize Environment Variables**: Always execute `.trim()` on `GEMINI_API_KEY` or any credentials to bypass hidden newline characters or wrapping quotes.
3. **Respect Firebase Project Ownership**: The Firebase configs in `firebase-applet-config.json` belong to the user’s real environment. Never invoke automated build setup tools (`set_up_firebase`) which override these settings.

### For the Owner (imahiyoshi):
1. **Vercel Migration / Deploy**: The code is fully ready for a 100% serverless static deployment on Vercel. Since it does not require a custom Node.js server to run, deploying it to Vercel ensures persistent global caching on Vercel’s premium edge network, converting all static loading delays to **0ms**.
2. **Exclusion List Management**: In case of duplicate AI outputs, confirm that the logs in Firestore are properly synced. The Gemini agent uses your real Firestore log list to build its exclusion rules.

---

## 4. 🚀 PARSING CHEATSHEET FOR SISTER AIs
```yaml
SystemPreset: "React-Vite-SPA"
BuildScript: "npm install && npm run build"
APIProxyNeed: "None (Direct Firebase & Client-side Gemini Integration with API Key sanitization)"
OwnershipMandates: "Respect existing auth hooks / Do not provision new DBs"
PerformanceRule: "Keep main bundles below 500KB. Use native Vite tree-shaking"
```
