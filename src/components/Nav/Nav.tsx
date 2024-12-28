import Link from "next/link";

const navLinks = [
  {
    name: "Weltanschauung",
    path: "weltanschauung",
  },
  {
    name: "Books",
    path: "books",
  },
  {
    name: "Publications",
    path: "publications",
  },
];

function Nav() {
  return (
    <div className="sm:flex sm:flex-col sm:min-h-screen bg-navBackground p-4 font-malloryBook">
      <div className="mb-4">
        <Link href={`/`}>
          <b>Home</b>
        </Link>
      </div>
      <div className="mb-4">
        <Link href={`/posts`}>Blog Posts</Link>
      </div>
      {navLinks.map(({ name, path }, key) => (
        <div className="mb-4" key={key}>
          <Link href={`/posts/${path}`}>{name}</Link>
        </div>
      ))}
      <div className="mb-4">
        <Link href={`https://data-science-notes.henrydashwood.com`}>
          Data Science Notes
        </Link>
      </div>
      <div className="mb-4">
        <Link href={`https://gen-ai-notes.henrydashwood.com`}>
          Generative AI Notes
        </Link>
      </div>
    </div>
  );
}

export default Nav;
