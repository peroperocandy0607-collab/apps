/* サイトのルートURL（どの階層のページから読み込んでも正しいリンクを作るため） */
const SITE_ROOT=(function(){const sc=document.currentScript||document.querySelector('script[src*="assets/app.js"]');return sc?sc.src.replace(/assets\/app\.js.*$/,''):'./';})();
/* ===== 共通データ ===== */
const STAR_NAMES = {1:'一白水星',2:'二黒土星',3:'三碧木星',4:'四緑木星',5:'五黄土星',6:'六白金星',7:'七赤金星',8:'八白土星',9:'九紫火星'};
const STAR_ELEMENT = {1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};
const ELEMENT_CLASS = {'木':'el-wood','火':'el-fire','土':'el-earth','金':'el-metal','水':'el-water'};
const ELEMENT_HEX = {'木':'#3f9142','火':'#d9482f','土':'#b5811a','金':'#8a7a4f','水':'#2a6fb0'};
const GROUP_OF = {1:'A',4:'A',7:'A',2:'B',5:'B',8:'B',3:'C',6:'C',9:'C'};
const MONTH_TABLE = {
  A:[8,7,6,5,4,3,2,1,9,8,7,6],
  B:[2,1,9,8,7,6,5,4,3,2,1,9],
  C:[5,4,3,2,1,9,8,7,6,5,4,3]
};
const GEN = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
const DIRECTIONS = ['北','北東','東','南東','南','南西','西','北西'];
const STAR_ONELINE = {
  1:'柔軟で聞き上手。物事をじっくり見極める「水」タイプです。',
  2:'面倒見が良くコツコツ努力できる「土」タイプです。',
  3:'明るく行動的。新しいことに飛び込む勢いのある「木」タイプです。',
  4:'人と人をつなぐのが得意な、縁を大切にする「木」タイプです。',
  5:'強い意志とまわりを引っ張る力を持つ、中心となる「土」タイプです。',
  6:'誇り高く、最後までやり遂げる責任感のある「金」タイプです。',
  7:'話し上手で場を明るくする、喜び上手な「金」タイプです。',
  8:'我慢強く、節目をしっかり乗り越えられる「土」タイプです。',
  9:'感性豊かで華やかな、人を惹きつける「火」タイプです。'
};

