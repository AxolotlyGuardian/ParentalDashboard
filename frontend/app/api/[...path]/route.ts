import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
) {
  const apiPath = path.join('/');
  const url = `${BACKEND_URL}/api/${apiPath}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!key.toLowerCase().startsWith('host') && 
        !key.toLowerCase().startsWith('connection')) {
      headers[key] = value;
    }
  });

  let body = null;
  if (method !== 'GET') {
    try {
      body = await request.text();
    } catch (e) {
      // No body
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Backend unavailable' },
      { status: 503 }
    );
  }
}
