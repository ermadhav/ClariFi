async function test() {
  const r = await fetch('https://www.screener.in/company/RELIANCE/consolidated/');
  const html = await r.text();
  const peMatch = html.match(/Stock P\/E.*?<span class="number">([^<]+)<\/span>/s);
  const hlMatch = html.match(/High \/ Low.*?<span class="number">([^<]+)<\/span>.*?<span class="number">([^<]+)<\/span>/s);
  console.log('PE:', peMatch?.[1], 'HL:', hlMatch?.[1], hlMatch?.[2]);
}
test();
