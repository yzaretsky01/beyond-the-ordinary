/**
 * Small line drawings of each room's apparatus, used as signposts in the hall.
 * They are icons, not data: no colours with physical meaning, just the room's accent.
 */
export function RoomGlyph({ id }: { id: string }) {
  const common = {
    width: 72,
    height: 48,
    viewBox: '0 0 72 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    'aria-hidden': true,
  };
  switch (id) {
    case 'double-slit':
      return (
        <svg {...common}>
          <path d="M22 4v13M22 21v6M22 31v13" />
          <path
            d="M30 19a6 6 0 0 1 0 0M28 13c6 4 6 7 0 11M34 9c9 6 9 13 0 19M40 5c12 8 12 19 0 27"
            opacity="0.7"
          />
          <path d="M28 25c6 4 6 7 0 11M34 21c9 6 9 13 0 19M40 17c12 8 12 19 0 27" opacity="0.4" />
          <path d="M62 4v40" strokeDasharray="1 3" />
          <circle cx="8" cy="24" r="3" fill="currentColor" />
        </svg>
      );
    case 'superposition':
      return (
        <svg {...common}>
          <path d="M6 38h14l0-28h32v28H20" opacity="0.55" />
          <path d="M16 34l8 8M48 6l8 8M16 6l8 8M48 34l8 8" />
          <path d="M52 10h14M52 10v-6" strokeDasharray="2 2" />
          <rect x="33" y="35" width="5" height="6" rx="1" />
        </svg>
      );
    case 'entanglement':
      return (
        <svg {...common}>
          <circle cx="10" cy="24" r="8" />
          <path d="M4 20l12 8" />
          <circle cx="62" cy="24" r="8" />
          <path d="M58 17l8 14" />
          <path d="M20 24c6-8 10 8 16 0s10 8 16 0" opacity="0.7" />
          <circle cx="36" cy="24" r="2.5" fill="currentColor" />
        </svg>
      );
    case 'tunneling':
      return (
        <svg {...common}>
          <path d="M4 40h64" opacity="0.4" />
          <rect x="34" y="8" width="5" height="32" />
          <path d="M4 30c3-12 6 12 9 0s6 12 9 0 6 12 9 0" />
          <path d="M42 34c3-4 6 4 9 0s6 4 9 0" opacity="0.6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4 14h64M4 34h64" opacity="0.5" />
          <rect x="14" y="7" width="13" height="13" rx="2" fill="var(--c-hall)" />
          <path d="M42 14v20" />
          <circle cx="42" cy="14" r="3" fill="currentColor" />
          <circle cx="42" cy="34" r="6" fill="var(--c-hall)" />
          <path d="M42 28v12M36 34h12" />
          <path d="M58 30a6 6 0 0 1 8 0M62 34l3-6" />
        </svg>
      );
  }
}
