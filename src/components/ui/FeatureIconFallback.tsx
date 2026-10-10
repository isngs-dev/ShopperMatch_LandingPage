/** Lightweight SVG stand-ins for the 3D icons on mobile / low-power devices. */
const paths = [
  // puzzle / nodes locking
  <>
    <rect x="8" y="22" width="26" height="26" rx="6" />
    <circle cx="38" cy="35" r="6" />
    <rect x="46" y="22" width="26" height="26" rx="6" />
    <circle cx="42" cy="35" r="6" />
  </>,
  // paper planes
  <>
    <path d="M10 40l54-24-18 40-10-14z" />
    <path d="M36 42l-4 14 10-8" />
  </>,
  // orbiting arrow around message
  <>
    <rect x="26" y="26" width="28" height="20" rx="5" />
    <path d="M62 34a24 24 0 1 0-8 22" />
    <path d="M56 50l-2 8 8-2" />
  </>,
  // clock to calendar check
  <>
    <rect x="12" y="16" width="56" height="48" rx="8" />
    <path d="M12 30h56M28 10v12M52 10v12" />
    <path d="M28 48l8 8 16-16" />
  </>,
  // dashboard panels
  <>
    <rect x="22" y="12" width="48" height="34" rx="6" opacity=".5" />
    <rect x="14" y="22" width="48" height="34" rx="6" />
    <path d="M26 48V38M36 48V32M46 48V40" />
  </>,
  // progress ring
  <>
    <circle cx="40" cy="40" r="24" opacity=".35" />
    <path d="M40 16a24 24 0 1 1-24 24" />
    <path d="M8 30h14M4 40h10M8 50h14" opacity=".7" />
  </>,
];

export default function FeatureIconFallback({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-full w-full"
      fill="none"
      stroke="url(#fi-grad)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fi-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c98a4b" />
          <stop offset="0.6" stopColor="#b8531f" />
          <stop offset="1" stopColor="#e8d1a7" />
        </linearGradient>
      </defs>
      <g className="max-h-full">{paths[index]}</g>
    </svg>
  );
}