/* ===== 受講者・練習ユーザーの記憶（localStorage） ===== */
const MY_BIRTHDATE_KEY='houi_my_birthdate';
const LEARNER_PROFILE_KEY='houi_learner_profile';
const CLIENT_PROFILE_KEY='houi_client_profile';
function escapeHTML(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function loadCourseProfile(key){
  try{const p=JSON.parse(localStorage.getItem(key)||'null');return p&&typeof p==='object'?p:{name:'',birth:''};}catch(e){return {name:'',birth:''};}
}
function saveCourseProfile(key,name,birth){
  const p={name:String(name||'').trim(),birth:String(birth||'')};
  try{localStorage.setItem(key,JSON.stringify(p));}catch(e){}
  return p;
}
function getLearnerProfile(){
  const p=loadCourseProfile(LEARNER_PROFILE_KEY);
  if(!p.birth){try{p.birth=localStorage.getItem(MY_BIRTHDATE_KEY)||'';}catch(e){}}
  return p;
}
function getClientProfile(){return loadCourseProfile(CLIENT_PROFILE_KEY);}
function saveMyBirthdate(y,m,d){
  const birth=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),p=getLearnerProfile();
  try{localStorage.setItem(MY_BIRTHDATE_KEY,birth);}catch(e){}
  saveCourseProfile(LEARNER_PROFILE_KEY,p.name,birth);
}
function loadMyBirthdate(){const p=getLearnerProfile();return p.birth?parseDateInput(p.birth):null;}
function courseName(profile,fallback){return profile&&profile.name?profile.name:fallback;}
function isHiraganaName(v){return /^[ぁ-ゖー]+$/.test(String(v||'').trim());}
function saveCourseProfilesFromForm(){
  const ln=document.getElementById('learner_name'),lb=document.getElementById('learner_birth'),cn=document.getElementById('client_name'),cb=document.getElementById('client_birth'),status=document.getElementById('profile_status');
  if(!ln||!lb||!cn||!cb) return false;
  if(!isHiraganaName(ln.value)||!isHiraganaName(cn.value)||!lb.value||!cb.value){if(status)status.textContent='名前はひらがな、誕生日は年月日まで入力してください。';return false;}
  saveCourseProfile(LEARNER_PROFILE_KEY,ln.value,lb.value);saveCourseProfile(CLIENT_PROFILE_KEY,cn.value,cb.value);
  const bd=parseDateInput(lb.value);if(bd)saveMyBirthdate(bd.y,bd.m,bd.d);
  if(status)status.textContent='✓ 保存しました。STEP1〜13でお名前と星を引き継ぎます。';
  renderWelcomeGreeting();renderAllProfileBanners();return true;
}
function initCourseProfileForm(){
  const ln=document.getElementById('learner_name');if(!ln)return;
  const l=getLearnerProfile(),c=getClientProfile();
  ln.value=l.name||'';document.getElementById('learner_birth').value=l.birth||'';document.getElementById('client_name').value=c.name||'';document.getElementById('client_birth').value=c.birth||'';
  renderWelcomeGreeting();
}
function renderWelcomeGreeting(){
  const el=document.getElementById('welcome_greeting');if(!el)return;
  const l=getLearnerProfile(),c=getClientProfile(),ln=escapeHTML(courseName(l,'あなた')),cn=escapeHTML(courseName(c,'練習ユーザー'));
  el.innerHTML='<b>'+ln+'さん、こんにちは！ フクロウ先生です🦉</b><p>この講座では、'+ln+'さん自身と、'+cn+'さんの生年月日を実例にしながら、STEP1からSTEP13まで一緒に進みます。難しい言葉も、私がひとつずつ案内しますね。</p>';
}
function myStarBannerHTML(){
  const l=getLearnerProfile(),c=getClientProfile(),b=l.birth?parseDateInput(l.birth):null,cb=c.birth?parseDateInput(c.birth):null;
  if(!b)return '<div class="mystar-banner empty">🦉 まず最初に、受講者と練習ユーザーの情報を登録しましょう。<a href="'+SITE_ROOT+'#profiles">登録する ▶</a></div>';
  const ys=getYearStar(b.y,b.m,b.d),el=STAR_ELEMENT[ys.star],clientText=cb?' ／ '+escapeHTML(courseName(c,'練習ユーザー'))+'さん：<b>'+STAR_NAMES[getYearStar(cb.y,cb.m,cb.d).star]+'</b>':' ／ 練習ユーザーは未登録';
  return '<div class="mystar-banner"><span class="dot" style="background:'+ELEMENT_HEX[el]+'"></span>'+escapeHTML(courseName(l,'あなた'))+'さん：<b>'+STAR_NAMES[ys.star]+'</b>'+clientText+' <a href="'+SITE_ROOT+'#profiles">変更する</a></div>';
}
function renderMyStarBanner(containerId){
  const el = document.getElementById(containerId);
  if(el) el.innerHTML = myStarBannerHTML();
}
function renderAllProfileBanners(){
  let nodes=Array.from(document.querySelectorAll('[id^="mybanner"],#course_profile_banner'));
  if(document.body.hasAttribute('data-c')&&!nodes.length){const el=document.createElement('div');el.id='course_profile_banner';const teacher=document.querySelector('.teacher-talk');if(teacher)teacher.insertAdjacentElement('afterend',el);nodes=[el];}
  nodes.forEach(function(el){el.innerHTML=myStarBannerHTML();});
}
function highlightMyStarCard(){
  const b = loadMyBirthdate();
  if(!b) return;
  const star = getYearStar(b.y,b.m,b.d).star;
  document.querySelectorAll('[data-star]').forEach(function(card){
    if(parseInt(card.getAttribute('data-star'),10) === star){
      card.classList.add('my-star');
      const ribbon = document.createElement('div');
      ribbon.className = 'my-star-ribbon';
      ribbon.textContent = '★ あなたの星';
      card.prepend(ribbon);
    }
  });
}

