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
    <>
      {tagsData &&
        tagsData.data.map((tag: Tag) => (
          <LinkBox key={tag.id} title={tag.attributes.name} />
        ))}
    </>
  );
}

export default LinkBoxContainer;
