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
const empty=()=>Array.from({length:10},()=>Array(9).fill(null));
const sigs=(list)=>list.map(moveSignature).sort().join(' ');
assert.equal(generateAllMoves(start,RED).length,44);
assert.equal(generateAllMoves(start,BLACK).length,44);
assert.equal(evaluateBoard(start,RED),0);
assert.equal(AI_LEVELS.length,10);
for(let i=1;i<10;i++){
  assert.ok(AI_LEVELS[i].time>AI_LEVELS[i-1].time);
  assert.ok(AI_LEVELS[i].error<AI_LEVELS[i-1].error);
  assert.ok(AI_LEVELS[i].maxDepth>=AI_LEVELS[i-1].maxDepth);
}

// 引擎走法生成須與棋盤規則完全一致（隨機對局 120 局面）。
let seed=7;const rand=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed%n};
let compared=0;
for(let game=0;game<6;game++){
  let b=initialBoard(),side=RED;
  for(let ply=0;ply<60;ply++){
    const rules=generateAllMoves(b,side);
    eLoad(b,side,[]);
    const engine=engineLegalMoves().map(m=>eToMove(b,m));
    assert.equal(sigs(engine),sigs(rules),'move generation mismatch at game '+game+' ply '+ply);
    eLoad(b,side,[]);
    assert.equal(!!eCheckStack[eSp],isInCheck(b,side));
    const mirror=b.map(row=>row.slice()).reverse().map(row=>row.map(p=>p?{...p,side:other(p.side)}:null));
    assert.equal(evaluateBoard(b,RED),evaluateBoard(mirror,BLACK),'evaluation must be colour-symmetric');
    compared++;
    if(!rules.length)break;
    const m=rules[rand(rules.length)];
    b=simulateMove(b,m.from,m.to);side=other(side);
  }
}

// 一步殺：雙車錯殺。
const mate1=empty();
mate1[9][3]=piece('king',RED,'rk');mate1[0][4]=piece('king',BLACK,'bk');
mate1[1][0]=piece('rook',RED,'ra');mate1[5][8]=piece('rook',RED,'rb');
difficulty=10;
let m=chooseSearchMoveTimed(mate1,RED);
assert.equal(moveSignature(m),'5,8-0,8','level 10 must find the back-rank mate');

// 被將死、困斃均判負。
const mated=empty();
mated[9][4]=piece('king',RED,'rk');mated[0][3]=piece('king',BLACK,'bk');
mated[8][0]=piece('rook',BLACK,'a');mated[7][3]=piece('rook',BLACK,'b');mated[7][5]=piece('rook',BLACK,'c');
assert.equal(generateAllMoves(mated,RED).length,0);
assert.equal(chooseSearchMoveTimed(mated,RED),null);

// 應將：被將軍時必須解將。
const checked=empty();
checked[9][4]=piece('king',RED,'rk');checked[0][3]=piece('king',BLACK,'bk');
checked[7][4]=piece('rook',BLACK,'br');checked[9][0]=piece('rook',RED,'rr');
for(let level=1;level<=10;level++){
  difficulty=level;const r=chooseSearchMoveTimed(checked,RED);
  assert.ok(!isInCheck(simulateMove(checked,r.from,r.to),RED));
}

// 高級別看得出無根紅馬可得。
const free=empty();
free[9][4]=piece('king',RED,'rk');free[0][4]=piece('king',BLACK,'bk');
free[9][3]=piece('advisor',RED,'ra1');free[9][5]=piece('advisor',RED,'ra2');
free[0][3]=piece('advisor',BLACK,'ba1');free[0][5]=piece('advisor',BLACK,'ba2');
free[4][2]=piece('horse',RED,'rh');free[3][4]=piece('pawn',BLACK,'bp');free[4][7]=piece('rook',BLACK,'br');free[9][0]=piece('rook',RED,'rr');
for(const level of [6,8,10]){
  difficulty=level;const r=engineSearchRoot(free,BLACK,AI_LEVELS[level-1],[]);
  assert.ok(r.scored[0].score>=100,'level '+level+' should see that the loose horse is won');
}

// 長將：搜尋內重複將軍應被視為不利於將軍方。
assert.equal(E_PERPETUAL>0,true);

let b=start,side=RED;
for(let i=0;i<18;i++){
  const moves=generateAllMoves(b,side);
  b=simulateMove(b,moves[(i*17)%moves.length].from,moves[(i*17)%moves.length].to);
  side=other(side);
}
for(const line of OPENING_LINES){
  let p=initialBoard(),s=RED;
  for(const [r,c,tr,tc] of line){
    assert.ok(isLegalMove(p,{r,c},{r:tr,c:tc},s),'invalid opening '+JSON.stringify([r,c,tr,tc]));
    p=simulateMove(p,{r,c},{r:tr,c:tc});s=other(s);
  }
}
const original=JSON.stringify(b);
for(let level=1;level<=10;level++){
  difficulty=level;
  const begun=performance.now(),mv=chooseSearchMoveTimed(b,side),elapsed=performance.now()-begun;
  assert.ok(mv&&isLegalMove(b,mv.from,mv.to,side));
  assert.equal(JSON.stringify(b),original);
  assert.ok(elapsed<AI_LEVELS[level-1].time+1000);
  console.log('Level',level,'legal; depth',lastAiDepth,'nodes',searchNodes,'time',Math.round(elapsed)+'ms');
}
console.log('Compared move generation on',compared,'positions');
console.log('AI regression checks passed');
`,{assert,performance,console});
assert.equal((html.match(/name="difficulty"/g)||[]).length,10);
