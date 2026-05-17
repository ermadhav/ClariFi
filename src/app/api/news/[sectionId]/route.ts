import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Simple Rule-Based Sentiment Analysis
function analyzeSentiment(text: string) {
  const lowerText = text.toLowerCase();
  const positiveWords = ['profit', 'gain', 'rise', 'surge', 'beat', 'upgrade', 'buy', 'expansion', 'growth', 'record high', 'breakthrough', 'jump', 'soar', 'rally', 'dividend', 'positive'];
  const negativeWords = ['loss', 'fall', 'decline', 'downgrade', 'sell', 'concern', 'pressure', 'missed', 'fraud', 'investigation', 'lawsuit', 'drop', 'plunge', 'crash', 'negative', 'penalty', 'fine'];
  
  let posCount = 0;
  let negCount = 0;
  
  for (const word of positiveWords) {
    if (lowerText.includes(word)) posCount++;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) negCount++;
  }
  
  if (posCount > negCount + 1) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

function extractSource(sourceString: string) {
  if (!sourceString) return 'News';
  return sourceString;
}

export async function GET(request: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  try {
    const resolvedParams = await params;
    const sectionId = resolvedParams.sectionId;
    
    const urlObj = new URL(request.url);
    const symbolsParam = urlObj.searchParams.get('symbols');
    const sentimentFilter = urlObj.searchParams.get('sentiment') || 'all'; // positive, negative, neutral, all
    
    let query = '';
    let isAllMarket = false;

    if (sectionId === 'all-market') {
      query = 'Indian Stock Market OR Nifty 50 OR Sensex OR RBI Policy OR SEBI';
      isAllMarket = true;
    } else if (symbolsParam) {
      const symbols = symbolsParam.split(',').filter(Boolean);
      if (symbols.length === 0) {
        return NextResponse.json({ news: [] });
      }
      // Combine up to 10 symbols in one OR query
      const querySymbols = symbols.slice(0, 10);
      query = querySymbols.join(' OR ');
    } else {
      return NextResponse.json({ news: [] });
    }

    // Add time and source constraints to get high quality recent news
    const timeFilter = 'when:7d'; // Last 7 days only
    const sourceFilter = '(site:moneycontrol.com OR site:economictimes.indiatimes.com OR site:livemint.com OR site:ndtvprofit.com OR site:cnbctv18.com)';
    
    // Final query combining keywords, time, and sources
    const finalQuery = `${query} ${timeFilter} ${sourceFilter}`;
    const encodedQuery = encodeURIComponent(finalQuery);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`;

    const res = await fetch(rssUrl, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error('Failed to fetch RSS feed');
    }

    const xmlData = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const result = parser.parse(xmlData);

    let items = result.rss?.channel?.item || [];
    if (!Array.isArray(items)) {
      items = [items];
    }

    let newsList = items.map((item: any, index: number) => {
      // Parse source
      const source = item.source?.['#text'] || extractSource(item.source) || 'News Source';
      
      // Clean title (usually has " - Source" at the end)
      let title = item.title || '';
      if (title.lastIndexOf(' - ') > 0) {
        title = title.substring(0, title.lastIndexOf(' - '));
      }
      
      const snippet = title; // RSS doesn't give a good snippet, title is best
      
      const sentiment = analyzeSentiment(title + ' ' + (item.description || ''));
      
      // Find related stocks from the symbol list
      let relatedStocks: string[] = [];
      if (!isAllMarket && symbolsParam) {
        const symbols = symbolsParam.split(',').filter(Boolean);
        for (const sym of symbols) {
          // Check if symbol or part of it is in the title
          if (title.toUpperCase().includes(sym.toUpperCase())) {
            relatedStocks.push(sym);
          }
        }
        // If we couldn't confidently match a symbol, just pick the first one as fallback if it's a small list
        if (relatedStocks.length === 0 && symbols.length <= 3) {
           relatedStocks = [symbols[0]];
        }
      }

      return {
        id: `news_${sectionId}_${index}_${new Date(item.pubDate).getTime()}`,
        headline: title,
        snippet: snippet,
        sentiment: sentiment,
        relatedStocks: relatedStocks,
        source: source,
        sourceLogoUrl: null, // Could add logo mapping later
        publishedAt: new Date(item.pubDate).toISOString(),
        articleUrl: item.link,
        thumbnailUrl: null
      };
    });

    // Apply sentiment filter
    if (sentimentFilter !== 'all') {
      newsList = newsList.filter((n: any) => n.sentiment === sentimentFilter);
    }

    // Sort by most recent
    newsList.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({
      news: newsList.slice(0, 30), // Return top 30
      hasMore: false,
      lastFetched: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
