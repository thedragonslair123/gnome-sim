# Gnome in the Garden

A tiny interactive web app where you are a gnome hanging out in the garden of an old woman.

Files
- `index.html` — main page
- `style.css` — styles and simple visuals
- `script.js` — movement, interactions, and dialogue

Run locally

1. Start a simple HTTP server from the project root (Python 3):

```bash

cd /workspaces/gnome-sim
python3 -m http.server 8000
# open http://localhost:8000 in your browser
```

2. Or use Node's http-server (if you have Node installed):

```bash
npx http-server -p 8000
```

Controls
- Click anywhere in the garden to move the gnome.
- Use the arrow keys for step movement.
- Click the old woman to start a conversation.

Keyboard shortcuts
- Press `v` to toggle the control panel.
- Press `r` to reset saved state (same as the Reset button).
- Press `i` to toggle image sprites.
- Press `e` to export the garden as a PNG.

Exporting
- Use the `Export PNG` button in the control panel or press `e`.
- The app builds a PNG from the visible garden (background, flowers, gnome, old woman) and downloads it.

Development
- Edit `index.html`, `style.css`, and `script.js` to change layout, visuals, or behaviour.
- The app is intentionally small and dependency-free — adding assets or sprites is straightforward.

Notes
- Exported PNG uses the current view size — for higher resolution, resize your browser window before exporting.
- Audio requires a user gesture in some browsers; interact with the page (click) to enable sounds.

License
- Public domain for demo purposes. Use or modify as you like.
# gnome-sim
messing around trying to create an app where you are a gnome just gnoming around
