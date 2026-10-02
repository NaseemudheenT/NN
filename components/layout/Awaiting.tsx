import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";

/**
 * A page that is honest about being empty.
 *
 * The brand voice forbids fake scarcity and fake luxury; padding a journal
 * with three invented essays to make the site look busy is the same lie in
 * a different costume. So this says there is nothing here, says what will
 * be here, and points at something that does exist.
 */
export function Awaiting({
  label,
  title,
  body,
  detail,
}: {
  label: string;
  title: string;
  body: string;
  detail?: React.ReactNode;
}) {
  return (
    <section className="awaiting band">
      <div className="wrap awaiting__in">
        <Monogram size={40} className="awaiting__mark" />
        <p className="label label--soft">{label}</p>
        <h1 className="d-h1">{title}</h1>
        <p className="lead awaiting__body">{body}</p>
        {detail ? <div className="awaiting__detail prose">{detail}</div> : null}
        <Link href="/collection" className="btn btn--solid">See the collection</Link>
      </div>
    </section>
  );
}
