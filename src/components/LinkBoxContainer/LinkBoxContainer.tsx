import LinkBox from "@/components/LinkBox";

const tags: string[] = [
  "Mathematics",
  "Literature",
  "Biology",
  "Programming",
  "Recommendations",
  "Economics",
  "Roundups",
  "History",
];

async function LinkBoxContainer() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-2 border-[#faad19] rounded-lg">
      {tags.map((tag) => (
        <LinkBox key={tag} tag={tag} />
      ))}
    </div>
  );
}

export default LinkBoxContainer;
