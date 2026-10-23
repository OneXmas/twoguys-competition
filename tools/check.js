// Syntax check of the whole Apps Script project, the way Apps Script loads it: every *.gs.txt joined into ONE scope.
// A top-level const/let declared in two files ("Identifier 'HL' has already been declared") fails here, not in the editor.
// Usage: node tools/check.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.gs.txt')).sort();
let bad = 0;
for (const f of files) {                                   // each file alone
  try { new vm.Script(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f }); }
  catch (e) { bad++; console.log(`✗ ${f}: ${e.message}`); }
}
try { new vm.Script(files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n'), { filename: 'ALL' }); }   // all together
catch (e) { bad++; console.log(`✗ all files together: ${e.message}`); }
console.log(bad ? `${bad} problem(s)` : `OK: ${files.length} files, no syntax errors or duplicate declarations`);
process.exit(bad ? 1 : 0);
