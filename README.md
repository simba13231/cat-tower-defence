# Cats vs Dogs — Defend the Kingdom

A 2.5D tower-defense game built with plain HTML/CSS/JS and [Three.js](https://threejs.org/). No build step, no bundler, no dependencies to install.

## Run it

**Option A — just open it.** Double-click `index.html`. Every script is a classic (non-module) `<script>` tag, so it works straight off disk via `file://` with no local server required.

**Option B — serve it locally** (only needed if your browser is picky about local file access):
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

**Option C — GitHub Pages.** Push this repo, then in the repo's Settings → Pages, set the source to the `main` branch / root. Your game will be live at `https://<username>.github.io/<repo>/`.

## Project structure

```
index.html            Markup only
css/style.css          All styling
js/
  utils.js             Color/math helpers
  audio.js              WebAudio sound effects (no audio files needed)
  towerData.js           Cat tower stats & upgrade paths
  enemyData.js            Dog enemy stats & traits
  textures.js               Procedural canvas textures (grass, dirt, fur, sky, clouds)
  renderer.js                 Three.js scene/camera/lighting/sky setup
  map.js                        Grid, path, tile & decoration meshes
  entities.js                     Cat & dog character mesh builders
  enemies.js                        Dog spawning, movement, status effects
  towers.js                           Placement, targeting, firing, projectiles
  waves.js                              The 12 wave definitions + spawn engine
  effects.js                              Hit particles, floating damage numbers
  ui.js                                     HUD, screen switching, win/lose screens
  shop.js                                     Shop tray + tower upgrade panel
  input.js                                      Mouse/touch raycasting
  save.js                                         localStorage best-score save
  game.js                                           Game state object & run lifecycle
  main.js                                             Boot + animation loop
```

Scripts are loaded in dependency order in `index.html`. Everything shares the browser's global scope (no bundler), so each file just declares the functions/constants it owns.

## Pushing to GitHub

From inside this folder:
```bash
git init
git add .
git commit -m "Cats vs Dogs: Defend the Kingdom"
git branch -M main
git remote add origin https://github.com/simba13231/cat-tower-defence.git
git push -u origin main
```

If it asks for credentials, use a Personal Access Token as the password (GitHub no longer accepts account passwords over HTTPS git). **Do not paste your token into a URL or a file that gets committed** — if a terminal prompts you for it, that's the safe way to enter it. If you ever pasted a token somewhere it shouldn't be (a chat, a public file, etc.), revoke it at GitHub → Settings → Developer settings → Personal access tokens and generate a new one.

## Notes on scope

This ships one full map ("Cat Village") with the complete tower-defense loop: 8 cat towers, 9 dog types plus a boss, 12 waves, upgrades, targeting modes, and a save of your best result. The data files (`towerData.js`, `enemyData.js`, `waves.js`) are structured so more maps, towers, or dogs can be added without touching the engine code.
