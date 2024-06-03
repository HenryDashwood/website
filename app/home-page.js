import Image from "next/image";
import Link from "next/link";
import Content from "../components/Content";
import Nav from "../components/Nav";
import Wrapper from "../components/Wrapper";
import LinkBox from "../components/LinkBox";
import LinkBoxContainer from "../components/LinkBoxContainer";
import { fetcher } from "../lib/api";
import markdownToHTML from "../lib/markdownToHTML";
import utilStyles from "../styles/utils.module.css";

async function getContent() {
  const introData = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/home-page?populate=introduction.picture`
  );
  const tagsData = await fetcher(`${process.env.NEXT_PUBLIC_STRAPI_URL}/tags`);

  if (introData.data && tagsData.data) {
    const description = await markdownToHTML(
      introData.data.attributes.introduction.description
    );
    const picture =
      introData.data.attributes.introduction.picture.data[0].attributes.url;
    const tags = tagsData.data;
    return {
      description: description,
      picture: picture,
      tags: tags,
    };
  } else {
    if (introData.error && tagsData.error) {
      return {
        error: introData.error.message + " " + tagsData.error.message,
      };
    } else if (introData.error) {
      return {
        error: introData.error.message,
      };
    } else if (tagsData.error) {
      return {
        error: tagsData.error.message,
      };
    }
  }
}

async function HomePage() {
  const { description, picture, tags } = await getContent();
  return (
    <Wrapper>
      <Nav allThingsData />
      <Content home>
        <Image
          priority
          id={`${utilStyles.profilePicture}`}
          src={picture}
          width={300}
          height={300}
          alt="Picture of Henry Dashwood"
        />
        <div dangerouslySetInnerHTML={{ __html: description }} />
        <div className={utilStyles.socialBanner}>
          <Link href="https://github.com/HenryDashwood" target="_blank">
            <Image
              priority
              src="https://res.cloudinary.com/henrydashwood/image/upload/v1676510961/website-cms/index/github_qrrmcq.svg"
              width={50}
              height={50}
              alt="Github logo"
            />
          </Link>
          <Link
            href="https://www.linkedin.com/in/henry-dashwood-42497969/"
            target="_blank"
          >
            <Image
              priority
              src="https://res.cloudinary.com/henrydashwood/image/upload/v1676510961/website-cms/index/linkedin_ipkort.svg"
              width={50}
              height={50}
              alt="LinkedIn logo"
            />
          </Link>
          <Link href="https://twitter.com/hcndashwood" target="_blank">
            <Image
              priority
              src="https://res.cloudinary.com/henrydashwood/image/upload/v1676510961/website-cms/index/twitter_tt3pql.svg"
              width={50}
              height={50}
              alt="Twitter logo"
            />
          </Link>
          <Link href="/feed.xml" target="_blank">
            <Image
              priority
              src="https://res.cloudinary.com/henrydashwood/image/upload/v1717438680/rss_81837ee370.svg"
              width={50}
              height={50}
              alt="RSS feed"
            />
          </Link>
        </div>
        <LinkBoxContainer>
          {tags &&
            tags.map((tag) => (
              <LinkBox key={tag.id} title={tag.attributes.name} />
            ))}
        </LinkBoxContainer>
      </Content>
    </Wrapper>
  );
}

export default HomePage;
