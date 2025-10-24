import LinkBox from "@/components/LinkBox";
import { Tags } from "@/lib/tags";

async function LinkBoxContainer() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-2 border-[#faad19] rounded-lg font-mallory-book">
      {Object.values(Tags).map((tag: string) => (
        <LinkBox key={tag} tag={tag} />
      ))}
    </div>
  );
}

export default LinkBoxContainer;
