/** A measured column of running text. One width, set once, used everywhere. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="band band--tight">
      <div className="wrap">
        <div className="prose reveal">{children}</div>
      </div>
    </div>
  );
}
