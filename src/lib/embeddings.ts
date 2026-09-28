import { createHash } from "crypto";
import { getServerEnv } from "@/lib/env";

export async function createProfileEmbedding(text: string) {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) return createLocalEmbedding(text);

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: env.OPENAI_EMBEDDING_MODEL, input: text.slice(0, 50_000), dimensions: env.OPENAI_EMBEDDING_DIMENSIONS }),
  });
  if (!response.ok) throw new Error("Embedding provider failed");
  const result = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
  const embedding = result.data?.[0]?.embedding;
  if (!embedding?.length) throw new Error("Embedding provider returned no vector");
  return embedding;
}

function createLocalEmbedding(text: string) {
  const vector = new Array<number>(384).fill(0);
  for (const token of text.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? []) {
    const hash = createHash("sha256").update(token).digest();
    const index = hash.readUInt16BE(0) % vector.length;
    vector[index] += hash[2] % 2 === 0 ? 1 : -1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}
