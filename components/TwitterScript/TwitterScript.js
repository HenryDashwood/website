import Script from "next/script";

function TwitterScript({ hasTwitterEmbed }) {
  if (!hasTwitterEmbed) return null;

  return (
    <Script
      src="https://platform.twitter.com/widgets.js"
      strategy="lazyOnload"
    />
  );
}

export default TwitterScript;
