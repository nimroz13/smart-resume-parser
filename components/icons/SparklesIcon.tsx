import React from 'react';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3L9.5 8.5L4 11L9.5 13.5L12 19L14.5 13.5L20 11L14.5 8.5L12 3Z"/>
    <path d="M5 21L6.5 18"/>
    <path d="M17.5 18L19 21"/>
    <path d="M21 5L18 6.5"/>
    <path d="M3 5L6 6.5"/>
  </svg>
);
export default SparklesIcon;
