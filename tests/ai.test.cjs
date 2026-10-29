const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let source=html.split('<script>')[1].split('</script>')[0];
source=source.slice(source.indexOf('  const ROWS'),source.indexOf('  function cancelAiAnimation'));
source=source.replace(/const coarsePointer=.*?;/,'');
vm.runInNewContext(source+`
positionHistory=[];moveHistory=[];
const start=initialBoard();
assert.equal(generateAllMoves(start,RED).length,44);
assert.equal(generateAllMoves(start,BLACK).length,44);
assert.equal(evaluateBoard(start,RED),0);
assert.equal(AI_LEVELS.length,10);
for(let i=1;i<10;i++){
  assert.ok(AI_LEVELS[i].time>AI_LEVELS[i-1].time);
  assert.ok(AI_LEVELS[i].error<AI_LEVELS[i-1].error);
}
let b=start,side=RED;
for(let i=0;i<18;i++){
  const moves=generateAllMoves(b,side);
  assert.ok(moves.length);
  for(const m of moves)assert.ok(!isInCheck(simulateMove(b,m.from,m.to),side));
  b=simulateMove(b,moves[(i*17)%moves.length].from,moves[(i*17)%moves.length].to);
  side=other(side);
}
for(const line of OPENING_LINES){
  let p=initialBoard(),s=RED;
  for(const [r,c,tr,tc] of line){
    assert.ok(isLegalMove(p,{r,c},{r:tr,c:tc},s),'invalid opening '+JSON.stringify([r,c,tr,tc])+JSON.stringify(line));
    p=simulateMove(p,{r,c},{r:tr,c:tc});s=other(s);
  }
}
const empty=()=>Array.from({length:10},()=>Array(9).fill(null));
const checked=empty();
checked[9][4]=piece('king',RED,'rk');checked[0][3]=piece('king',BLACK,'bk');
checked[7][4]=piece('rook',BLACK,'br');
searchDeadline=Infinity;searchPath=new Map();
assert.ok(isInCheck(checked,RED));
assert.ok(Number.isFinite(quiescence(checked,-Infinity,Infinity,RED,RED,0)));
const mate=empty();
mate[9][4]=piece('king',RED,'rk');mate[0][3]=piece('king',BLACK,'bk');
mate[8][0]=piece('rook',BLACK,'a');mate[7][3]=piece('rook',BLACK,'b');mate[7][5]=piece('rook',BLACK,'c');
assert.equal(generateAllMoves(mate,RED).length,0);
assert.ok(quiescence(mate,-Infinity,Infinity,RED,RED,0)<-800000);
const original=JSON.stringify(b);
for(let level=1;level<=10;level++){
  difficulty=level;
  const begun=performance.now(),m=chooseSearchMoveTimed(b,side),elapsed=performance.now()-begun;
  assert.ok(m&&isLegalMove(b,m.from,m.to,side));
  assert.equal(JSON.stringify(b),original);
  assert.ok(elapsed<AI_LEVELS[level-1].time+1000);
  console.log('Level',level,'legal; depth',lastAiDepth,'time',Math.round(elapsed)+'ms');
}
console.log('AI regression checks passed');
`,{assert,performance,console});
assert.equal((html.match(/name="difficulty"/g)||[]).length,10);
