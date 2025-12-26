
import React from 'react';

type IconProps = {
  className?: string;
};

// --- Helpers for Gradients ---
const DefsGradients = () => (
  <defs>
    {/* Blue Arrow Gradient */}
    <linearGradient id="gradArrow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#60a5fa" />
      <stop offset="100%" stopColor="#2563eb" />
    </linearGradient>
    {/* Generic Shadow */}
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.3" />
    </filter>
  </defs>
);

export const IconSpeedupGeneral: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <DefsGradients />
    <path d="M20 30 L50 60 L20 90" stroke="url(#gradArrow)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 30 L80 60 L50 90" stroke="url(#gradArrow)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconSpeedupBuilding: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradStone" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="gradWood" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="gradArrowBuild" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <filter id="shadowBuild" x="-10%" y="-10%" width="120%" height="120%">
         <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.4"/>
      </filter>
    </defs>
    
    <g filter="url(#shadowBuild)">
        {/* Nails */}
        <path d="M40 75 L30 80" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="35" cy="70" r="4" fill="#94a3b8" />

        {/* Hammer Handle */}
        <path d="M48 45 L58 45 L55 85 L45 85 Z" fill="url(#gradWood)" transform="rotate(-35 50 65)" stroke="#451a03" strokeWidth="1" />
        
        {/* Hammer Head (Stone) */}
        <g transform="rotate(-35 50 40)">
           {/* Main Block */}
           <rect x="25" y="25" width="50" height="30" rx="4" fill="url(#gradStone)" stroke="#475569" strokeWidth="1.5" />
           {/* Side/Depth detail */}
           <rect x="20" y="22" width="10" height="36" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        </g>
    </g>

    {/* Speed Arrows Overlay */}
    <g transform="translate(58, 58)">
       <path d="M5 5 L20 20 L5 35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
       <path d="M5 5 L20 20 L5 35" stroke="url(#gradArrowBuild)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
       
       <path d="M25 5 L40 20 L25 35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
       <path d="M25 5 L40 20 L25 35" stroke="url(#gradArrowBuild)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export const IconSpeedupTroop: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradHelmet" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="gradArrowTroop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
       <filter id="shadowTroop" x="-10%" y="-10%" width="120%" height="120%">
         <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.4"/>
      </filter>
    </defs>
    
    <g filter="url(#shadowTroop)">
        {/* Blue Collar */}
        <path d="M20 55 Q50 85 80 55 V65 Q50 95 20 65 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.5" />

        {/* Helmet Top */}
        <path d="M25 55 V35 C25 15 35 10 50 10 C65 10 75 15 75 35 V55 H25 Z" fill="url(#gradHelmet)" stroke="#475569" strokeWidth="2" />
        <rect x="25" y="55" width="50" height="10" fill="url(#gradHelmet)" stroke="#475569" strokeWidth="2" />
        
        {/* Visor Area */}
        <path d="M30 38 H70 V45 H52 L50 52 L48 45 H30 V38 Z" fill="#1e293b" />
        
        {/* Vertical Line */}
        <path d="M50 10 V38" stroke="#94a3b8" strokeWidth="1" />
    </g>

    {/* Speed Arrows Overlay */}
    <g transform="translate(58, 58)">
       <path d="M5 5 L20 20 L5 35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
       <path d="M5 5 L20 20 L5 35" stroke="url(#gradArrowTroop)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
       
       <path d="M25 5 L40 20 L25 35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
       <path d="M25 5 L40 20 L25 35" stroke="url(#gradArrowTroop)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export const IconSpeedupResearch: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadowResearch" x="-10%" y="-10%" width="120%" height="120%">
         <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
      </filter>
       <linearGradient id="gradArrowRes" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <g filter="url(#shadowResearch)">
      {/* Pages */}
      <path d="M50 20 C25 20 15 30 15 30 V80 C15 80 25 70 50 70 V20 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
      <path d="M50 20 C75 20 85 30 85 30 V80 C85 80 75 70 50 70 V20 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
      
      {/* Spine */}
      <path d="M50 20 V70" stroke="#CBD5E1" strokeWidth="1" />

      {/* Symbol on Left */}
      <path d="M32 40 L40 55 H24 L32 40 Z" stroke="#60A5FA" strokeWidth="2" fill="none" />

      {/* Lines on Right */}
      <path d="M60 40 H75" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M60 50 H70" stroke="#CBD5E1" strokeWidth="2" />
    </g>

    {/* Speed Arrows Overlay */}
    <g transform="translate(60, 60)">
       <path d="M0 0 L12 10 L0 20" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
       <path d="M14 0 L26 10 L14 20" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
       
       <path d="M0 0 L12 10 L0 20" stroke="url(#gradArrowRes)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
       <path d="M14 0 L26 10 L14 20" stroke="url(#gradArrowRes)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export const IconGathering: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 10 V90" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
    <path d="M25 15 L85 35 L25 55" fill="#f43f5e" stroke="#be123c" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

