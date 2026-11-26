import React from 'react';
import logoLightImg from '../../assets/images/karigar_logo_light.png';

export function BrandLogo({
  variant = 'light',
  className = '',
  sizeClass = 'h-10 sm:h-11',
}: {
  variant?: 'light' | 'dark';
  className?: string;
  sizeClass?: string;
}) {
  if (variant === 'dark') {
    return (
      <img
        src={logoLightImg}
        alt="KARIGAR CONNECT"
        referrerPolicy="no-referrer"
        className={`${sizeClass} w-auto object-contain shrink-0 brightness-0 invert opacity-95 ${className}`}
      />
    );
  }

  return (
    <img
      src={logoLightImg}
      alt="KARIGAR CONNECT"
      referrerPolicy="no-referrer"
      className={`${sizeClass} w-auto object-contain shrink-0 ${className}`}
    />
  );
}
