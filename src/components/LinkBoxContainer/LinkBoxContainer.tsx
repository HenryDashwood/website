import LinkBox from "@/components/LinkBox";

interface Tag {
  id: number;
  attributes: {
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
  };
}

async function LinkBoxContainer() {
  const tagsData = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/tags`
  ).then((res) => res.json());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-2 border-[#faad19] rounded-lg">
      {tagsData &&
        tagsData.data.map((tag: Tag) => (
          <LinkBox key={tag.id} title={tag.attributes.name} />
        ))}
    </div>
  );
}

export default LinkBoxContainer;
