"use client";

import Content from "../Content";
import Date from "../Date";
import utilStyles from "../../styles/utils.module.css";

function PostContent({ title, published, content, tags }) {
  return (
    <Content>
      <h1 className={utilStyles.headingXl}>{title}</h1>
      <div className={utilStyles.lightText}>
        <Date dateString={published} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <div className={utilStyles.lightText}>Tags: {tags}</div>
    </Content>
  );
}

export default PostContent;
