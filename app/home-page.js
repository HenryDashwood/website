"use client";

import { CldImage } from "next-cloudinary";
import Link from "next/link";
import Content from "../components/Content";
import contentStyles from "../components/Content/Content.module.css";
import Nav from "../components/Nav";
import Wrapper from "../components/Wrapper";
import LinkBox from "../components/LinkBox";
import LinkBoxContainer from "../components/LinkBoxContainer";
import { fetcher } from "../lib/api";
import useSWR from "swr";

function HomePage() {
  const { data: tagsData, error } = useSWR(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/tags`,
    fetcher
  );
  return (
    <Wrapper>
      <Nav allThingsData />
      <Content home>
        <div className={contentStyles.imgContainer}>
          <CldImage
            priority
            src="https://res.cloudinary.com/henrydashwood/image/upload/v1676510963/website-cms/index/profile_y62uzm.jpg"
            className={contentStyles.displayImg}
            height={300}
            width={300}
            alt="A photo of Henry Dashwood"
          />
        </div>
        <section>
          <p>
            Hello. My name is Henry Dashwood. This is my website. I am from
            originally from Northamptonshire. I currently work as a machine
            learning engineer in London. This website is still fairly new.
          </p>
          <p>
            A lot of people I admire are very good writers. I am still thinking
            about what I should write. I will probably use this website as a way
            of forcing myself to understand things more deeply by committing
            them to the page, or should that be to the .md file?
          </p>
        </section>
        <div className={contentStyles.socialBanner}>
          <Link href="https://github.com/HenryDashwood" target="_blank">
            <CldImage
              priority
              src="https://res.cloudinary.com/henrydashwood/image/upload/v1676510961/website-cms/index/github_qrrmcq.svg"
              className={contentStyles.displayImg}
              height={50}
              width={50}
              alt="Github logo"
            />
          </Link>
          <Link
            href="https://www.linkedin.com/in/henry-dashwood-42497969/"
            target="_blank"
          >
            <CldImage
              priority
              src="https://res.cloudinary.com/henrydashwood/image/upload/v1676510961/website-cms/index/linkedin_ipkort.svg"
              className={contentStyles.displayImg}
              height={50}
              width={50}
              alt="LinkedIn logo"
            />
          </Link>
          <Link href="https://twitter.com/hcndashwood" target="_blank">
            <CldImage
              priority
              src="https://res.cloudinary.com/henrydashwood/image/upload/v1676510961/website-cms/index/twitter_tt3pql.svg"
              className={contentStyles.displayImg}
              height={50}
              width={50}
              alt="Twitter logo"
            />
          </Link>
        </div>
        <LinkBoxContainer>
          {tagsData &&
            tagsData.data.map((tag) => (
              <LinkBox key={tag.id} title={tag.attributes.name} />
            ))}
        </LinkBoxContainer>
      </Content>
    </Wrapper>
  );
}

export default HomePage;
