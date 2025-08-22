
# Game PWA Scaffold

This wraps your existing web game with a Progressive Web App (PWA) shell for offline play, installable experience, and smoother updates.

## Quick Start (Local)
1. From this folder, run a static server (any of these):
   - Python: `python3 -m http.server 5173`
   - Node: `npx http-server -p 5173`
2. Open http://localhost:5173
3. Click the browser's "Install" or "Add to Home Screen" option to install.

## Where to add/update code
- **index.html**: Your game. Keep coding as usual (HTML/JS/CSS, WebGL/WebGPU, modules).
- **/js/storage.js**: Optional IndexedDB helper for saves. Import with:
  ```html
  <script type="module">
    import { SaveStore } from '/js/storage.js';
    const store = new SaveStore();
    // await store.put('slot1', { hp: 50 });
    // const data = await store.get('slot1');
  </script>
  ```
- **manifest.webmanifest**: App name, icons, theme. Adjust as needed.
- **service-worker.js**: Caching strategy. When you change core assets, bump `CACHE_VERSION` and list new files in `CORE_ASSETS`. Users will be prompted to update.

## Updating your game (important!)
PWAs cache aggressively. To ship updates reliably:
1. **Bump `CACHE_VERSION`** in `service-worker.js` (e.g., v1 -> v2).
2. Add/modify entries in `CORE_ASSETS` for files you want pre-cached.
3. Re-deploy your files. On next load, users will see an update prompt (via `sw-update.js`). Accepting reloads to the new version.
4. For JS/CSS files, consider **cache busting** by adding a query string or filename hash (e.g., `app.js?v=2025-08-22`).

## WASM (optional)
You can compile heavy logic (Rust/C/C++/Zig) to WebAssembly and load it from your HTML. Remember to list the `.wasm` in `CORE_ASSETS` if you want it cached offline.

## Deploying
- Any static host works: GitHub Pages, Netlify, Cloudflare Pages, Vercel, your own server.
- Make sure `service-worker.js` and `manifest.webmanifest` are served at the site root (as in this scaffold).

## Breaking changes to saves
If you change save formats, bump the `version` when creating `new SaveStore('game-saves', 2)` and add an upgrade path in `onupgradeneeded`.

## Desktop build later (optional)
Wrap this same folder with **Tauri** or **Electron** for a desktop app using the exact same codebase.
