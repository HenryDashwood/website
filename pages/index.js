import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Content, { siteTitle } from "../components/content";
import contentStyles from "../components/content.module.css";
import NavBar from "../components/nav";
import Wrapper from "../components/wrapper";

export default function Home() {
  return (
    <Wrapper>
      <NavBar allThingsData />
      <Content home>
        <Head>
          <title>{siteTitle}</title>
        </Head>
        <div className={contentStyles.imgContainer}>
          <Image
            priority
            src="/images/index/profile.jpg"
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
            <Image
              priority
              src="/images/index/github.svg"
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
            <Image
              priority
              src="/images/index/linkedin.svg"
              className={contentStyles.displayImg}
              height={50}
              width={50}
              alt="LinkedIn logo"
            />
          </Link>
          <Link href="https://twitter.com/hcndashwood" target="_blank">
            <Image
              priority
              src="/images/index/twitter.svg"
              className={contentStyles.displayImg}
              height={50}
              width={50}
              alt="Twitter logo"
            />
          </Link>
        </div>
      </Content>
    </Wrapper>
  );
}
