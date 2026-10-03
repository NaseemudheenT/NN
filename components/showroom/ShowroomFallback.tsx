"use client";

/**
 * The painted hall.
 *
 * This is NOT a loading state. It is a complete, finished rendering of the
 * same room in CSS, and on a device that cannot run WebGL it is the room —
 * which is why it is built from the same plan: three arched openings in an
 * end wall, an arcade either side, a stone floor carrying the window as a
 * long smear of light, and the lamps on the piers.
 *
 * ── why it has no inline style ──────────────────────────────────────
 * The sky is the VISITOR's sky — their hour, their latitude, their weather —
 * and the server has none of those. Writing it into this element's style
 * attribute therefore guarantees the server's markup and the client's first
 * render disagree, which React reports as a hydration mismatch on every
 * single page load. So the light is published once, onto :root, by
 * useDaylightOnDocument, and everything reads it from the cascade. The
 * server renders a room with no light values at all; the first client frame
 * fills them in.
 */
export function ShowroomFallback() {
  return (
    <div className="nn-painted">
      <div className="nn-painted__sky" />
      <div className="nn-painted__wall">
        <span className="nn-painted__arch nn-painted__arch--side" data-side="l" />
        <span className="nn-painted__arch nn-painted__arch--main" />
        <span className="nn-painted__arch nn-painted__arch--side" data-side="r" />
      </div>
      <div className="nn-painted__shaft" />
      <div className="nn-painted__floor" />
      <div className="nn-painted__arcade" data-side="l" />
      <div className="nn-painted__arcade" data-side="r" />
      <div className="nn-painted__lamps" />
    </div>
  );
}