export const IconHeroGear: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradSilverHead" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="gradWoodHandle" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
        {/* Handle */}
        <path d="M40 50 L60 50 L58 90 L42 90 Z" fill="url(#gradWoodHandle)" stroke="#451a03" strokeWidth="2" />
        {/* Wraps */}
        <path d="M41 52 H59 V62 H41 Z" fill="#fef3c7" />
        
        {/* Hammer Head */}
        <rect x="15" y="15" width="70" height="40" rx="4" fill="url(#gradSilverHead)" stroke="#475569" strokeWidth="2" />
        {/* 3D Depth Bottom */}
        <path d="M17 55 H83 L81 58 H19 Z" fill="#64748b" />

        {/* Crown Emblem */}
        <path d="M35 40 L35 28 L42 34 L50 25 L58 34 L65 28 L65 40 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const IconWildBeast: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
     <circle cx="20" cy="25" r="12" fill="#b45309" />
     <circle cx="80" cy="25" r="12" fill="#b45309" />
     <circle cx="50" cy="50" r="40" fill="#b45309" stroke="#78350f" strokeWidth="2" />
     <circle cx="35" cy="40" r="4" fill="#1e1e1e" />
     <circle cx="65" cy="40" r="4" fill="#1e1e1e" />
     <ellipse cx="50" cy="65" rx="14" ry="10" fill="#78350f" />
     <circle cx="50" cy="60" r="3" fill="#1e1e1e" />
  </svg>
);

export const IconDiamonds: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 40 L50 10 L80 40 L50 90 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="4" strokeLinejoin="round" />
    <path d="M20 40 L80 40" stroke="#93c5fd" strokeWidth="2" />
    <path d="M50 10 L50 90" stroke="#93c5fd" strokeWidth="2" />
    <path d="M50 10 L20 40 L50 90" fill="white" fillOpacity="0.15" />
  </svg>
);

export const IconHeroShards: React.FC<IconProps> = ({ className }) => (
   <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
     <defs>
        <linearGradient id="gradShard" x1="0%" y1="0%" x2="100%" y2="100%">
           <stop offset="0%" stopColor="#fbbf24" />
           <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="shardShadow" x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="2" dy="4" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
     </defs>
     <g filter="url(#shardShadow)">
        {/* Puzzle Shape - Matches provided image with Tabs on Top, Left, Bottom and Slot on Right */}
        <path d="
          M 25 25
          L 40 25 C 40 15, 60 15, 60 25 L 75 25
          L 75 40 C 65 40, 65 60, 75 60 L 75 75
          L 60 75 C 60 85, 40 85, 40 75 L 25 75
          L 25 60 C 15 60, 15 40, 25 40 L 25 25
          Z
        "
        fill="url(#gradShard)" stroke="#92400e" strokeWidth="3" strokeLinejoin="round" />
        
        {/* Inner Highlight to give glossy 3D look */}
        <path d="M30 30 L45 30 M30 30 L30 45" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
     </g>
   </svg>
);

export const IconMeatBone: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bone Ends Left */}
    <circle cx="15" cy="40" r="10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
    <circle cx="15" cy="60" r="10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />

    {/* Bone Ends Right */}
    <circle cx="85" cy="40" r="10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
    <circle cx="85" cy="60" r="10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />

    {/* Bone Shaft */}
    <rect x="15" y="40" width="70" height="20" fill="#f1f5f9" />

    {/* Meat Chunk */}
    <rect x="30" y="25" width="40" height="50" rx="15" fill="#f97316" stroke="#c2410c" strokeWidth="3" />
    
    {/* Shine */}
    <path d="M38 35 L45 35" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
    <path d="M38 45 L50 45" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
