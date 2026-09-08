import HomeView from "@/components/home/HomeView";
import { getFestivalEventsData } from "@/domain/events/service";

export default async function HomePage() {
  // Build-time seed for instant paint and SEO; the browser refreshes it live.
  const seed = await getFestivalEventsData();
  return <HomeView seed={seed} />;
}
