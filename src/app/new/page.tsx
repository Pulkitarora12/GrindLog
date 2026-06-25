import { getSeries, getTracks, getEntryById } from "../actions";
import EntryForm from "./EntryForm";

interface NewEntryPageProps {
  searchParams: Promise<{
    edit?: string;
    date?: string;
    seriesId?: string;
  }>;
}

export const revalidate = 0; // Disable static cache to reflect instant database updates

export default async function NewEntryPage({ searchParams }: NewEntryPageProps) {
  const params = await searchParams;
  const editId = params.edit;
  const defaultDate = params.date;
  const defaultSeriesId = params.seriesId;

  // Parallel fetch: Series lists, Track lists, and any edit payload
  const [series, tracks, editingEntryRaw] = await Promise.all([
    getSeries(),
    getTracks(),
    editId ? getEntryById(editId) : Promise.resolve(null),
  ]);

  // Format editingEntry type to fit the client component props requirements
  const editingEntry = editingEntryRaw
    ? {
        id: editingEntryRaw.id,
        date: editingEntryRaw.date,
        title: editingEntryRaw.title,
        content: editingEntryRaw.content,
        seriesId: editingEntryRaw.seriesId,
        seriesDay: editingEntryRaw.seriesDay,
        subtopics: editingEntryRaw.subtopics.map((s) => ({ id: s.id })),
        tags: editingEntryRaw.tags,
      }
    : null;

  return (
    <EntryForm
      seriesList={series.map((s) => ({ id: s.id, name: s.name }))}
      tracksList={tracks.map((t) => ({
        id: t.id,
        name: t.name,
        subtopics: t.subtopics.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
        })),
      }))}
      editingEntry={editingEntry}
      defaultDate={defaultDate}
      defaultSeriesId={defaultSeriesId}
    />
  );
}
