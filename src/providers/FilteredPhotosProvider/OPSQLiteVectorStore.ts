import { open, type DB } from "@op-engineering/op-sqlite";
import * as MediaLibrary from "expo-media-library";
import { type Embeddings, type VectorStore } from "react-native-rag";

export type OPSQLiteVectorStoreParams = {
  name: string;
  embeddings: Embeddings;
};

export class OPSQLiteVectorStore implements VectorStore {
  private name: string;
  private embeddings: Embeddings;

  db: DB;

  constructor({ name, embeddings }: OPSQLiteVectorStoreParams) {
    this.name = name;
    this.embeddings = embeddings;
    this.db = open({
      name: this.name,
    });
  }

  async load() {
    await this.embeddings.load();
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS vectors (
          image_uri TEXT PRIMARY KEY,
          embedding F32_BLOB(512) NOT NULL,
          metadata JSON DEFAULT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_vectors_embedding ON vectors(
          libsql_vector_idx(embedding, 'compress_neighbors=float8', 'max_neighbors=100')
      );
    `);
    return this;
  }

  async unload() {
    await this.embeddings.unload();
    this.db.close();
  }

  async add(image_uri: string, metadata?: Record<string, any>) {
    try {
      const response = await this.db.execute(
        "SELECT image_uri FROM vectors WHERE image_uri = ?",
        [image_uri],
      );
      // return early if this record already exists
      if (response.rows.length > 0) {
        return "already_exists";
      }

      let filePrefixURI = "";
      if (image_uri.startsWith("ph://")) {
        const localUri = (
          await MediaLibrary.getAssetInfoAsync(image_uri.slice(5))
        ).localUri;
        if (!localUri) {
          throw new Error(`Could not get local URI for image: ${image_uri}`);
        }
        filePrefixURI = localUri;
      } else {
        filePrefixURI = image_uri;
      }

      const embedding = await this.embeddings.embed(filePrefixURI);
      await this.db.execute(
        "INSERT INTO vectors(image_uri, embedding, metadata) VALUES (?, vector(?), ?)",
        [image_uri, `[${embedding.join(",")}]`, JSON.stringify(metadata)],
      );
      // compatibility...
      return "success";
    } catch (e) {
      logger.filteredPhotos.error("SQL Vectore store add error.", e);
      return "";
    }
  }

  async delete(image_uri: string) {
    const response = await this.db.execute(
      "SELECT image_uri FROM vectors WHERE image_uri = ?",
      [image_uri],
    );
    if (response.rows.length > 0) {
      await this.db.execute("DELETE FROM vectors WHERE image_uri = ?", [
        image_uri,
      ]);
    } else {
      throw new Error(`Document with image_uri ${image_uri} does not exist.`);
    }
  }

  // kept for compatibility reasons
  async update(id: string, document?: string, metadata?: Record<string, any>) {
    return;
  }

  // kept for compatibility reasons
  async similaritySearch(query: string, k: number = 3) {
    return [];
  }

  async similaritySearchWithOwnEmbedding(
    queryEmbedding: number[],
    similarityThreshold: number,
  ) {
    const distanceThreshold = 1 - similarityThreshold;
    const vectorStr = `[${queryEmbedding.join(",")}]`;
    try {
      const results = await this.db.execute(
        `
        SELECT  image_uri, vector_distance_cos(embedding, vector(?)) as cosine_distance, metadata
        FROM vectors
        WHERE cosine_distance < ?
        ORDER BY cosine_distance ASC
      `,
        [vectorStr, distanceThreshold],
      );
      return results.rows.map((row) => {
        const image_uri = row.image_uri as string;
        const metadata = row.metadata
          ? (JSON.parse(row.metadata as string) as Record<string, any>)
          : undefined;
        const similarity = 1 - (row.cosine_distance as number); // Convert cosine distance to similarity
        return { image_uri, metadata, similarity };
      });
    } catch (e) {
      logger.filteredPhotos.error(
        "SQL Vector store similarity search error.",
        e,
      );
      return [];
    }
  }

  async clearTable() {
    await this.db.execute("DELETE FROM vectors;");
  }

  async deleteVectorStore() {
    await this.db.execute("DROP TABLE IF EXISTS vectors;");
  }
}
