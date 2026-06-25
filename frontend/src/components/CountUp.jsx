import React, { useState, useEffect } from 'react';

export default function CountUp({ end, duration = 1500, isCurrency = false, formatFn = null }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endValue = parseFloat(end) || 0;
    
    if (endValue === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(endValue * easeProgress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  const displayValue = formatFn ? formatFn(count) : (isCurrency ? `$${Math.round(count).toLocaleString('es-CL')}` : Math.round(count).toLocaleString('es-CL'));

  return <span>{displayValue}</span>;
}
