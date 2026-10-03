import { redirect } from "next/navigation";

/** The showroom is the whole building now. This URL goes to its front door. */
export default function ShowroomRedirect() {
  redirect("/");
}
