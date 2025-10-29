import LinkBox from "@/components/LinkBox";
import { Tags } from "@/lib/tags";

async function LinkBoxContainer() {
  return (
    <div className="font-mallory-book border-nav-background grid grid-cols-1 rounded-lg border-2 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
      {Object.values(Tags).map((tag: string) => (
        <LinkBox key={tag} tag={tag} />
      ))}
    </div>
  );
}

export default LinkBoxContainer;
