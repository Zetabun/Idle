Mini 3D FPS — Gun Kill Tracker (Three.js)
=========================================

HOW TO RUN
----------
1) Simply double-click `index.html` to open it in Chrome/Edge/Firefox.
   - Click the **Start** button to lock the mouse.
   - If the mouse doesn't lock or you see no movement/interaction, serve the folder via a local server:

   A) Using Python (built-in on macOS/Linux; install from python.org on Windows):
      - Open a terminal in this folder and run:
        python3 -m http.server 8000
      - Then visit http://localhost:8000 in your browser.

   B) Using Node (if you have Node.js):
      - Install once:  npm i -g serve
      - Run:           serve .
      - Follow the URL it prints (usually http://localhost:3000)

CONTROLS
--------
- WASD: move
- Space: jump
- Shift: sprint
- Left click: shoot
- Esc: release mouse cursor

FEATURES
--------
- First-person controls with pointer lock
- Simple enemies that respawn
- On-weapon kill counter attachment: a tiny screen on the gun that updates every kill
- Minimal HUD (kills, basic FPS estimate, infinite ammo)

TROUBLESHOOTING
---------------
- If you can’t click to start, be sure the page has focus and that you’re not in a browser “preview” iframe.
- Serving from a local server often fixes pointer-lock or module loading quirks.
- Try a different browser and close other GPU-heavy tabs.

Enjoy! ✌️