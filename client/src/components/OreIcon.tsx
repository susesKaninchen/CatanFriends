import React from 'react';

interface OreIconProps {
  className?: string;
  size?: number;
}

export const OreIcon: React.FC<OreIconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="ore-base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="40%" stopColor="#475569" />
          <stop offset="80%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id="ore-crystal-top" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="35%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="ore-luster" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="ore-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      <ellipse cx="16" cy="28.5" rx="12" ry="3" fill="#000000" opacity="0.45" />

      <path
        d="M 16,3 L 26,9 L 29,20 L 23,28 L 9,28 L 3,19 L 6,8 Z"
        fill="url(#ore-base)"
        stroke="#0f172a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      <path
        d="M 16,3 L 6,8 L 13,15 L 17,11 Z"
        fill="url(#ore-crystal-top)"
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      <path
        d="M 16,3 L 26,9 L 21,14 L 17,11 Z"
        fill="#94a3b8"
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      <path
        d="M 26,9 L 29,20 L 22,18 L 21,14 Z"
        fill="url(#ore-shadow)"
        stroke="#0f172a"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      <polygon
        points="17,11 21,14 19,21 13,15"
        fill="url(#ore-luster)"
        stroke="#0284c7"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      <polygon
        points="16,13 18,12 17.5,14 16.5,15"
        fill="#ffffff"
        opacity="0.9"
      />

      <path
        d="M 6,8 L 3,19 L 10,21 L 13,15 Z"
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      <path
        d="M 13,15 L 19,21 L 17,28 L 9,28 L 10,21 Z"
        fill="#334155"
        stroke="#0f172a"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      <path
        d="M 21,14 L 22,18 L 29,20 L 23,28 L 17,28 L 19,21 Z"
        fill="url(#ore-shadow)"
        stroke="#0f172a"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      <path
        d="M 7,9 L 13,15 L 17,11 L 25,10"
        stroke="#f8fafc"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.8"
        fill="none"
      />
    </svg>
  );
};
