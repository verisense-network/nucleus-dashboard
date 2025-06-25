import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  try {
    const agentJsonUrl = `${endpoint}/.well-known/agent.json`;
    
    const response = await fetch(agentJsonUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Nucleus-Dashboard/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to get agent.json: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error getting agent.json:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      return NextResponse.json({ error: `Network error: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 