export interface EntryImageView {
  id: string;
  url: string;
}

export interface DayEntryView {
  id: string;
  text: string;
  seriesName: string | null;
  images: EntryImageView[];
}

export interface HeatmapDay {
  count: number; // heat level 1-4
  entries: DayEntryView[];
}

export type HeatmapData = Record<string, HeatmapDay>;

export interface NewEntryInput {
  text: string;
  seriesId: string | null;
  images: { url: string; publicId: string }[];
}