/* ===== フクロウ先生の講義ナビ ===== */
const FUKUKO_TALKS = {
  1:'まず自分の星を調べると、難しい言葉も「私の場合は？」と考えられます。全部覚えなくて大丈夫。一緒に一歩ずつ進みましょう。',
  2:'今日は方位風水の「地図の読み方」です。方位は住所、五行はその場所の性格、八卦は自然にたとえた愛称。3つをセットで見ると迷子になりませんよ。',
  3:'ここが最初の山場です！ 九星は9人の登場人物だと思ってください。まず自分の星、次にお母さんや身近な人の星だけ読めばOK。9つ全部の丸暗記はあとからで大丈夫です。',
  4:'本命星は「その人の基本」、月命星は「内側の傾向」。方位盤は星が座る9つの席です。人・時間・場所を分けて考えると、急にわかりやすくなりますよ。',
  5:'怖い言葉が出てもびっくりしないでくださいね。吉方位は追い風、注意方位は雨予報のようなもの。予報を見て準備するために使います。',
  6:'ここからは実生活編です。難しい開運グッズより、換気・掃除・安全な動線が先。今日ひとつ変えられる場所を見つけましょう。',
  7:'いよいよ鑑定文づくりです！ 星を決めつけに使わず、相談者が次の一歩を選べる言葉に変えるのがゴール。自動ツールも遠慮なく使ってください。'
};
function renderFukukoTeacher(){
  const step=parseInt(document.body.getAttribute('data-c'),10), hero=document.querySelector('.step-hero');
  if(!hero || !FUKUKO_TALKS[step] || document.querySelector('.teacher-talk')) return;
  const box=document.createElement('div');
  box.className='teacher-talk';
  const l=getLearnerProfile(),c=getClientProfile(),ln=escapeHTML(courseName(l,'受講者')),cn=escapeHTML(courseName(c,'練習ユーザー'));
  let talk=FUKUKO_TALKS[step];if(step===3)talk='今日は'+cn+'さんの星も調べて、'+ln+'さんとの似ているところ・違うところを見つけましょう。'+talk;
  box.innerHTML='<div class="teacher-avatar" aria-hidden="true">🦉</div><div class="teacher-bubble"><b>フクロウ先生</b><p><strong>'+ln+'さん、</strong>'+talk+'</p></div>';
  hero.insertAdjacentElement('afterend',box);
}

