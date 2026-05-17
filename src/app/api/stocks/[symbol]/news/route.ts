import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const resolvedParams = await params;
    let symbol = resolvedParams.symbol;
    if (symbol.includes('.')) symbol = symbol.split('.')[0];

    const url = `https://news.google.com/rss/search?q=${symbol}+stock+india+news&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(url);
    const xml = await res.text();

    const parser = new XMLParser();
    const parsed = parser.parse(xml);
    const items = parsed.rss?.channel?.item || [];
    
    // Format to a clean array
    const news = (Array.isArray(items) ? items : [items]).slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source || 'News Source'
    }));

    return NextResponse.json(news);
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
