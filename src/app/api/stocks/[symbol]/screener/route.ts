import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const resolvedParams = await params;
    let symbol = resolvedParams.symbol;
    
    // Strip suffixes like .NS or .BO
    if (symbol.includes('.')) {
      symbol = symbol.split('.')[0];
    }

    // Try fetching consolidated first, as it's the standard for financial analysis
    let url = `https://www.screener.in/company/${symbol}/consolidated/`;
    let res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // If consolidated doesn't exist, fallback to standalone
    if (!res.ok) {
      url = `https://www.screener.in/company/${symbol}/`;
      res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch screener data' }, { status: res.status });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract About & Key Points
    const about = $('.company-profile .sub.info').text().trim() || $('.company-profile p').first().text().trim();
    const keyPointsHTML = $('.company-profile .commentary').html() || '';
    
    // Process Key Points to match the layout
    let keyPointsText = '';
    $('.company-profile .commentary p').each((_, el) => {
        keyPointsText += $(el).text() + '\n\n';
    });
    
    // If no commentary, fallback
    if (!keyPointsText) {
       keyPointsText = about;
    }

    // Function to parse Screener tables
    const parseTable = (id: string) => {
      const table = $(`#${id} table.data-table`);
      if (!table.length) return { headers: [], rows: [] };
      
      const headers: string[] = [];
      table.find('thead th').each((_, el) => {
        headers.push($(el).text().trim());
      });
      
      const rows: any[] = [];
      table.find('tbody tr').each((_, el) => {
        // Skip empty rows or separator rows
        if ($(el).hasClass('strong') || $(el).hasClass('stripe')) {
           // We might still want to parse them, let's just parse all td
        }
        const rowData: any = {};
        $(el).find('td').each((j, td) => {
          let val = $(td).text().trim();
          if (j === 0) {
            // Clean up weird characters and plus signs
            rowData.metric = val.replace('+', '').replace(/[^\x20-\x7E]/g, '').trim();
          } else {
            const headKey = headers[j] || `y${j}`;
            // Convert to number if possible, removing commas
            const numVal = parseFloat(val.replace(/,/g, ''));
            rowData[headKey] = isNaN(numVal) ? (val || '-') : numVal;
          }
        });
        if (rowData.metric) {
          rows.push(rowData);
        }
      });
      return { headers: headers.slice(1), rows }; // Remove the first empty header
    };

    const quarterlyResults = parseTable('quarters');
    const profitAndLoss = parseTable('profit-loss');
    const balanceSheet = parseTable('balance-sheet');

    // Extract Top Ratios (Market Cap, P/E, etc)
    const topRatios: Record<string, string> = {};
    $('#top-ratios li').each((_, el) => {
      const name = $(el).find('.name').text().trim();
      const value = $(el).find('.value').text().trim();
      if (name && value) {
        topRatios[name] = value;
      }
    });

    return NextResponse.json({
      about,
      keyPoints: keyPointsText,
      topRatios,
      quarterlyResults,
      profitAndLoss,
      balanceSheet
    });
  } catch (error) {
    console.error('Screener parse error:', error);
    return NextResponse.json({ error: 'Failed to parse screener data' }, { status: 500 });
  }
}
