import Head from "next/head";
import Image from "next/image";
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
        <Image
          priority
          src="/images/profile.jpg"
          className={contentStyles.displayImg}
          height={300}
          width={300}
          alt="A photo of Henry Dashwood"
        />
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
      </Content>
    </Wrapper>
  );
}
