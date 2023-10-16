import HomePage from "./home-page";

export const revalidate = 3600;

export default async function Page() {
  return <HomePage />;
}
