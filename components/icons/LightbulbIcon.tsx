import React from 'react';

const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15.09 16.05A6.49 6.49 0 0 0 12 10c-1.84 0-3.53.77-4.74 2.06" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.22 1.02 4.22 2.62 5.51" />
    <path d="M16.38 17.51A7 7 0 0 0 19 12a7 7 0 0 0-7-7" />
    <path d="m5 21 1-1" />
    <path d="m18 21 1-1" />
    <path d="M12 18v3" />
    <path d="M8 21h8" />
  </svg>
);

export default LightbulbIcon;
