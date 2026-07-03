const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{item\.platform === 'facebook' \? 'FB Mkt' : item\.platform\.charAt\(0\)\.toUpperCase\(\) \+ item\.platform\.slice\(1\)\}/g,
  "{item.platform === 'facebook' ? 'FB Mkt' : (item.platform ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1) : 'Unknown')}"
);

fs.writeFileSync('src/App.tsx', code);
