# Calculus Howitzer

A browser artillery game: pick a charge (1–4) to set a rough distance, then fine-tune the launch angle to hit the target.
While the shell flies, the game shows derivatives (tangent slope) and integrals (Euler's method, velocity → position) in real time.

## Run

Open `index.html` in a browser. There is no build step.

## Structure

- `index.html`: the whole game (HTML, CSS and JS in one file)
  - `stepSim()`: numerical integration in Δt = 0.01 s steps
  - `accel()`: acceleration from gravity + air drag/wind
  - `CHARGES`: muzzle speed per charge, 60 · 75 · 93 · 115 m/s (ranges overlap, so every target is reachable)
  - `neededAngles()`: uses the vacuum trajectory formula to find the two launch angles (low and high) needed with the current charge
  - `TUT`: "learn calculus" lessons for people who struggle with math (hands-on missions + quick checks; starts automatically on the first visit)
  - `stepOnce()` / `setPaused()`: step 0.5 s at a time, and pause (used to experience integrals and derivatives)
  - `renderLog()`: free-play shot log (the last 4 shots at the current target)
  - `I18N` / `tr(ko, en)` / `P(ko, en)`: Korean/English switch. Fixed text uses `data-i18n` keys; dynamic text is picked with `tr()` each time it's drawn. The choice is saved in localStorage

## Modes

- **Vacuum**: solved exactly by the parabola formula. The hint button shows the launch angle you need
- **Air drag + wind**: no closed-form formula, so it's computed by numerical integration only

## Ideas

- High scores, moving targets, shell types, destructible terrain
