# The Button - Unity Project Setup Guide

## Project Overview
A minimalistic incremental game built in Unity 6. The player clicks a glowing button to earn points, unlocks upgrades, and evolves the button through various stages.

## Visual Style
- **Background:** Dark (#0b0b0b)
- **Primary Colors:** Neon Blue, Neon Purple
- **Aesthetic:** Minimal Cyberpunk

## Scene Setup Instructions

### 1. Camera & Canvas
- Set the Camera Background Color to `#0B0B0B`.
- Create a **Canvas** (Render Mode: Screen Space - Overlay).
- Add a **UI Panel** as a background with a dark color.

### 2. Main Button
- Create a **Button (TextMeshPro)** in the center of the Canvas.
- Add the `ButtonController.cs` script to it.
- **Visuals:**
    - Set the Source Image to a circular glow sprite.
    - Set the Color to Neon Blue.
- **Particles:** Create a child Particle System. Set it to 'Burst' mode on click. Drag this into the `ButtonController`'s `Click Particles` slot.

### 3. UI Elements
- **Points Counter:** Create a TMP Text at the top center. Connect it to the `GameManager` (you'll need a simple script or use the `OnPointsChanged` event to update it).
- **Evolution Stage Indicator:** Create a TMP Text at the bottom. Connect it to the `EvolutionSystem`.
- **Upgrade Panel:**
    - Create a vertical layout group on the right side.
    - Create a Prefab for an "Upgrade Row" containing: Name, Level, Cost, and a Purchase Button.
    - Add `UpgradeManager.cs` to a global UI object and link the UI elements in the Inspector.

### 4. Systems Configuration
- Create an Empty GameObject named **_GameSystems**.
- Add the following scripts:
    - `GameManager`
    - `AutoClickSystem`
    - `EvolutionSystem`
    - `RandomEventSystem`
    - `SaveSystem`
- **Evolution Stages Setup:**
    - In `EvolutionSystem`, add 4 stages:
        1. Base: 0 pts, 1x Multiplier.
        2. Glow: 1,000 pts, 2x Multiplier.
        3. Sphere: 10,000 pts, 5x Multiplier.
        4. Portal: 100,000 pts, 20x Multiplier.

### 5. Random Events
- **Golden Button:** Create a separate Button prefab with a gold glow. Keep it disabled by default. Link it to `RandomEventSystem`.
- **Glitch Overlay:** Create a UI Image that covers the screen with a low-alpha purple distortion. Link it to `RandomEventSystem`.

## Scripts Included
- `GameManager.cs`: Core stats and point logic.
- `ButtonController.cs`: Interaction and scaling animations.
- `Upgrade.cs`: ScriptableObject for defining upgrades.
- `UpgradeManager.cs`: Shop logic.
- `AutoClickSystem.cs`: Passive income.
- `EvolutionSystem.cs`: Milestone visual/multiplier updates.
- `RandomEventSystem.cs`: Spawning events.
- `SaveSystem.cs`: Persistence using PlayerPrefs.

## How to Expand
- **New Upgrades:** Right-click in Project view -> `Create/The Button/Upgrade`. Define stats and add to the `UpgradeManager` list.
- **New Stages:** Add entries to the `stages` array in the `EvolutionSystem` component.
