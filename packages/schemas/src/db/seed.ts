import { count } from "drizzle-orm";
import { createDatabase, schema } from "./index.js";

export async function seedDefaultTemplates(databaseUrl: string) {
  const db = createDatabase(databaseUrl);
  const [existing] = await db.select({ count: count() }).from(schema.templates);
  if (existing && existing.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  await db.insert(schema.templates).values([
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Karaoke Highlight",
      compositionId: "KaraokeHighlight",
      description: "Centered lyrics with active word highlight",
      defaultParams: {
        primaryColor: "#ffffff",
        secondaryColor: "#ffcc00",
        fontFamily: "Inter, sans-serif",
        fontSize: 56,
      },
      createdAt: now,
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Scroll Lyrics",
      compositionId: "ScrollLyrics",
      description: "Vertical scrolling lyrics with fade transitions",
      defaultParams: {
        primaryColor: "#ffffff",
        secondaryColor: "#a0a0ff",
        fontFamily: "Inter, sans-serif",
        fontSize: 42,
      },
      createdAt: now,
    },
  ]);
}