/* ===== STEP別・5問ミニクイズ ===== */
const QUIZ_BANK = {
  1:[['風水をひとことで表すと？',['未来を必ず当てる方法','環境を整えて心地よく暮らす知恵','星座を数える方法'],1],['家相で主に見るものは？',['家の間取りと方位','手相の線','名前の画数'],0],['本命星を知る主な手がかりは？',['好きな色','生年月日','住所の番地'],1],['「羅針」の意味は？',['暦','方位磁石・コンパス','お守り'],1],['大切な決断で最優先するものは？',['凶という言葉','現実の安全・費用・事情','占いだけ'],1]],
  2:[['八方位はいくつの方向？',['5つ','8つ','9つ'],1],['五行の組み合わせは？',['木・火・土・金・水','春・夏・秋・冬・空','東・西・南・北・中央'],0],['東と南東に対応する五行は？',['木','金','水'],0],['八卦は何を使って方位の性格を表す？',['自然の象徴','血液型','星座'],0],['方位・五行・八卦の関係で近い説明は？',['住所・性格・自然の愛称','全部同じ言葉','覚えなくてよい数字'],0]],
  3:[['九星が9種類ある理由として近いものは？',['8方位に中央を足すから','曜日が9日あるから','季節が9つあるから'],0],['九星の基本配置のもとになったものは？',['洛書','星座早見盤','十二支だけ'],0],['五黄土星の基本位置は？',['中央','北','東'],0],['九星の性格説明はどう使う？',['必ず当たる決めつけ','傾向を知るヒント','人を評価する順位'],1],['初心者が最初に読むとよいカードは？',['自分と身近な人の星','9枚を一度に暗記','五黄土星だけ'],0]],
  4:[['本命星が表すものは？',['基本的な傾向','今日の天気','家の間取りだけ'],0],['月命星が表すものとして近いのは？',['内面や若い頃の傾向','住所','目的地までの距離'],0],['方位盤とは？',['九星を9マスに配置した図','方位磁石そのもの','家計簿'],0],['年盤・月盤・日盤の違いは？',['見る時間の長さ','色だけ','全部同じ'],0],['立春や節入り付近で必要な姿勢は？',['境界を確認する','必ず前年にする','無視する'],0]],
  5:[['吉方位の説明として適切なのは？',['必ず成功する方向','追い風のような参考材料','行かなければ不幸になる方向'],1],['注意方位はどう扱う？',['怖がらせる','準備や確認を丁寧にする目安','予定を必ず中止する'],1],['暗剣殺で意識することは？',['予期せぬことへの確認と安全対策','宝くじを買う','掃除だけ'],0],['移動の判断で優先するものは？',['安全・費用・家族事情','方位だけ','名称の怖さ'],0],['鑑定文に向く表現は？',['絶対に悪いことが起きます','慎重に確認すると安心です','必ず成功します'],1]],
  6:[['住まいを整える最初の基本は？',['高価な開運品','掃除・換気・安全','家具を全部捨てる'],1],['玄関で確認したいものは？',['明るさ・清潔さ・匂い','星座','生年月日'],0],['寝室の主な役割は？',['心と体を休める','仕事道具を積む','靴を収納する'],0],['方位別インテリアの使い方は？',['暮らしを整える参考','必ず同じ色に統一','高価な物を買う命令'],0],['実践するときのよい進め方は？',['今日できることを1つ選ぶ','全部一日で変える','何もしない'],0]],
  7:[['良い鑑定文の目的は？',['相談者を怖がらせる','次の一歩を選べるよう支える','未来を断定する'],1],['星の説明で避けたいことは？',['傾向として伝える','性格を決めつける','強みも伝える'],1],['プロンプト生成に最初に必要なものは？',['生年月日','銀行口座','顔写真'],0],['相性鑑定で大切な姿勢は？',['良い悪いを断定しない','必ず結婚を勧める','相手の気持ちを決めつける'],0],['ChatGPTの文章を受け取った後は？',['そのまま絶対視する','現実事情と表現を確認して整える','相談者に確認しない'],1]]
};
const QUIZ_RECAPS = {
  1:['風水は環境を整えて心地よく暮らす知恵','家相は家の間取りと方位を見る考え方','本命星は生年月日から調べる','羅針は方位磁石・コンパスのこと','大切な決断では現実の安全・費用・事情を優先する'],
  2:['八方位は8つの方向','五行は木・火・土・金・水','東と南東は木のグループ','八卦は自然の象徴で方位の性格を表す','方位＝住所、五行＝性格、八卦＝自然の愛称と考える'],
  3:['九星は8方位に中央を加えた9種類','基本配置のもとは洛書','基本形では五黄土星が中央','九星は決めつけではなく傾向のヒント','最初は自分と身近な人のカードから読む'],
  4:['本命星はその人の基本的な傾向','月命星は内面や若い頃の傾向','方位盤は九星を9マスに配置した図','年盤・月盤・日盤は見る時間の長さが違う','立春や節入り付近では境界を確認する'],
  5:['吉方位は追い風のような参考材料','注意方位は準備や確認を丁寧にする目安','暗剣殺では予期せぬことへの安全確認を意識','移動では安全・費用・家族事情を優先','鑑定文では断定せず、慎重な確認を勧める'],
  6:['住まいの基本は掃除・換気・安全','玄関では明るさ・清潔さ・匂いを確認','寝室は心と体を休める場所','方位別インテリアは暮らしを整える参考','今日できる改善を1つ選んで実践する'],
  7:['鑑定文は相談者が次の一歩を選べるよう支える','星で性格を決めつけない','自動生成ではまず生年月日を入力','相性の良い・悪いを断定しない','ChatGPTの文章は現実事情と表現を確認して整える']
};
function renderStepQuiz(){
  const step=parseInt(document.body.getAttribute('data-c'),10), questions=QUIZ_BANK[step];
  if(!questions) return;
  let details=Array.from(document.querySelectorAll('details.acc')).find(function(d){const s=d.querySelector(':scope>summary');return s&&s.textContent.indexOf('暗記チェック')>=0;});
  if(!details){ details=document.createElement('details'); details.className='acc'; const pager=document.querySelector('.pager'); if(pager) pager.parentNode.insertBefore(details,pager); }
  details.classList.add('quiz-acc');
  details.open=true;
  details.innerHTML='<summary>🦉 フクロウ先生のミニクイズ・全5問</summary><div class="acc-body"><div class="quiz-intro">🪶 ここまで理解できたか、5問で確認しましょう。何度でも挑戦できます！</div><div class="quiz-list">'+questions.map(function(q,qi){return '<fieldset class="quiz-q" data-answer="'+q[2]+'"><legend>Q'+(qi+1)+'. '+q[0]+'</legend>'+q[1].map(function(o,oi){return '<label><input type="radio" name="quiz'+step+'_'+qi+'" value="'+oi+'"> '+o+'</label>';}).join('')+'<div class="quiz-answer" aria-live="polite"></div></fieldset>';}).join('')+'</div><button type="button" class="btn quiz-check">5問を採点する</button><div class="quiz-score" aria-live="polite"></div></div>';
  details.querySelector('.quiz-check').addEventListener('click',function(){
    let score=0,unanswered=0;
    details.querySelectorAll('.quiz-q').forEach(function(q){const picked=q.querySelector('input:checked'),answer=parseInt(q.getAttribute('data-answer'),10),out=q.querySelector('.quiz-answer');q.classList.remove('correct','wrong');if(!picked){unanswered++;out.textContent='まだ選ばれていません';}else if(parseInt(picked.value,10)===answer){score++;q.classList.add('correct');out.textContent='○ 正解！';}else{q.classList.add('wrong');out.textContent='△ もう一度、上の講義を見直してみよう';}});
    details.querySelector('.quiz-score').textContent=unanswered?'未回答が'+unanswered+'問あります。現在 '+score+' / 5問正解です。':(score===5?'🎉 5 / 5問正解！ フクロウ先生から合格です！':score+' / 5問正解です。間違えたところだけ復習しましょう。');
  });
}
function renderQuizRecap(){
  const step=parseInt(document.body.getAttribute('data-c'),10),items=QUIZ_RECAPS[step];
  if(!items || document.querySelector('.quiz-recap')) return;
  const recap=document.createElement('div');
  recap.className='quiz-recap';
  recap.innerHTML='<h3>🦉 フクロウ先生の「クイズ前POINT」</h3><p>この5つは講義の大切なまとめです。クイズに答える前に確認しましょう。</p><ul>'+items.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>';
  const quiz=document.querySelector('.quiz-acc');
  if(quiz) quiz.parentNode.insertBefore(recap,quiz);
}
function openLearningActivities(){
  document.querySelectorAll('details.acc').forEach(function(d){
    const s=d.querySelector(':scope>summary');
    if(s && (s.textContent.indexOf('ワーク')>=0 || d.classList.contains('quiz-acc'))) d.open=true;
  });
}

