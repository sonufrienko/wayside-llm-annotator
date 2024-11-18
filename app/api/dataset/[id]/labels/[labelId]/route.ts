import { NextRequest } from 'next/server';
import { storage } from '@/app/lib/storage';
import { filterDatasetByLabel } from '@/app/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const { id, labelId } = await params;
    const labelSet = storage.getLabelSet(id, labelId);

    if (!labelSet) {
      return Response.json(
        { error: 'Label set not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filterLabel = searchParams.get('label');

    if (!filterLabel) {
      return Response.json(labelSet);
    }

    const dataset = storage.getDataset(id);
    if (!dataset) {
      return Response.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    const filteredData = filterDatasetByLabel(
      dataset.conversations,
      labelSet.annotations,
      filterLabel
    );

    return Response.json({
      ...labelSet,
      filtered_conversations: filteredData
    });
  } catch (error) {
    console.error('Failed to retrieve label set', error);
    return Response.json(
      { error: 'Failed to retrieve label set' },
      { status: 500 }
    );
  }
}