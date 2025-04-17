import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { generateMockResource, generateInitialMockData } from '@/utils/mockData';

// Sample resources data 
let resources = [
  {
    resourceId: '1',
    name: 'Kalinga Stadium Relief Camp',
    category: 'shelter',
    description: 'Main relief camp with basic amenities',
    address: 'Kalinga Stadium, Bhubaneswar',
    coordinates: { latitude: 20.2961, longitude: 85.8245 },
    contactInfo: { phone: '0674-2301525' },
    operationalStatus: 'operational',
    capacity: { total: 500, available: 230 },
    lastUpdated: '2023-06-15T08:30:00Z'
  },
  {
    resourceId: '2',
    name: 'AIIMS Bhubaneswar',
    category: 'hospital',
    description: 'Full service hospital with emergency facilities',
    address: 'Sijua, Patrapada, Bhubaneswar',
    coordinates: { latitude: 20.2467, longitude: 85.7743 },
    contactInfo: { phone: '0674-2476789' },
    operationalStatus: 'operational',
    capacity: { total: 100, available: 35 },
    lastUpdated: '2023-06-15T10:15:00Z'
  },
  {
    resourceId: '3',
    name: 'Central School Shelter',
    category: 'shelter',
    description: 'Temporary shelter with basic facilities',
    address: 'Unit-9, Bhubaneswar',
    coordinates: { latitude: 20.2758, longitude: 85.8417 },
    contactInfo: { phone: '0674-2550534' },
    operationalStatus: 'limited',
    capacity: { total: 300, available: 75 },
    lastUpdated: '2023-06-15T09:45:00Z'
  }
];

// In-memory storage for development
let mockResources = generateInitialMockData().resources;

// GET /api/resources
export async function GET(request) {
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json(mockResources);
  }

  return Response.json(resources);
}

// POST /api/resources
export async function POST(request) {
  try {
    const body = await request.json();

    if (process.env.NODE_ENV === 'development') {
      const newResource = {
        ...generateMockResource(),
        ...body,
        resourceId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };
      mockResources.push(newResource);
      return NextResponse.json(newResource);
    }

    const resource = {
      resourceId: uuidv4(),
      ...body,
      lastUpdated: new Date().toISOString()
    };

    resources.push(resource);
    return Response.json(resource, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}

// PUT /api/resources/:resourceId
export async function PUT(request) {
  const body = await request.json();
  const { resourceId } = body;

  const index = resources.findIndex(r => r.resourceId === resourceId);
  if (index === -1) {
    return Response.json({ error: 'Resource not found' }, { status: 404 });
  }

  resources[index] = {
    ...resources[index],
    ...body,
    lastUpdated: new Date().toISOString()
  };

  return Response.json(resources[index]);
}

// DELETE /api/resources/:resourceId
export async function DELETE(request) {
  const url = new URL(request.url);
  const resourceId = url.searchParams.get('resourceId');

  const index = resources.findIndex(r => r.resourceId === resourceId);
  if (index === -1) {
    return Response.json({ error: 'Resource not found' }, { status: 404 });
  }

  const deletedResource = resources[index];
  resources.splice(index, 1);

  return Response.json(deletedResource);
}

// PATCH /api/resources/:resourceId
export async function PATCH(request) {
  if (process.env.NODE_ENV === 'development') {
    try {
      const url = new URL(request.url);
      const resourceId = url.searchParams.get('resourceId');
      const updates = await request.json();

      const resourceIndex = mockResources.findIndex(r => r.resourceId === resourceId);
      if (resourceIndex === -1) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }

      mockResources[resourceIndex] = {
        ...mockResources[resourceIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json(mockResources[resourceIndex]);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to update resource' },
        { status: 500 }
      );
    }
  }

  // Production code
  return Response.json({ error: 'PATCH method not implemented in production' }, { status: 501 });
}