/* ===== 初心者向け・専門用語の読み方 ===== */
const PRONUNCIATION_GLOSSARY = {
  '陰陽五行説':'いんようごぎょうせつ','九星気学':'きゅうせいきがく','方位風水羅針術':'ほういふうすいらしんじゅつ',
  '本命的殺':'ほんめいてきさつ','五黄土星':'ごおうどせい','一白水星':'いっぱくすいせい','二黒土星':'じこくどせい','三碧木星':'さんぺきもくせい','四緑木星':'しろくもくせい','六白金星':'ろっぱくきんせい','七赤金星':'しちせききんせい','八白土星':'はっぱくどせい','九紫火星':'きゅうしかせい',
  '五黄殺':'ごおうさつ','暗剣殺':'あんけんさつ','本命殺':'ほんめいさつ','歳破':'さいは','月破':'げっぱ','日破':'にっぱ',
  '注意方位':'ちゅういほうい','吉方位':'きちほうい','凶方位':'きょうほうい','八方位':'はっぽうい','方位盤':'ほういばん','本命星':'ほんめいせい','月命星':'げつめいせい','方位学':'ほういがく','九星':'きゅうせい','八卦':'はっけ','五行':'ごぎょう','十二支':'じゅうにし','神棚':'かみだな','家相':'かそう','風水':'ふうすい','洛書':'らくしょ','羅針':'らしん',
  '年盤':'ねんばん','月盤':'げつばん','日盤':'にちばん','節入り':'せついり','立春':'りっしゅん','相生':'そうしょう','相剋':'そうこく','比和':'ひわ'
};
function addPronunciationHints(){
  const root=document.querySelector('main,.wrap') || document.body;
  const seen=new Set(), terms=Object.keys(PRONUNCIATION_GLOSSARY).sort(function(a,b){return b.length-a.length;});
  const pattern=new RegExp(terms.join('|'),'g');
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
    const p=node.parentElement;
    if(!p || p.closest('script,style,svg,.prompt-box,.topnav,footer,textarea,select,option,button,.teacher-talk,.type-card .name')) return NodeFilter.FILTER_REJECT;
    return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  }});
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(function(node){
    node.nodeValue=node.nodeValue.replace(pattern,function(term,offset,text){
      if(seen.has(term)) return term;
      const reading='（'+PRONUNCIATION_GLOSSARY[term]+'）';
      seen.add(term);
      return text.slice(offset+term.length,offset+term.length+reading.length)===reading ? term : term+reading;
    });
  });
}
function addStarCardReadings(){
  const readings={
    '一白水星':'いっぱくすいせい','二黒土星':'じこくどせい','三碧木星':'さんぺきもくせい',
    '四緑木星':'しろくもくせい','五黄土星':'ごおうどせい','六白金星':'ろっぱくきんせい',
    '七赤金星':'しちせききんせい','八白土星':'はっぱくどせい','九紫火星':'きゅうしかせい'
  };
  document.querySelectorAll('.type-card .name').forEach(function(name){
    const star=name.textContent.trim(), reading=readings[star];
    if(reading) name.innerHTML=star+'<span class="star-reading">（'+reading+'）</span>';
  });
}

