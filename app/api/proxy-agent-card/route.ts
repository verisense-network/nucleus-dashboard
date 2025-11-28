import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  try {
    let agentJsonUrl = endpoint;
    if (!endpoint.toLowerCase().endsWith('.json')) {
      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      agentJsonUrl = `${baseUrl}/.well-known/agent.json`;
    }
    
    const data = await new Promise((resolve, reject) => {
      const url = new URL(agentJsonUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(agentJsonUrl, {
        headers: {
          'User-Agent': 'Nucleus-Dashboard/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        rejectUnauthorized: false, // Ignore SSL certificate errors
        timeout: 10000,
      }, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          res.resume();
          const error = new Error(`Failed to get agent.json: ${res.statusCode} ${res.statusMessage}`);
          (error as { status?: number }).status = res.statusCode;
          reject(error);
          return;
        }

        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
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
      if (error.name === 'AbortError' || error.message === 'Request timeout') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      const status = (error as { status?: number }).status || 500;
      return NextResponse.json({ error: `Network error: ${error.message}` }, { status });
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