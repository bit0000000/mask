# Tomb of the Mask

A browser clone of the arcade classic. Slide through the maze, collect every dot, avoid the hazards.

## Play

Open the live link. No install, no account, no download.

**Controls**
- Phone: swipe in any direction
- Desktop: arrow keys or WASD
- Esc: pause

## Modes

**Stage** — procedurally generated levels. Difficulty rises every level. Every 10th level is a boss: extra coins and rising lava.

**Arcade** — endless vertical climb. Lava chases you from below. Score is height climbed.

## Hazards

| Icon | Name | Behaviour |
|------|------|-----------|
| 🔺 | Spike | Static, kills on touch |
| 👻 | Hidden spike | Reveals when you're within 2 cells |
| 🦇 | Bat | Patrols a line, bounces off walls |
| 🐡 | Pufferfish | Expands to 3×3, then shrinks, cyclically |
| 🎯 | Dart trap | Fires projectiles at intervals |
| ⚙️ | Saw | Fast-moving spinning blade |
| 🐍 | Snake | Bursts out of a wall when you cross its row or column |
| 🌋 | Lava | Rises from below on boss levels and in Arcade mode |

## Power-ups

Buy in the shop with ◈ coins:

- 🛡 Shield — absorbs one hit
- ❄ Freeze — hazards stop for 3 seconds
- 🧲 Magnet — pulls nearby coins toward you for 5 seconds

## Masks

| Mask | Bonus | Cost |
|------|-------|------|
| Classic | — | Free |
| Crimson | 2× score | 200 ◈ |
| Amber | 2× coins | 400 ◈ |
| Emerald | Start with shield | 650 ◈ |
| Void | Start with freeze | 900 ◈ |

## Tech

Plain HTML, CSS, JavaScript. No build step, no dependencies, no backend.

- 14 source files
- ~2,500 lines
- Sound synthesized with Web Audio (no audio files)
- All art drawn in code (no image files)
- Progress saved in `localStorage`

## Privacy

Nothing leaves your device. No accounts, no analytics, no tracking. Clearing your browser data wipes your progress.

## License

Free to play, fork, and modify.
