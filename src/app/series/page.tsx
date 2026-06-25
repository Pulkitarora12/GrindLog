import { getSeries } from "../actions";
import SeriesClient from "./SeriesClient";

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function SeriesPage() {
  const series = await getSeries();
  return <SeriesClient initialSeries={series} />;
}
