import { getTracks } from "../actions";
import TracksClient from "./TracksClient";

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function TracksPage() {
  const tracks = await getTracks();

  // Cast prisma types to match the client component requirements
  const formattedTracks = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    subtopics: track.subtopics.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status as any,
      completedAt: s.completedAt,
    })),
  }));

  return <TracksClient initialTracks={formattedTracks} />;
}
