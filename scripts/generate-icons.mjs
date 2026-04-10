/**
 * SVG Icon Generator for equipment items
 * Generates 64x64 SVG icons with rarity-based color themes
 *
 * Rarity colors:
 *   common   = grey/white
 *   uncommon = green
 *   rare     = blue
 *   epic     = purple + glow
 *   legendary = gold/orange + particles
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'client', 'public', 'assets', 'items');

// ─── Rarity Color Palettes ───
const PALETTES = {
  common:    { pri: '#A8B0B8', sec: '#6B7280', hi: '#D1D5DB', dark: '#4B5563', accent: '#9CA3AF', bg: 'none' },
  uncommon:  { pri: '#2ECC71', sec: '#1A8B4C', hi: '#82E0AA', dark: '#145A32', accent: '#58D68D', bg: 'none' },
  rare:      { pri: '#3498DB', sec: '#1A5276', hi: '#85C1E9', dark: '#154360', accent: '#5DADE2', bg: 'none' },
  epic:      { pri: '#9B59B6', sec: '#6C3483', hi: '#C39BD3', dark: '#4A235A', accent: '#AF7AC5', bg: '#2C003E' },
  legendary: { pri: '#F39C12', sec: '#D35400', hi: '#F9E79F', dark: '#7E5109', accent: '#F5B041', bg: '#3D1F00' },
};

// ─── Glow / particle effects for epic & legendary ───
function epicGlow(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="28" fill="url(#epicGlow)" opacity="0.3"/>`;
}
function epicDefs() {
  return `<defs><radialGradient id="epicGlow"><stop offset="0%" stop-color="#9B59B6" stop-opacity="0.6"/><stop offset="100%" stop-color="#9B59B6" stop-opacity="0"/></radialGradient></defs>`;
}
function legendaryGlow(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="30" fill="url(#legGlow)" opacity="0.35"/>`;
}
function legendaryDefs() {
  return `<defs>
    <radialGradient id="legGlow"><stop offset="0%" stop-color="#F39C12" stop-opacity="0.7"/><stop offset="100%" stop-color="#F39C12" stop-opacity="0"/></radialGradient>
    <filter id="legBlur"><feGaussianBlur stdDeviation="1.5"/></filter>
  </defs>`;
}
function legendaryParticles() {
  return [
    `<circle cx="12" cy="10" r="1.5" fill="#F9E79F" opacity="0.8"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/></circle>`,
    `<circle cx="52" cy="14" r="1" fill="#F5B041" opacity="0.7"><animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.5s" repeatCount="indefinite"/></circle>`,
    `<circle cx="8" cy="50" r="1.2" fill="#FCF3CF" opacity="0.6"><animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite"/></circle>`,
    `<circle cx="54" cy="48" r="1" fill="#F9E79F" opacity="0.7"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.2s" repeatCount="indefinite"/></circle>`,
  ].join('\n  ');
}

function wrap(inner, rarity = 'common') {
  const p = PALETTES[rarity] || PALETTES.common;
  let defs = '';
  let preEffects = '';
  let postEffects = '';

  if (rarity === 'epic') {
    defs = epicDefs();
    preEffects = epicGlow(32, 32);
  } else if (rarity === 'legendary') {
    defs = legendaryDefs();
    preEffects = legendaryGlow(32, 32);
    postEffects = legendaryParticles();
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  ${defs}
  ${preEffects}
  ${inner}
  ${postEffects}
</svg>`;
}

// ─── Base Shape Templates ───
// Each returns SVG inner content using palette colors

const TEMPLATES = {
  // ── WEAPONS ──
  sword: (p, rarity) => wrap(`
  <polygon points="32,4 28,38 32,40 36,38" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <line x1="32" y1="6" x2="32" y2="36" stroke="${p.hi}" stroke-width="1.5" opacity="0.5"/>
  <polygon points="32,4 29,36 32,38" fill="${p.hi}" opacity="0.3"/>
  <rect x="22" y="38" width="20" height="4" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="24" y="38.5" width="16" height="1" fill="${p.accent}" opacity="0.4"/>
  <rect x="29" y="42" width="6" height="14" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="29" y1="45" x2="35" y2="44" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="29" y1="48" x2="35" y2="47" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="29" y1="51" x2="35" y2="50" stroke="#4A2E1A" stroke-width="0.8"/>
  <circle cx="32" cy="58" r="3" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <circle cx="32" cy="58" r="1.2" fill="${p.accent}" opacity="0.5"/>`, rarity),

  axe: (p, rarity) => wrap(`
  <rect x="30" y="8" width="4" height="44" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="30" y1="18" x2="34" y2="17" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="30" y1="22" x2="34" y2="21" stroke="#4A2E1A" stroke-width="0.8"/>
  <path d="M34,10 Q50,16 48,28 Q46,34 34,30 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M34,12 Q46,16 45,26 Q44,30 34,28 Z" fill="${p.hi}" opacity="0.3"/>
  <line x1="38" y1="14" x2="40" y2="26" stroke="${p.hi}" stroke-width="0.8" opacity="0.4"/>`, rarity),

  hammer: (p, rarity) => wrap(`
  <rect x="30" y="28" width="4" height="30" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <rect x="18" y="8" width="28" height="22" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <rect x="20" y="10" width="24" height="18" rx="2" fill="${p.hi}" opacity="0.2"/>
  <line x1="32" y1="10" x2="32" y2="28" stroke="${p.sec}" stroke-width="0.8" opacity="0.5"/>
  <rect x="20" y="14" width="6" height="10" rx="1" fill="${p.dark}" opacity="0.3"/>
  <rect x="38" y="14" width="6" height="10" rx="1" fill="${p.dark}" opacity="0.3"/>`, rarity),

  mace: (p, rarity) => wrap(`
  <rect x="30" y="30" width="4" height="28" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <circle cx="32" cy="20" r="14" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <circle cx="32" cy="20" r="10" fill="${p.hi}" opacity="0.2"/>
  <circle cx="28" cy="16" r="3" fill="${p.hi}" opacity="0.4"/>
  <path d="M22,12 L18,8" stroke="${p.sec}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M42,12 L46,8" stroke="${p.sec}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M22,28 L18,32" stroke="${p.sec}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M42,28 L46,32" stroke="${p.sec}" stroke-width="2.5" stroke-linecap="round"/>`, rarity),

  dagger: (p, rarity) => wrap(`
  <polygon points="32,6 29,34 32,36 35,34" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <line x1="32" y1="8" x2="32" y2="32" stroke="${p.hi}" stroke-width="1" opacity="0.5"/>
  <rect x="26" y="34" width="12" height="3" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>
  <rect x="29" y="37" width="6" height="12" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="29" y1="40" x2="35" y2="39" stroke="#4A2E1A" stroke-width="0.6"/>
  <line x1="29" y1="43" x2="35" y2="42" stroke="#4A2E1A" stroke-width="0.6"/>
  <circle cx="32" cy="51" r="2.5" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>`, rarity),

  shortblade: (p, rarity) => wrap(`
  <polygon points="32,4 27,32 32,35 37,32" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <line x1="32" y1="6" x2="32" y2="30" stroke="${p.hi}" stroke-width="1.2" opacity="0.5"/>
  <polygon points="32,4 28,30 32,33" fill="${p.hi}" opacity="0.25"/>
  <rect x="24" y="33" width="16" height="3" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>
  <rect x="29" y="36" width="6" height="14" rx="1" fill="#5C3A1E" stroke="#3D2613" stroke-width="0.8"/>
  <line x1="29" y1="39" x2="35" y2="38" stroke="#3D2613" stroke-width="0.6"/>
  <line x1="29" y1="43" x2="35" y2="42" stroke="#3D2613" stroke-width="0.6"/>
  <circle cx="32" cy="52" r="2" fill="${p.dark}"/>`, rarity),

  bow: (p, rarity) => wrap(`
  <path d="M20,8 Q8,32 20,56" fill="none" stroke="#6B4226" stroke-width="3" stroke-linecap="round"/>
  <path d="M20,8 Q12,32 20,56" fill="none" stroke="#8B5E3C" stroke-width="1.5" opacity="0.4"/>
  <line x1="20" y1="8" x2="20" y2="56" stroke="${p.pri}" stroke-width="1" opacity="0.6"/>
  <polygon points="44,28 20,8 22,10 44,30" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.6"/>
  <polygon points="44,28 44,36 22,54 20,56" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.6"/>
  <polygon points="44,28 50,26 52,32 44,36" fill="${p.hi}" stroke="${p.sec}" stroke-width="0.8"/>
  <line x1="46" y1="28" x2="48" y2="30" stroke="${p.sec}" stroke-width="0.6"/>`, rarity),

  crossbow: (p, rarity) => wrap(`
  <rect x="28" y="20" width="8" height="36" rx="2" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <path d="M8,22 Q32,14 56,22" fill="none" stroke="${p.pri}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M10,22 Q32,16 54,22" fill="none" stroke="${p.hi}" stroke-width="1.5" opacity="0.3"/>
  <line x1="8" y1="22" x2="56" y2="22" stroke="${p.sec}" stroke-width="0.8" opacity="0.5"/>
  <polygon points="32,8 30,20 34,20" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.6"/>
  <circle cx="32" cy="6" r="2" fill="${p.accent}"/>
  <rect x="26" y="28" width="12" height="3" rx="1" fill="${p.dark}" opacity="0.4"/>`, rarity),

  rifle: (p, rarity) => wrap(`
  <rect x="28" y="4" width="8" height="40" rx="1.5" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <rect x="30" y="6" width="4" height="36" fill="${p.hi}" opacity="0.2"/>
  <circle cx="32" cy="6" r="3" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <circle cx="32" cy="6" r="1.5" fill="${p.pri}" opacity="0.3"/>
  <rect x="24" y="40" width="16" height="4" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>
  <path d="M28,44 L24,58 Q23,60 26,60 L32,60" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <path d="M36,44 L36,58 Q36,60 34,60 L32,60" fill="#5C3A1E" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="26" y1="48" x2="34" y2="48" stroke="#4A2E1A" stroke-width="0.6"/>`, rarity),

  spear: (p, rarity) => wrap(`
  <rect x="30" y="20" width="4" height="40" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <polygon points="32,2 26,22 32,20 38,22" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <line x1="32" y1="4" x2="32" y2="18" stroke="${p.hi}" stroke-width="1" opacity="0.5"/>
  <polygon points="32,2 28,18 32,20" fill="${p.hi}" opacity="0.3"/>
  <rect x="27" y="20" width="10" height="3" rx="0.5" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.5"/>`, rarity),

  staff: (p, rarity) => wrap(`
  <rect x="30" y="16" width="4" height="44" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="30" y1="24" x2="34" y2="23" stroke="#4A2E1A" stroke-width="0.6"/>
  <line x1="30" y1="32" x2="34" y2="31" stroke="#4A2E1A" stroke-width="0.6"/>
  <circle cx="32" cy="10" r="8" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2" opacity="0.9"/>
  <circle cx="32" cy="10" r="5" fill="${p.hi}" opacity="0.4"/>
  <circle cx="30" cy="8" r="2" fill="${p.hi}" opacity="0.6"/>
  <path d="M26,16 Q32,20 38,16" fill="none" stroke="${p.dark}" stroke-width="1"/>`, rarity),

  wand: (p, rarity) => wrap(`
  <rect x="30" y="18" width="4" height="38" rx="1" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <circle cx="32" cy="12" r="6" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <circle cx="32" cy="12" r="3.5" fill="${p.hi}" opacity="0.5"/>
  <circle cx="31" cy="11" r="1.5" fill="${p.hi}" opacity="0.7"/>
  <circle cx="32" cy="6" r="2" fill="${p.accent}" opacity="0.6"/>
  <line x1="32" y1="6" x2="32" y2="8" stroke="${p.hi}" stroke-width="0.6" opacity="0.5"/>`, rarity),

  glave: (p, rarity) => wrap(`
  <path d="M16,4 Q10,20 18,36 L32,42 L46,36 Q54,20 48,4 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <path d="M20,8 Q16,20 22,34 L32,38 L42,34 Q48,20 44,8 Z" fill="${p.hi}" opacity="0.2"/>
  <line x1="32" y1="8" x2="32" y2="38" stroke="${p.hi}" stroke-width="1" opacity="0.4"/>
  <path d="M18,6 Q16,12 18,18" fill="none" stroke="${p.hi}" stroke-width="1" opacity="0.5"/>
  <rect x="28" y="42" width="8" height="16" rx="2" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <line x1="28" y1="46" x2="36" y2="45" stroke="#4A2E1A" stroke-width="0.6"/>`, rarity),

  hand: (p, rarity) => wrap(`
  <rect x="22" y="30" width="20" height="14" rx="3" fill="#6B4226" stroke="#4A2E1A" stroke-width="0.8"/>
  <rect x="24" y="32" width="4" height="16" rx="1.5" fill="#5C3A1E" stroke="#4A2E1A" stroke-width="0.6"/>
  <rect x="30" y="32" width="4" height="18" rx="1.5" fill="#5C3A1E" stroke="#4A2E1A" stroke-width="0.6"/>
  <rect x="36" y="32" width="4" height="16" rx="1.5" fill="#5C3A1E" stroke="#4A2E1A" stroke-width="0.6"/>
  <polygon points="20,30 16,14 22,12 26,28" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <polygon points="30,28 28,8 34,8 36,28" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <polygon points="38,30 42,14 48,16 44,30" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>`, rarity),

  // ── SHIELDS ──
  shield: (p, rarity) => wrap(`
  <path d="M32,4 L50,14 L50,36 Q50,52 32,60 Q14,52 14,36 L14,14 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.5"/>
  <path d="M32,8 L46,16 L46,35 Q46,48 32,55 Q18,48 18,35 L18,16 Z" fill="${p.hi}" opacity="0.2"/>
  <line x1="32" y1="10" x2="32" y2="54" stroke="${p.sec}" stroke-width="1" opacity="0.3"/>
  <line x1="18" y1="28" x2="46" y2="28" stroke="${p.sec}" stroke-width="1" opacity="0.3"/>
  <circle cx="32" cy="30" r="6" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8" opacity="0.4"/>
  <circle cx="32" cy="30" r="3" fill="${p.accent}" opacity="0.5"/>`, rarity),

  // ── ARMOR ──
  chest_plate: (p, rarity) => wrap(`
  <path d="M18,12 L14,20 L14,46 L22,52 L42,52 L50,46 L50,20 L46,12 L38,8 L26,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <path d="M20,14 L16,20 L16,44 L24,50 L40,50 L48,44 L48,20 L44,14 Z" fill="${p.hi}" opacity="0.15"/>
  <line x1="32" y1="10" x2="32" y2="50" stroke="${p.sec}" stroke-width="0.8" opacity="0.3"/>
  <path d="M26,8 L32,14 L38,8" fill="none" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="28" y="24" width="8" height="12" rx="1" fill="${p.dark}" opacity="0.2"/>`, rarity),

  chest_chain: (p, rarity) => wrap(`
  <path d="M18,12 L14,20 L14,46 L22,52 L42,52 L50,46 L50,20 L46,12 L38,8 L26,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M16,18 L48,18 M16,24 L48,24 M16,30 L48,30 M16,36 L48,36 M16,42 L48,42" stroke="${p.sec}" stroke-width="0.5" opacity="0.3"/>
  <path d="M20,16 L20,48 M26,14 L26,50 M32,12 L32,50 M38,14 L38,50 M44,16 L44,48" stroke="${p.sec}" stroke-width="0.5" opacity="0.2"/>
  <path d="M26,8 L32,14 L38,8" fill="none" stroke="${p.sec}" stroke-width="0.8"/>`, rarity),

  chest_cloth: (p, rarity) => wrap(`
  <path d="M20,10 L14,18 L14,50 L24,56 L40,56 L50,50 L50,18 L44,10 L38,8 L26,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M22,12 L18,18 L18,48 L26,54 L38,54 L46,48 L46,18 L42,12 Z" fill="${p.hi}" opacity="0.15"/>
  <path d="M26,8 L32,16 L38,8" fill="none" stroke="${p.sec}" stroke-width="0.8"/>
  <line x1="32" y1="16" x2="32" y2="54" stroke="${p.sec}" stroke-width="0.6" opacity="0.3" stroke-dasharray="3,2"/>
  <path d="M14,50 Q20,54 24,56" fill="none" stroke="${p.dark}" stroke-width="0.8" opacity="0.4"/>
  <path d="M50,50 Q44,54 40,56" fill="none" stroke="${p.dark}" stroke-width="0.8" opacity="0.4"/>`, rarity),

  chest_leather: (p, rarity) => wrap(`
  <path d="M18,12 L14,20 L14,48 L22,54 L42,54 L50,48 L50,20 L46,12 L38,8 L26,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M20,14 L16,20 L16,46 L24,52 L40,52 L48,46 L48,20 L44,14 Z" fill="${p.hi}" opacity="0.15"/>
  <path d="M26,8 L32,14 L38,8" fill="none" stroke="${p.sec}" stroke-width="0.8"/>
  <line x1="32" y1="14" x2="32" y2="52" stroke="${p.sec}" stroke-width="0.8" opacity="0.3"/>
  <rect x="22" y="20" width="6" height="3" rx="0.5" fill="${p.dark}" opacity="0.3"/>
  <rect x="36" y="20" width="6" height="3" rx="0.5" fill="${p.dark}" opacity="0.3"/>
  <rect x="22" y="30" width="6" height="3" rx="0.5" fill="${p.dark}" opacity="0.3"/>
  <rect x="36" y="30" width="6" height="3" rx="0.5" fill="${p.dark}" opacity="0.3"/>`, rarity),

  pants_plate: (p, rarity) => wrap(`
  <rect x="16" y="6" width="32" height="14" rx="2" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <rect x="16" y="18" width="14" height="38" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <rect x="34" y="18" width="14" height="38" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <rect x="18" y="20" width="10" height="34" rx="2" fill="${p.hi}" opacity="0.15"/>
  <rect x="36" y="20" width="10" height="34" rx="2" fill="${p.hi}" opacity="0.15"/>
  <rect x="18" y="8" width="28" height="2" fill="${p.dark}" opacity="0.2"/>`, rarity),

  pants_chain: (p, rarity) => wrap(`
  <rect x="16" y="6" width="32" height="14" rx="2" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <rect x="16" y="18" width="14" height="38" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="34" y="18" width="14" height="38" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M18,24 L28,24 M18,30 L28,30 M18,36 L28,36 M18,42 L28,42 M18,48 L28,48" stroke="${p.sec}" stroke-width="0.4" opacity="0.3"/>
  <path d="M36,24 L46,24 M36,30 L46,30 M36,36 L46,36 M36,42 L46,42 M36,48 L46,48" stroke="${p.sec}" stroke-width="0.4" opacity="0.3"/>`, rarity),

  pants_cloth: (p, rarity) => wrap(`
  <rect x="16" y="6" width="32" height="14" rx="2" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M16,18 L16,54 Q16,58 20,58 L28,58 Q30,58 30,54 L30,18 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M34,18 L34,54 Q34,58 36,58 L44,58 Q48,58 48,54 L48,18 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="18" y="8" width="28" height="2" fill="${p.dark}" opacity="0.2"/>
  <line x1="22" y1="20" x2="22" y2="56" stroke="${p.sec}" stroke-width="0.4" opacity="0.2" stroke-dasharray="2,2"/>
  <line x1="42" y1="20" x2="42" y2="56" stroke="${p.sec}" stroke-width="0.4" opacity="0.2" stroke-dasharray="2,2"/>`, rarity),

  pants_leather: (p, rarity) => wrap(`
  <rect x="16" y="6" width="32" height="14" rx="2" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <rect x="16" y="18" width="14" height="36" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="34" y="18" width="14" height="36" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="18" y="20" width="10" height="32" rx="2" fill="${p.hi}" opacity="0.1"/>
  <rect x="36" y="20" width="10" height="32" rx="2" fill="${p.hi}" opacity="0.1"/>
  <rect x="20" y="26" width="6" height="3" rx="0.5" fill="${p.dark}" opacity="0.2"/>
  <rect x="38" y="26" width="6" height="3" rx="0.5" fill="${p.dark}" opacity="0.2"/>`, rarity),

  helmet: (p, rarity) => wrap(`
  <path d="M16,36 L16,24 Q16,8 32,6 Q48,8 48,24 L48,36 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <path d="M18,34 L18,24 Q18,10 32,8 Q46,10 46,24 L46,34 Z" fill="${p.hi}" opacity="0.15"/>
  <rect x="14" y="34" width="36" height="6" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M20,40 L20,48 L44,48 L44,40" fill="none" stroke="${p.sec}" stroke-width="0.8" opacity="0.5"/>
  <rect x="18" y="42" width="28" height="4" rx="1" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.6" opacity="0.6"/>
  <line x1="32" y1="8" x2="32" y2="34" stroke="${p.sec}" stroke-width="0.6" opacity="0.3"/>`, rarity),

  boots_plate: (p, rarity) => wrap(`
  <path d="M20,8 L20,40 L16,44 L16,52 L40,52 L44,44 L44,40 L44,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M22,10 L22,38 L18,44 L18,50 L38,50 L42,44 L42,38 L42,10 Z" fill="${p.hi}" opacity="0.15"/>
  <rect x="18" y="24" width="28" height="3" rx="0.5" fill="${p.dark}" opacity="0.2"/>
  <rect x="16" y="48" width="28" height="4" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>`, rarity),

  boots_chain: (p, rarity) => wrap(`
  <path d="M20,8 L20,40 L16,44 L16,52 L40,52 L44,44 L44,40 L44,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M22,14 L42,14 M22,20 L42,20 M22,26 L42,26 M22,32 L42,32 M22,38 L42,38" stroke="${p.sec}" stroke-width="0.4" opacity="0.3"/>
  <rect x="16" y="48" width="28" height="4" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>`, rarity),

  boots_cloth: (p, rarity) => wrap(`
  <path d="M22,8 L22,42 L18,46 L18,52 L42,52 L42,46 L42,42 L42,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M24,10 L24,40 L20,46 L20,50 L40,50 L40,40 L40,10 Z" fill="${p.hi}" opacity="0.15"/>
  <line x1="32" y1="10" x2="32" y2="48" stroke="${p.sec}" stroke-width="0.4" opacity="0.2" stroke-dasharray="2,2"/>
  <rect x="18" y="48" width="24" height="4" rx="1" fill="${p.dark}" opacity="0.3"/>`, rarity),

  boots_leather: (p, rarity) => wrap(`
  <path d="M20,8 L20,42 L16,46 L16,52 L42,52 L44,46 L44,42 L44,8 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M22,10 L22,40 L18,46 L18,50 L40,50 L42,46 L42,40 L42,10 Z" fill="${p.hi}" opacity="0.12"/>
  <rect x="22" y="18" width="20" height="3" rx="0.5" fill="${p.dark}" opacity="0.2"/>
  <rect x="22" y="30" width="20" height="3" rx="0.5" fill="${p.dark}" opacity="0.2"/>
  <rect x="16" y="48" width="28" height="4" rx="1" fill="${p.dark}" opacity="0.3"/>`, rarity),

  gauntlets: (p, rarity) => wrap(`
  <path d="M18,14 L18,36 L16,40 L16,50 L26,54 L38,54 L48,50 L48,40 L46,36 L46,14 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M20,16 L20,34 L18,40 L18,48 L28,52 L36,52 L46,48 L46,40 L44,34 L44,16 Z" fill="${p.hi}" opacity="0.15"/>
  <rect x="20" y="24" width="24" height="3" rx="0.5" fill="${p.dark}" opacity="0.2"/>
  <line x1="26" y1="40" x2="26" y2="52" stroke="${p.sec}" stroke-width="0.6" opacity="0.3"/>
  <line x1="32" y1="38" x2="32" y2="52" stroke="${p.sec}" stroke-width="0.6" opacity="0.3"/>
  <line x1="38" y1="40" x2="38" y2="52" stroke="${p.sec}" stroke-width="0.6" opacity="0.3"/>`, rarity),

  shoulder: (p, rarity) => wrap(`
  <path d="M8,20 Q8,10 22,8 L42,8 Q56,10 56,20 L56,36 Q56,42 48,44 L16,44 Q8,42 8,36 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <path d="M10,22 Q10,12 22,10 L42,10 Q54,12 54,22 L54,34 Q54,40 48,42 L16,42 Q10,40 10,34 Z" fill="${p.hi}" opacity="0.15"/>
  <ellipse cx="20" cy="26" rx="6" ry="8" fill="${p.dark}" opacity="0.15"/>
  <ellipse cx="44" cy="26" rx="6" ry="8" fill="${p.dark}" opacity="0.15"/>
  <line x1="32" y1="10" x2="32" y2="42" stroke="${p.sec}" stroke-width="0.6" opacity="0.3"/>`, rarity),

  belt: (p, rarity) => wrap(`
  <rect x="6" y="22" width="52" height="16" rx="3" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <rect x="8" y="24" width="48" height="12" rx="2" fill="${p.hi}" opacity="0.15"/>
  <rect x="26" y="20" width="12" height="20" rx="2" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="28" y="22" width="8" height="16" rx="1" fill="${p.accent}" opacity="0.4"/>
  <circle cx="32" cy="30" r="3" fill="${p.accent}" stroke="${p.sec}" stroke-width="0.6"/>
  <circle cx="32" cy="30" r="1.2" fill="${p.hi}" opacity="0.6"/>`, rarity),

  // ── ACCESSORIES ──
  ring: (p, rarity) => wrap(`
  <ellipse cx="32" cy="34" rx="16" ry="18" fill="none" stroke="${p.pri}" stroke-width="4"/>
  <ellipse cx="32" cy="34" rx="16" ry="18" fill="none" stroke="${p.hi}" stroke-width="1.5" opacity="0.3"/>
  <circle cx="32" cy="16" r="6" fill="${p.accent}" stroke="${p.sec}" stroke-width="1"/>
  <circle cx="32" cy="16" r="3" fill="${p.hi}" opacity="0.6"/>
  <circle cx="31" cy="15" r="1.2" fill="white" opacity="0.5"/>`, rarity),

  necklace: (p, rarity) => wrap(`
  <path d="M16,8 Q16,4 32,4 Q48,4 48,8 L48,20 Q48,36 32,40 Q16,36 16,20 Z" fill="none" stroke="${p.pri}" stroke-width="2.5"/>
  <path d="M18,10 Q18,6 32,6 Q46,6 46,10" fill="none" stroke="${p.hi}" stroke-width="1" opacity="0.3"/>
  <circle cx="32" cy="42" r="7" fill="${p.accent}" stroke="${p.sec}" stroke-width="1.2"/>
  <circle cx="32" cy="42" r="4" fill="${p.hi}" opacity="0.5"/>
  <circle cx="31" cy="41" r="1.5" fill="white" opacity="0.4"/>`, rarity),

  talisman: (p, rarity) => wrap(`
  <circle cx="32" cy="32" r="18" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <circle cx="32" cy="32" r="14" fill="${p.hi}" opacity="0.15"/>
  <circle cx="32" cy="32" r="8" fill="${p.accent}" stroke="${p.sec}" stroke-width="0.8"/>
  <circle cx="32" cy="32" r="4" fill="${p.hi}" opacity="0.5"/>
  <line x1="32" y1="14" x2="32" y2="50" stroke="${p.sec}" stroke-width="0.6" opacity="0.3"/>
  <line x1="14" y1="32" x2="50" y2="32" stroke="${p.sec}" stroke-width="0.6" opacity="0.3"/>
  <path d="M32,8 L32,4" stroke="${p.pri}" stroke-width="2" stroke-linecap="round"/>`, rarity),

  // ── MISC ──
  bone: (p, rarity) => wrap(`
  <path d="M18,14 Q14,10 18,6 Q22,2 26,6 L42,38 Q46,42 42,46 Q38,50 34,46 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M20,14 Q18,12 20,8 L40,38 Q42,42 40,44 Z" fill="${p.hi}" opacity="0.2"/>
  <circle cx="20" cy="8" r="4" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <circle cx="40" cy="44" r="4" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>`, rarity),

  bone_skull: (p, rarity) => wrap(`
  <circle cx="32" cy="26" r="16" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <circle cx="32" cy="26" r="12" fill="${p.hi}" opacity="0.15"/>
  <circle cx="26" cy="24" r="4" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>
  <circle cx="38" cy="24" r="4" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>
  <path d="M28,34 L30,32 L32,34 L34,32 L36,34" fill="none" stroke="${p.dark}" stroke-width="1.2"/>
  <rect x="28" y="42" width="8" height="8" rx="1" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>`, rarity),

  book: (p, rarity) => wrap(`
  <rect x="14" y="8" width="36" height="48" rx="2" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <rect x="18" y="8" width="32" height="48" rx="1" fill="${p.hi}" opacity="0.15"/>
  <rect x="14" y="8" width="4" height="48" fill="${p.dark}" opacity="0.3"/>
  <rect x="22" y="14" width="22" height="2" fill="${p.sec}" opacity="0.3"/>
  <rect x="22" y="20" width="18" height="2" fill="${p.sec}" opacity="0.2"/>
  <rect x="22" y="26" width="20" height="2" fill="${p.sec}" opacity="0.2"/>
  <circle cx="33" cy="40" r="6" fill="${p.accent}" stroke="${p.sec}" stroke-width="0.8" opacity="0.5"/>`, rarity),

  statue: (p, rarity) => wrap(`
  <rect x="22" y="48" width="20" height="6" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="26" y="44" width="12" height="6" rx="1" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.6"/>
  <path d="M28,44 L26,28 Q26,22 32,18 Q38,22 38,28 L36,44 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <circle cx="32" cy="14" r="6" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M30,20 L30,24 M34,20 L34,24" fill="none" stroke="${p.hi}" stroke-width="0.6" opacity="0.3"/>`, rarity),

  potion: (p, rarity) => wrap(`
  <rect x="26" y="8" width="12" height="6" rx="1.5" fill="#8B6914" stroke="#5C4A0E" stroke-width="0.8"/>
  <path d="M28,14 L28,20 Q28,22 26,24 L22,28 Q20,30 20,34 L20,48 Q20,52 26,52 L38,52 Q44,52 44,48 L44,34 Q44,30 42,28 L38,24 Q36,22 36,20 L36,14 Z"
        fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <path d="M22,34 L22,48 Q22,50 27,50 L37,50 Q42,50 42,48 L42,34 Z" fill="${p.accent}" opacity="0.6"/>
  <ellipse cx="30" cy="38" rx="4" ry="5" fill="${p.hi}" opacity="0.3"/>
  <circle cx="28" cy="36" r="1" fill="white" opacity="0.4"/>`, rarity),

  cape: (p, rarity) => wrap(`
  <path d="M16,8 L48,8 L52,56 L32,48 L12,56 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <path d="M18,10 L46,10 L50,52 L32,46 L14,52 Z" fill="${p.hi}" opacity="0.15"/>
  <path d="M20,10 L20,44" stroke="${p.sec}" stroke-width="0.5" opacity="0.2"/>
  <path d="M32,10 L32,46" stroke="${p.sec}" stroke-width="0.5" opacity="0.2"/>
  <path d="M44,10 L44,44" stroke="${p.sec}" stroke-width="0.5" opacity="0.2"/>
  <rect x="22" y="6" width="20" height="6" rx="2" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <circle cx="32" cy="9" r="2" fill="${p.accent}" opacity="0.6"/>`, rarity),

  chalice: (p, rarity) => wrap(`
  <ellipse cx="32" cy="14" rx="14" ry="8" fill="${p.pri}" stroke="${p.sec}" stroke-width="1"/>
  <ellipse cx="32" cy="14" rx="10" ry="5" fill="${p.dark}" opacity="0.3"/>
  <path d="M22,18 L22,28 Q22,30 28,32 L28,42 L24,44 Q20,46 20,48 L44,48 Q44,46 40,44 L36,42 L36,32 Q42,30 42,28 L42,18" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="20" y="48" width="24" height="4" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.6"/>
  <ellipse cx="32" cy="16" rx="6" ry="3" fill="${p.accent}" opacity="0.4"/>`, rarity),

  horn: (p, rarity) => wrap(`
  <path d="M12,40 Q8,20 20,10 Q32,2 48,8 L52,12 Q36,8 24,16 Q14,24 16,40 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.2"/>
  <path d="M14,38 Q12,22 22,12 Q32,6 46,10" fill="none" stroke="${p.hi}" stroke-width="1" opacity="0.3"/>
  <ellipse cx="14" cy="44" rx="6" ry="8" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <ellipse cx="14" cy="44" rx="3" ry="5" fill="${p.pri}" opacity="0.4"/>`, rarity),

  hourglass: (p, rarity) => wrap(`
  <rect x="18" y="6" width="28" height="4" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="18" y="54" width="28" height="4" rx="1" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M20,10 L20,24 Q20,32 32,32 Q44,32 44,24 L44,10 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M20,54 L20,40 Q20,32 32,32 Q44,32 44,40 L44,54 Z" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.8"/>
  <path d="M24,14 L24,22 Q24,30 32,30 Q40,30 40,22 L40,14 Z" fill="${p.accent}" opacity="0.4"/>
  <path d="M28,54 L28,44 Q28,38 32,36 Q36,38 36,44 L36,54 Z" fill="${p.accent}" opacity="0.4"/>`, rarity),

  orb: (p, rarity) => wrap(`
  <circle cx="32" cy="28" r="18" fill="${p.pri}" stroke="${p.sec}" stroke-width="1.5"/>
  <circle cx="32" cy="28" r="14" fill="${p.hi}" opacity="0.2"/>
  <circle cx="28" cy="22" r="5" fill="${p.hi}" opacity="0.4"/>
  <circle cx="27" cy="21" r="2" fill="white" opacity="0.3"/>
  <rect x="24" y="46" width="16" height="6" rx="2" fill="${p.dark}" stroke="${p.sec}" stroke-width="0.8"/>
  <rect x="28" y="44" width="8" height="4" rx="1" fill="${p.pri}" stroke="${p.sec}" stroke-width="0.5"/>`, rarity),
};

// ─── Filename-to-template mapping ───
function getTemplate(filename) {
  // Remove inv_ prefix and number suffix: inv_sword_03.svg -> sword
  const base = filename.replace(/^inv_/, '').replace(/_\d+\.svg$/, '').replace(/\.svg$/, '');

  // Map compound names
  const mapping = {
    'weapon_bow': 'bow',
    'weapon_crossbow': 'crossbow',
    'weapon_rifle': 'rifle',
    'weapon_shortblade': 'shortblade',
    'weapon_glave': 'glave',
    'weapon_hand': 'hand',
    'misc_bone_skull': 'bone_skull',
    'misc_bone': 'bone',
    'misc_book': 'book',
    'misc_statue': 'statue',
    'misc_orb': 'orb',
    'misc_cape': 'cape',
    'misc_chalice': 'chalice',
    'misc_horn': 'horn',
    'misc_hourglass': 'hourglass',
    'jewelry_ring': 'ring',
    'jewelry_necklace': 'necklace',
    'jewelry_talisman': 'talisman',
    // Old-style filenames
    'iron_sword': 'sword',
    'shadow_blade': 'dagger',
    'leather_armor': 'chest_leather',
    'bone_ring': 'ring',
  };

  return mapping[base] || TEMPLATES[base] ? (mapping[base] || base) : null;
}

// ─── Determine rarity from filename by reading item data ───
function buildRarityMap() {
  // Read all equip files and extract iconUrl -> rarity mapping
  const map = {};
  const files = [
    'equip_dark_knight.ts', 'equip_shadow_mage.ts', 'equip_hunter.ts',
    'equip_priest.ts', 'equip_assassin.ts', 'consumables.ts', 'materials.ts'
  ];

  for (const f of files) {
    const path = join(__dirname, '..', 'shared', 'data', 'items', f);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf-8');

    // Simple regex to find pairs of rarity and iconUrl
    const items = content.split('{').slice(1);
    for (const item of items) {
      const rarityMatch = item.match(/rarity:\s*'(\w+)'/);
      const iconMatch = item.match(/iconUrl:\s*'\/assets\/items\/([^']+)'/);
      if (rarityMatch && iconMatch) {
        map[iconMatch[1]] = rarityMatch[1];
      }
    }
  }
  return map;
}

// ─── Main ───
const rarityMap = buildRarityMap();

let generated = 0;
let skipped = 0;
let noTemplate = 0;

for (const [filename, rarity] of Object.entries(rarityMap)) {
  const outPath = join(OUT_DIR, filename);

  // Skip if already exists
  if (existsSync(outPath)) {
    skipped++;
    continue;
  }

  const templateName = getTemplate(filename);
  if (!templateName || !TEMPLATES[templateName]) {
    console.warn(`  [SKIP] No template for: ${filename} (mapped to: ${templateName})`);
    noTemplate++;
    continue;
  }

  const p = PALETTES[rarity] || PALETTES.common;
  const svg = TEMPLATES[templateName](p, rarity);

  writeFileSync(outPath, svg.trim() + '\n');
  generated++;
}

console.log(`\nDone! Generated: ${generated}, Skipped (exists): ${skipped}, No template: ${noTemplate}`);
console.log(`Total icons: ${Object.keys(rarityMap).length}`);
