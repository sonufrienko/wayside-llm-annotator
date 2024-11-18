import { NextRequest } from 'next/server';
import { storage } from '@/app/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!Array.isArray(data)) {
      return Response.json(
        { error: 'Invalid request body. Expected array of strings' },
        { status: 400 }
      );
    }

    const id = storage.createDataset(data);

    return Response.json({ id });
  } catch (error) {
    console.error('Failed to process request', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ids = storage.getAllDatasetIds();
    return Response.json({ ids });
  } catch (error) {
    console.error('Failed to retrieve datasets', error);
    return Response.json(
      { error: 'Failed to retrieve datasets' },
      { status: 500 }
    );
  }
}