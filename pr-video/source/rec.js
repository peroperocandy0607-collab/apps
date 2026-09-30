const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const [,,mode,...rest]=process.argv;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1.5});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8777/pr.html');await p.evaluate(()=>document.fonts.ready);
// preload demo frames
await p.evaluate(async()=>{await Promise.all([...Array(360)].map((_,i)=>{const im=new Image();im.src='frames/f'+String(i+1).padStart(3,'0')+'.jpg';return im.decode().catch(()=>{});}));});
const shot=async(t,path)=>{await p.evaluate(async t=>{render(t);const im=document.getElementById('demo');await im.decode().catch(()=>{});},t);await p.screenshot({path,type:mode==='all'?'jpeg':'png',quality:mode==='all'?92:undefined});};
if(mode==='all'){const fps=30,N=40*fps;for(let i=0;i<N;i++){await shot(i/fps,'out/'+String(i).padStart(5,'0')+'.jpg');if(i%150===0)console.log(i);}}
else{for(const t of rest)await shot(+t,'prev_'+t+'.png');}
await b.close();})();
