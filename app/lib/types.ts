export interface Dataset {
  id: string;
  conversations: string[];
}

export interface Label {
  label: string;
  description: string;
}

export interface LabelSet {
  id: string;
  labels: Label[];
  annotations: Array<{
    label: string;
    reason: string;
  }>;
}