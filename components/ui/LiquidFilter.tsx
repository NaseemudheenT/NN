/**
 * The refraction the liquid glass bends its backdrop through.
 *
 * A displacement map: turbulence is blurred into a smooth vector field, and
 * that field pushes each backdrop pixel sideways — which is exactly what a
 * sheet of real glass with an uneven surface does to what is behind it.
 * Blurring the noise first is the whole trick; raw turbulence displaces
 * neighbouring pixels in unrelated directions and reads as television static
 * rather than as glass.
 *
 * Only Chromium runs a filter inside backdrop-filter. Everywhere else the
 * @supports guard in glass.css never matches and the glass stands on its
 * blur, its rim and its specular, which is already a complete material.
 * Nothing on this site depends on this element existing.
 */
export function LiquidFilter() {
  return (
    <svg aria-hidden className="nn-filter" width="0" height="0" focusable="false">
      <defs>
        <filter id="nn-refract" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2.4" result="field" />
          <feDisplacementMap in="SourceGraphic" in2="field" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
