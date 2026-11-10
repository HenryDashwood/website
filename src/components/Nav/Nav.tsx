import { getResearchNav } from "@/lib/research";

import NavClient from "./NavClient";

/** The site sidebar: page links, then the research tree. */
export default async function Nav() {
  const research = await getResearchNav();
  return <NavClient research={research} />;
}
