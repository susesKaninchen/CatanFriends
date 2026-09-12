import React from 'react';
import { ResourceType } from '../types';

interface ResourceIconProps {
  type: ResourceType;
  className?: string;
  alt?: string;
}

export const RESOURCE_ASSETS: { [key in ResourceType]: { src: string; cardSrc: string; name: string } } = {
  wood: { src: '/assets/icon_wood.jpg', cardSrc: '/assets/card_wood.jpg', name: 'Holz' },
  clay: { src: '/assets/icon_clay.jpg', cardSrc: '/assets/card_clay.jpg', name: 'Lehm' },
  sheep: { src: '/assets/icon_sheep.jpg', cardSrc: '/assets/card_sheep.jpg', name: 'Wolle' },
  wheat: { src: '/assets/icon_wheat.jpg', cardSrc: '/assets/card_wheat.jpg', name: 'Weizen' },
  ore: { src: '/assets/icon_ore.jpg', cardSrc: '/assets/card_ore.jpg', name: 'Erz' }
};

export const ResourceIcon: React.FC<ResourceIconProps> = ({ type, className = 'w-4 h-4', alt }) => {
  const asset = RESOURCE_ASSETS[type];
  if (!asset) return null;

  return (
    <img
      src={asset.src}
      alt={alt || asset.name}
      title={alt || asset.name}
      className={`inline-block rounded-full object-cover shadow-sm border border-amber-500/50 align-middle ${className}`}
      loading="lazy"
    />
  );
};
