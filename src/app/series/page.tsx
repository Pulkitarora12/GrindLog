import { getSeries } from "../actions";
import SeriesClient from "./SeriesClient";
import { isAuthorized } from "@/lib/auth";

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function SeriesPage() {
  const [series, isAdmin] = await Promise.all([
    getSeries(),
    isAuthorized(),
  ]);

  return <SeriesClient initialSeries={series} isAdmin={isAdmin} />;
}
