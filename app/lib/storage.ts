import { Dataset, LabelSet, Label } from './types';

class Storage {
  private datasets: Map<string, Dataset>;
  private labelSets: Map<string, Map<string, LabelSet>>;

  constructor() {
    this.datasets = new Map();
    this.labelSets = new Map();
  }

  generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  createDataset(conversations: string[]): string {
    const id = this.generateId();
    this.datasets.set(id, { id, conversations });
    this.labelSets.set(id, new Map());
    return id;
  }

  getDataset(id: string): Dataset | undefined {
    return this.datasets.get(id);
  }

  getAllDatasetIds(): string[] {
    return Array.from(this.datasets.keys());
  }

  createLabelSet(datasetId: string, labels: Label[]): string {
    const id = this.generateId();
    const datasetLabelSets = this.labelSets.get(datasetId);
    if (!datasetLabelSets) throw new Error('Dataset not found');

    datasetLabelSets.set(id, {
      id,
      labels,
      annotations: []
    });
    return id;
  }

  getLabelSet(datasetId: string, labelSetId: string): LabelSet | undefined {
    return this.labelSets.get(datasetId)?.get(labelSetId);
  }

  getAllLabelSetIds(datasetId: string): string[] {
    return Array.from(this.labelSets.get(datasetId)?.keys() || []);
  }

  updateLabelSetAnnotations(
    datasetId: string,
    labelSetId: string,
    annotations: Array<{ label: string; reason: string }>
  ): void {
    const labelSet = this.labelSets.get(datasetId)?.get(labelSetId);
    if (!labelSet) throw new Error('Label set not found');

    labelSet.annotations = annotations;
  }
}

type FilterResult = {
  conversations: string[];
  annotations: Array<{ label: string; reason: string }>;
};

export function filterDatasetByLabel(
  conversations: string[],
  annotations: Array<{ label: string; reason: string }>,
  filterLabel: string
): FilterResult {
  const filteredIndexes = annotations
    .map((ann, index) => ann.label === filterLabel ? index : -1)
    .filter(index => index !== -1);

  return {
    conversations: filteredIndexes.map(index => conversations[index]),
    annotations: filteredIndexes.map(index => annotations[index])
  };
}

export const storage = new Storage();