# Altero

Altero is a next-generation platform for AI chatbot games, interactive
storytelling, and text-based RPGs — a blend of AI Dungeon, Chub AI, and
SillyTavern wrapped in a dark, immersive fantasy/sci-fi aesthetic.

This repository contains the marketing landing page for Altero, built with
**vanilla HTML5, CSS3, and JavaScript** (no React/Vue/Tailwind), using
[GSAP](https://gsap.com/) (Core, ScrollTrigger, ScrollToPlugin) for the
parallax hero animation.

## Project Structure

```
.
├── index.html      # Page markup + inline SVG assets (sky / clouds / mountains)
├── styles.css      # Dark fantasy theme + parallax layer styling
├── main.js         # GSAP timeline + arrow-button interactions
└── README.md
```

## Getting Started

The page is fully static — no build step or package manager required. Open
`index.html` directly in a browser, or serve the directory with any static
file server:

```bash
# Python 3
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then visit <http://localhost:8000>.

## Parallax Hero

The hero uses seven stacked layers driven by `ScrollTrigger`:

| Layer       | Role                          |
| ----------- | ----------------------------- |
| `.sky`      | Gradient backdrop             |
| `.cloud1`   | Foreground cloud band         |
| `.cloud2`   | Mid cloud band                |
| `.cloud3`   | Distant cloud band            |
| `.mountBg`  | Far mountain silhouette       |
| `.mountMg`  | Mid mountain ridge            |
| `.mountFg`  | Foreground peaks + ground     |

The `#arrow-btn` at the bottom of the hero scrolls the page to the next
section using `ScrollToPlugin`.

## Browser Support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). The page relies
on CSS custom properties, `clamp()`, and ES2017+ JS — no IE support.
