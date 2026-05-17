import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) return NextResponse.json({ results: [] });

    const res = await fetch(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(q)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error('Screener search failed');

    const data = await res.json();
    // data is like { value: [ { id, name, url } ] }
    const results = (data.value || []).map((v: any) => {
      // url is like "/company/RELIANCE/consolidated/"
      const symbol = v.url.split('/')[2];
      return {
        id: v.id,
        name: v.name,
        symbol: symbol
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search proxy error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
