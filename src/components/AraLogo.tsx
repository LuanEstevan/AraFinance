interface AraLogoProps {
  size?: number;
  id?: string;
}

export function AraLogo({ size = 36, id = "ara" }: AraLogoProps) {
  const g1 = `${id}_g1`;
  const g2 = `${id}_g2`;
  return (
    <svg width={size} height={size} viewBox="0 0 376 307" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={g1} x1="375.369" y1="305.624" x2="0.369139" y2="-0.37599" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED"/>
          <stop offset="0.5" stopColor="#2563EB"/>
          <stop offset="1" stopColor="#1E40AF"/>
        </linearGradient>
        <linearGradient id={g2} x1="375.369" y1="305.624" x2="0.369139" y2="-0.37599" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED"/>
          <stop offset="0.5" stopColor="#2563EB"/>
          <stop offset="1" stopColor="#1E40AF"/>
        </linearGradient>
      </defs>
      <path fillRule="evenodd" clipRule="evenodd" d="M218.243 1.08728C195.286 -0.36291 180.42 -0.362596 155.997 1.08924L0 306.088H97.9424V306.12C121.838 305.978 149.826 296.923 171.893 277.315C193.779 257.867 209.881 228.004 210.357 186.041C192.647 202.79 173.746 217.613 154.846 228.224C135.371 239.157 115.825 245.658 97.5488 245.12L95.8691 245.124C96.4549 245.319 95.2834 244.929 95.8691 245.124C95.2834 244.929 186.558 62.3812 186.558 62.3812L227.236 143.577C234.454 138.337 241.957 133.794 251.107 131.002C260.302 128.197 271.1 127.176 284.873 128.916L218.243 1.08728Z" fill={`url(#${g1})`}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M296.664 152.029C282.713 150.165 271.765 151.046 262.51 153.697C253.373 156.314 245.83 160.672 238.627 165.906L308.656 306.088H375.112L296.664 152.029Z" fill={`url(#${g2})`}/>
    </svg>
  );
}
