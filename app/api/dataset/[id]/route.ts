import { NextRequest } from 'next/server';
import { storage } from '@/app/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    console.log("id", id);
    const dataset = storage.getDataset(id);

    if (!dataset) {
      return Response.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return Response.json(dataset);
  } catch (error) {
    console.error("Failed to retrieve dataset", error);
    return Response.json(
      { error: 'Failed to retrieve dataset' },
      { status: 500 }
    );
  }
}