function digitalRoot(n){
  n = Math.abs(Math.trunc(n));
  while(n >= 10){ n = String(n).split('').reduce(function(a,b){return a + (+b);}, 0); }
  return n;
}
function yearStarNum(year){
  const root = digitalRoot(year);
  let star = 11 - root;
  if(star > 9) star -= 9;
  if(star <= 0) star += 9;
  return star;
}
// 節入りの目安境界（月, 日, インデックス0=寅[2月]…11=丑[1月]）
const SETSU = [[2,4,0],[3,6,1],[4,5,2],[5,6,3],[6,6,4],[7,7,5],[8,8,6],[9,8,7],[10,8,8],[11,7,9],[12,7,10],[1,6,11]];
function kigakuBracket(y,m,d){
  const target = new Date(y, m-1, d).getTime();
  function bounds(C){
    return SETSU.map(function(b){
      const yy = (b[0]===1) ? C+1 : C;
      return {idx:b[2], t:new Date(yy, b[0]-1, b[1]).getTime()};
    });
  }
  let C = (m>=2) ? y : y-1;
  let B = bounds(C);
  if(target < B[0].t){ C = C-1; B = bounds(C); }
  let idx = 0;
  for(let i=0;i<B.length;i++){ if(target >= B[i].t) idx = B[i].idx; }
  return {cycleYear:C, idx:idx};
}
function getYearStar(y,m,d){
  const b = kigakuBracket(y,m,d);
  return {star:yearStarNum(b.cycleYear), cycleYear:b.cycleYear};
}
function getMonthStar(y,m,d){
  const b = kigakuBracket(y,m,d);
  const ys = yearStarNum(b.cycleYear);
  const group = GROUP_OF[ys];
  const star = MONTH_TABLE[group][b.idx];
  return {star:star, idx:b.idx, cycleYear:b.cycleYear, yearStar:ys};
}
function relationOf(elA, elB){
  if(elA === elB) return '比和（似た者同士）';
  if(GEN[elA] === elB || GEN[elB] === elA) return '相生（自然と支え合いやすい）';
  return '相剋（刺激し合い、成長のきっかけになりやすい）';
}
function parseDateInput(val){
  if(!val) return null;
  const p = val.split('-');
  if(p.length!==3) return null;
  return {y:parseInt(p[0],10), m:parseInt(p[1],10), d:parseInt(p[2],10)};
}
function starBadgeHTML(label, starNum){
  if(!starNum) return '<div class="starbadge"><span class="dot" style="background:#ccc"></span><div><span class="label">'+label+'</span><span class="value">未入力</span></div></div>';
  const el = STAR_ELEMENT[starNum];
  const color = ELEMENT_HEX[el];
  return '<div class="starbadge"><span class="dot" style="background:'+color+'"></span><div><span class="label">'+label+'</span><span class="value">'+STAR_NAMES[starNum]+'</span></div></div>';
}

