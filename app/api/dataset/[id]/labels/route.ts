import { NextRequest } from 'next/server';
import { storage } from '@/app/lib/storage';
import { analyzeLabeledContent } from '@/app/lib/labelAnalyzer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const labels = await request.json();

    if (!Array.isArray(labels) || !labels.every(isValidLabel)) {
      return Response.json(
        { error: 'Invalid labels format' },
        { status: 400 }
      );
    }

    const id = (await params).id;
    const dataset = storage.getDataset(id);
    if (!dataset) {
      return Response.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    const labelSetId = storage.createLabelSet(id, labels);
    const annotations = await analyzeLabeledContent(dataset.conversations, labels);

    storage.updateLabelSetAnnotations(id, labelSetId, annotations);

    return Response.json({ id: labelSetId, labels, annotations });
  } catch (error) {
    console.error("Failed to create labels", error);
    return Response.json(
      { error: 'Failed to create labels' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const labelSetIds = storage.getAllLabelSetIds(id);

    if (!labelSetIds) {
      return Response.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return Response.json({ ids: labelSetIds });
  } catch (error) {
    console.error("Failed to retrieve label sets", error);
    return Response.json(
      { error: 'Failed to retrieve label sets' },
      { status: 500 }
    );
  }
}

function isValidLabel(label: any): boolean {
  return (
    typeof label === 'object' &&
    typeof label.label === 'string' &&
    typeof label.description === 'string'
  );
}

