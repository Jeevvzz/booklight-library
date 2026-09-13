import { drizzle } from "drizzle-orm/mysql2";
import { badges, books } from "../drizzle/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const db = drizzle(databaseUrl);

const bookSeeds = [
  { title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474", genre: "Fiction", description: "A story about the infinite possibilities of one life and the choices that shape it.", totalCopies: 4, availableCopies: 4, moodTags: JSON.stringify(["hopeful", "reflective", "magical"]), avgRating: 470, totalPages: 304 },
  { title: "Project Hail Mary", author: "Andy Weir", isbn: "9780593135204", genre: "Sci-Fi", description: "A lone astronaut must save humanity and the planet from an extinction-level threat.", totalCopies: 3, availableCopies: 3, moodTags: JSON.stringify(["adventurous", "clever", "uplifting"]), avgRating: 480, totalPages: 496 },
  { title: "The Thursday Murder Club", author: "Richard Osman", isbn: "9781984880963", genre: "Mystery", description: "Four friends in a peaceful retirement village investigate a real killer.", totalCopies: 2, availableCopies: 2, moodTags: JSON.stringify(["witty", "cozy", "intriguing"]), avgRating: 450, totalPages: 336 },
  { title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", genre: "Self-help", description: "A practical framework for building good habits and breaking bad ones.", totalCopies: 5, availableCopies: 5, moodTags: JSON.stringify(["focused", "practical", "energizing"]), avgRating: 480, totalPages: 320 },
  { title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", isbn: "9781571313560", genre: "Nature", description: "Indigenous wisdom, scientific knowledge, and the teachings of plants.", totalCopies: 2, availableCopies: 2, moodTags: JSON.stringify(["grounding", "wonder-filled", "slow"]), avgRating: 490, totalPages: 408 },
  { title: "The Creative Act", author: "Rick Rubin", isbn: "9780593652886", genre: "Creativity", description: "A generous field guide to the creative process from a legendary producer.", totalCopies: 3, availableCopies: 3, moodTags: JSON.stringify(["inspiring", "curious", "open"]), avgRating: 460, totalPages: 432 },
  { title: "Dune", author: "Frank Herbert", isbn: "9780441172719", genre: "Sci-Fi", description: "A sweeping epic of ecology, politics, and destiny on the desert planet Arrakis.", totalCopies: 4, availableCopies: 4, moodTags: JSON.stringify(["epic", "political", "immersive"]), avgRating: 470, totalPages: 688 },
  { title: "The Name of the Rose", author: "Umberto Eco", isbn: "9780156001311", genre: "Historical Mystery", description: "A monk investigates a series of murders in a remote fourteenth-century abbey.", totalCopies: 2, availableCopies: 2, moodTags: JSON.stringify(["atmospheric", "scholarly", "dark"]), avgRating: 440, totalPages: 512 },
  { title: "The Psychology of Money", author: "Morgan Housel", isbn: "9780857197689", genre: "Finance", description: "Timeless lessons on wealth, greed, risk, and making better financial decisions.", totalCopies: 3, availableCopies: 3, moodTags: JSON.stringify(["clear", "thoughtful", "practical"]), avgRating: 450, totalPages: 256 },
  { title: "A Psalm for the Wild-Built", author: "Becky Chambers", isbn: "9781250236210", genre: "Cozy Sci-Fi", description: "A tea monk and a robot meet on a gentle journey toward a better future.", totalCopies: 3, availableCopies: 3, moodTags: JSON.stringify(["gentle", "hopeful", "comforting"]), avgRating: 480, totalPages: 160 },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", isbn: "9780593396565", genre: "Fiction", description: "A decades-spanning friendship built through the games we play and the worlds we create.", totalCopies: 3, availableCopies: 3, moodTags: JSON.stringify(["emotional", "creative", "nostalgic"]), avgRating: 450, totalPages: 416 },
  { title: "The Book of Delights", author: "Ross Gay", isbn: "9781616207922", genre: "Essays", description: "Short essays that practice attention to the ordinary joys of daily life.", totalCopies: 2, availableCopies: 2, moodTags: JSON.stringify(["joyful", "observant", "warm"]), avgRating: 460, totalPages: 288 },
];

const badgeSeeds = [
  { name: "First Book", description: "Borrow and finish your first book.", iconUrl: "book-open", points: 50 },
  { name: "7-Day Streak", description: "Read for seven consecutive days.", iconUrl: "flame", points: 100 },
  { name: "Bookworm", description: "Read ten books in your Booklight journey.", iconUrl: "library", points: 250 },
  { name: "Reviewer", description: "Submit your first thoughtful book review.", iconUrl: "message-circle", points: 75 },
  { name: "Room Leader", description: "Create and lead your first reading room.", iconUrl: "users", points: 150 },
  { name: "Night Owl", description: "Read after 10 PM on five different nights.", iconUrl: "moon", points: 125 },
];

await db.insert(books).values(bookSeeds).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
await db.insert(badges).values(badgeSeeds).onDuplicateKeyUpdate({ set: { description: badges.description } });

console.log(`Seeded ${bookSeeds.length} books and ${badgeSeeds.length} badges.`);
