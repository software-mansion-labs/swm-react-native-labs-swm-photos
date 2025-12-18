import { ImageEmbeddingsModule } from "react-native-executorch";
import type { Embeddings, ResourceSource } from "react-native-rag";

type ExecuTorchImageEmbeddingsParams = {
  model: {
    modelSource: ResourceSource;
  };
  onDownloadProgress?: (progress: number) => void;
};

/**
 * Wrapper of react-native-executorch's ImageEmbeddings
 * so these are compatible with react-native-rag interface
 * and can be passed to VectorStore
 */
export class ExecuTorchImageEmbeddings implements Embeddings {
  private model: { modelSource: ResourceSource };
  private onDownloadProgress: (progress: number) => void;
  private module: ImageEmbeddingsModule;

  private isLoaded = false;

  constructor({
    model,
    onDownloadProgress = () => {},
  }: ExecuTorchImageEmbeddingsParams) {
    this.model = model;
    this.onDownloadProgress = onDownloadProgress;

    this.module = new ImageEmbeddingsModule();
  }

  async load() {
    if (!this.isLoaded) {
      await this.module.load(this.model, this.onDownloadProgress);
      this.isLoaded = true;
    }
    return this;
  }

  async unload() {
    this.module.delete();
  }

  async embed(imageSource: string): Promise<number[]> {
    return Array.from(await this.module.forward(imageSource));
  }
}
