const fs = require('fs');

const data = fs.readFileSync('/Users/harrum/Desktop/Work 1/Perfume/data/fragrances.js', 'utf8');

console.log('Data length:', data.length);

// Extract the array part
const start = data.indexOf('[');
const end = data.lastIndexOf(']');
const jsonStr = data.slice(start, end + 1);

console.log('JSON str length:', jsonStr.length);

let fragrances = JSON.parse(jsonStr);

console.log('Fragrances length:', fragrances.length);

// Add price to each
fragrances.forEach(f => {
  if (f.variants && f.variants.length > 0) {
    const prices = f.variants.map(v => v.prices.USD).filter(p => p);
    f.price = Math.min(...prices);
  } else {
    f.price = 0;
  }
});

console.log('First fragrance price:', fragrances[0].price);

// Write back
const newData = 'const fragrances = ' + JSON.stringify(fragrances, null, 2) + ';\n\nexport default fragrances;';
fs.writeFileSync('/Users/harrum/Desktop/Work 1/Perfume/data/fragrances.js', newData);

console.log('Done');