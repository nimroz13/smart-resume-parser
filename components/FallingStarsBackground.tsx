import React, { useEffect } from 'react';

const FallingStarsBackground: React.FC = () => {
  useEffect(() => {
    generateStarsCSS();
  }, []); // Run only once on component mount

  return (
    <div className="stars-container">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
    </div>
  );
};

// This function dynamically generates and injects the CSS needed for the starfield.
function generateStarsCSS() {
  if (document.getElementById('falling-stars-styles')) {
    return; // Styles already injected
  }

  const generateShadows = (n: number) => {
    let shadows = '';
    for (let i = 0; i < n; i++) {
      // Light theme: subtle sparkles with soft blues and purples
      const blur = Math.random() * 2;
      const opacity = 0.2 + Math.random() * 0.3;
      // Mix of blue and purple sparkles
      const hue = Math.random() > 0.5 ? '220, 180, 255' : '150, 200, 255'; // purple or blue
      const color = `rgba(${hue}, ${opacity})`;
      shadows += `${Math.random() * 2000}px ${Math.random() * 2000}px ${blur}px ${color},`;
    }
    return shadows.slice(0, -1);
  }
  const shadowsSmall = generateShadows(700);
  const shadowsMedium = generateShadows(200);
  const shadowsBig = generateShadows(100);

  const finalCSS = `
    .stars-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      /* Light theme with soft blue/purple gradients */
      background:
        radial-gradient(ellipse at 30% 20%, rgba(219, 234, 254, 0.6) 0%, rgba(219, 234, 254, 0) 50%),
        radial-gradient(ellipse at 70% 60%, rgba(243, 232, 255, 0.5) 0%, rgba(243, 232, 255, 0) 50%),
        radial-gradient(ellipse at 85% 85%, rgba(207, 250, 254, 0.4) 0%, rgba(207, 250, 254, 0) 45%),
        linear-gradient(to bottom, #dbeafe 0%, #ffffff 50%, #fae8ff 100%);
      overflow: hidden;
      z-index: -10;
    }
    
    #stars, #stars2, #stars3 {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
      animation-name: animStar;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    
    #stars:after, #stars2:after, #stars3:after {
      content: " ";
      position: absolute;
      left: 0;
      top: 2000px;
      width: inherit;
      height: inherit;
      background: transparent;
      box-shadow: inherit;
    }
    
    #stars {
      width: 1px;
      height: 1px;
      box-shadow: ${shadowsSmall};
      animation-duration: 50s;
    }
    
    #stars2 {
      width: 2px;
      height: 2px;
      box-shadow: ${shadowsMedium};
      animation-duration: 100s;
    }
    
    #stars3 {
      width: 3px;
      height: 3px;
      box-shadow: ${shadowsBig};
      animation-duration: 150s;
    }

    @keyframes animStar {
      from { transform: translateY(0px); }
      to { transform: translateY(-2000px); }
    }`;

  const style = document.createElement('style');
  style.id = 'falling-stars-styles';
  style.innerHTML = finalCSS;
  document.head.appendChild(style);
}

export default FallingStarsBackground;