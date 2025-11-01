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
    <div className="bg-nav-background font-mallory-book p-4 sm:flex sm:min-h-screen sm:w-70 sm:flex-col">
      <div className="mb-4">
        <Link href={`/`} className="break-normal whitespace-normal">
          <b>Home</b>
        </Link>
      </div>
      <div className="mb-4">
        <Link href={`/posts`} className="break-normal whitespace-normal">
          Blog Posts
        </Link>
      </div>
      {navLinks.map(({ name, path }, key) => (
        <div className="mb-4" key={key}>
          <Link href={`/posts/${path}`} className="break-normal whitespace-normal">
            {name}
          </Link>
        </div>
      ))}
      <div className="mb-4">
        <Link href={`https://data-science-notes.henrydashwood.com`} className="break-normal whitespace-normal">
          Data Science Notes
        </Link>
      </div>
      <div className="mb-4">
        <Link href={`https://gen-ai-notes.henrydashwood.com`} className="break-normal whitespace-normal">
          Generative AI Notes
        </Link>
      </div>
    </div>
  );
}

export default Nav;
