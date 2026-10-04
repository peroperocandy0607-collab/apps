const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const [,,mode,...rest]=process.argv;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1.5});
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CERR',m.text())});
await p.goto('http://localhost:8780/sol.html');await p.evaluate(()=>document.fonts.ready);
const shot=async(t,path,jpg)=>{await p.evaluate(async t=>{render(t);await document.getElementById('pimg').decode().catch(()=>{});},t);await p.screenshot({path,type:jpg?'jpeg':'png',quality:jpg?92:undefined});};
if(mode==='all'){const fps=30,N=Math.round(56.7*fps),from=+(rest[0]||0),to=+(rest[1]||N);for(let i=from;i<Math.min(N,to);i++){await shot(i/fps,'out/'+String(i).padStart(5,'0')+'.png',false);if(i%150===0)console.log(i);}}
else{for(const t of rest)await shot(+t,'pv_'+t+'.png');}
await b.close();})();