/* ===== テーブルのモバイル用 data-label 自動付与 ===== */
function enhanceTables(){
  document.querySelectorAll('table.data').forEach(function(table){
    const headers = Array.from(table.querySelectorAll('thead th')).map(function(th){return th.textContent.trim();});
    table.querySelectorAll('tbody tr').forEach(function(tr){
      Array.from(tr.children).forEach(function(td,i){
        if(headers[i]) td.setAttribute('data-label', headers[i]);
      });
    });
  });
}

/* ===== ハッシュ遷移時にアコーディオンを自動展開 ===== */
function openDetailsForHash(){
  const hash = location.hash;
  if(!hash) return;
  let el;
  try{ el = document.querySelector(hash); }catch(e){ return; }
  if(!el) return;
  let p = el.closest('details');
  while(p){ p.open = true; p = p.parentElement ? p.parentElement.closest('details') : null; }
  setTimeout(function(){ el.scrollIntoView({behavior:'smooth', block:'start'}); }, 60);
}

/* ===== 印刷時はすべてのアコーディオンを開く ===== */
let _detailsWereClosed = [];
window.addEventListener('beforeprint', function(){
  _detailsWereClosed = [];
  document.querySelectorAll('details.acc').forEach(function(d){
    if(!d.open){ _detailsWereClosed.push(d); d.open = true; }
  });
});
window.addEventListener('afterprint', function(){
  _detailsWereClosed.forEach(function(d){ d.open = false; });
  _detailsWereClosed = [];
});

/* ===== 早見表ジャンプメニュー ===== */
function toggleTableMenu(){
  const m = document.getElementById('tableMenu');
  if(!m) return;
  m.style.display = (m.style.display === 'block') ? 'none' : 'block';
}

/* ===== スマホ用ページメニュー（横スクロールを使わずタップで開く） ===== */
function enhanceMobileNav(){
  document.querySelectorAll('.topnav .bar').forEach(function(bar){
    const links = bar.querySelector('.links');
    if(!links || bar.querySelector('.nav-toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'ページメニューを開く');
    button.innerHTML = 'ページメニュー <span aria-hidden="true">▼</span>';
    button.addEventListener('click', function(e){
      e.stopPropagation();
      const isOpen = links.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
      button.setAttribute('aria-label', isOpen ? 'ページメニューを閉じる' : 'ページメニューを開く');
      button.querySelector('span').textContent = isOpen ? '▲' : '▼';
    });
    links.addEventListener('click', function(){
      links.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      button.querySelector('span').textContent = '▼';
    });
    bar.appendChild(button);
  });
}

document.addEventListener('click', function(e){
  const fab = document.querySelector('.fab');
  if(fab && !fab.contains(e.target)){
    const m = document.getElementById('tableMenu');
    if(m) m.style.display = 'none';
  }
  document.querySelectorAll('.topnav .links.open').forEach(function(links){
    const bar = links.closest('.bar');
    if(bar && !bar.contains(e.target)){
      links.classList.remove('open');
      const button = bar.querySelector('.nav-toggle');
      if(button){
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'ページメニューを開く');
        const icon = button.querySelector('span');
        if(icon) icon.textContent = '▼';
      }
    }
  });
});

/* ===== プロンプトコピー ===== */
function copyPrompt(id, btn){
  const node = document.getElementById(id);
  const text = node.value !== undefined ? node.value : node.innerText;
  function showCopied(){
    const orig = btn.innerText;
    btn.innerText = '✓ コピーしました';
    btn.classList.add('copied');
    setTimeout(function(){ btn.innerText = orig; btn.classList.remove('copied'); }, 1800);
  }
  function fallbackCopy(){
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try{
      if(document.execCommand('copy')) showCopied();
    } finally {
      document.body.removeChild(ta);
    }
  }
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

document.addEventListener('DOMContentLoaded', function(){
  enhanceMobileNav();
  enhanceTables();
  initCourseProfileForm();
  renderFukukoTeacher();
  renderStepQuiz();
  renderQuizRecap();
  openLearningActivities();
  addStarCardReadings();
  addPronunciationHints();
  openDetailsForHash();
  highlightMyStarCard();
  renderAllProfileBanners();
});
window.addEventListener('hashchange', openDetailsForHash);
