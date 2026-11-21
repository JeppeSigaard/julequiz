import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { clean, maskPrices, truncate } from "./listingText.mjs";

const root = new URL("..", import.meta.url);
const path = (relative) => fileURLToPath(new URL(relative, root));

const QUERY = `query Search($filters: SearchFiltersInput!, $pagination: PaginationInput!) {
  search(filters: $filters, pagination: $pagination) {
    listings {
      id
      title
      description
      url
      price { raw }
      auction { id }
      images(take: 1) { url(size: Listing1280) }
    }
  }
}`;

const FILES = ["14-pris-1.tsx", "15-pris-2.tsx", "16-pris-3.tsx", "21-pris-4.tsx"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function fetchPage(page) {
  const response = await fetch("https://api.guloggratis.dk/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: { filters: { term: "jul", hasImages: true }, pagination: { page, perPage: 60 } },
    }),
  });
  const text = await response.text();
  if (response.status !== 200) {
    fail(response.status + " " + JSON.stringify(text.slice(0, 300)));
  }
  const json = JSON.parse(text);
  if (json.errors) {
    fail(response.status + " " + JSON.stringify(text.slice(0, 300)));
  }
  return json.data.search.listings;
}

async function fetchImage(imageUrl) {
  if (new URL(imageUrl).protocol !== "https:") {
    fail("Billed-URL er ikke https: " + JSON.stringify(imageUrl));
  }
  const response = await fetch(imageUrl);
  if (response.status !== 200) {
    fail("Billedet kunne ikke hentes: " + response.status + " " + JSON.stringify(imageUrl));
  }
  if (new URL(response.url).protocol !== "https:") {
    fail("Billedet blev omdirigeret til en url, der ikke er https: " + JSON.stringify(response.url));
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    fail("Billedet har forkert content-type: " + JSON.stringify(contentType));
  }
  if (Number(response.headers.get("content-length")) > MAX_IMAGE_BYTES) {
    fail("Billedet er over 5 MB: " + JSON.stringify(imageUrl));
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    fail("Billedet er over 5 MB: " + JSON.stringify(imageUrl));
  }
  return buffer;
}

const listings = [];
for (const page of [1, 2, 3]) {
  listings.push(...(await fetchPage(page)));
}

const seen = new Set();
const candidates = listings.filter((listing) => {
  const raw = listing.price?.raw;
  if (seen.has(listing.id)) {
    return false;
  }
  seen.add(listing.id);
  return (
    typeof raw === "number" &&
    raw >= 5000 &&
    raw <= 1000000 &&
    listing.auction === null &&
    listing.images.length > 0 &&
    clean(listing.description ?? "").length >= 40
  );
});

if (candidates.length < 4) {
  fail("Kun " + candidates.length + " kandidater, der skal bruges mindst 4");
}

for (let i = candidates.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
}

const picked = candidates.slice(0, 4).map((listing) => {
  // API'ets pris er i øre
  const kroner = Math.round(listing.price.raw / 100);
  return {
    url: listing.url,
    imageUrl: listing.images.at(0).url,
    title: truncate(maskPrices(clean(listing.title), kroner), 44),
    description: truncate(maskPrices(clean(listing.description), kroner), 150),
    price: kroner.toLocaleString("da-DK") + " kr.",
  };
});

const images = [];
for (const item of picked) {
  images.push(await fetchImage(item.imageUrl));
}

await mkdir(path("public/quizzes/gg26/images"), { recursive: true });
for (const [index, image] of images.entries()) {
  await writeFile(path("public/quizzes/gg26/images/gg-pris-" + (index + 1) + ".webp"), image);
}

for (const [index, item] of picked.entries()) {
  const file = FILES[index];
  const source =
    'import { type QuestionSpec } from "../../../types";\n' +
    "const question: QuestionSpec = {\n" +
    '  type: "priceGuess",\n' +
    "  image: " + JSON.stringify("/quizzes/gg26/images/gg-pris-" + (index + 1) + ".webp") + ",\n" +
    "  title: " + JSON.stringify(item.title) + ",\n" +
    "  description: " + JSON.stringify(item.description) + ",\n" +
    "  price: " + JSON.stringify(item.price) + ",\n" +
    "};\n\n" +
    "export default question;\n";
  await writeFile(path("src/quizzes/gg26/questions/" + file), source);
  const link = JSON.stringify("https://www.guloggratis.dk" + item.url);
  console.log(file + " | " + item.title + " | " + item.price + " | " + link);
}
