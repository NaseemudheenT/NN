/**
 * Page transitions.
 *
 * `template.tsx` re-mounts on every navigation, which is what a transition
 * needs — a layout would not.
 *
 * Done in CSS rather than with a motion library, for a reason that is not
 * stylistic. A JavaScript animation runs on requestAnimationFrame, and rAF
 * does not fire at all in a hidden tab. A wrapper that starts at opacity 0 and
 * animates to 1 therefore leaves the page *permanently blank* for anyone who
 * opens NN in a background tab and comes back to it later. A CSS animation is
 * handed to the compositor, runs without rAF, and finishes whether or not
 * anyone was watching.
 *
 * It is also a server component now, so the transition costs no JavaScript.
 */

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="nn-page-enter">{children}</div>;
}
