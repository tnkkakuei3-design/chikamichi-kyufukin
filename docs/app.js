(() => {
  'use strict';
  const dialog = document.querySelector('#check-dialog');
  const content = document.querySelector('#check-content');
  const infoDialog = document.querySelector('#info-dialog');
  const guide = window.BenefitGuide;
  const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
  const yen = n => new Intl.NumberFormat('ja-JP').format(n) + '円';
  const questions = [
    {id:'age',title:'退職時の年齢は？',hint:'退職前の方は、予定時の年齢を選んでください。',options:[['under30','29歳以下'],['30to34','30〜34歳'],['35to44','35〜44歳'],['45to59','45〜59歳'],['60to64','60〜64歳'],['65plus','65歳以上']]},
    {id:'work',title:'退職後の働き方について',hint:'現在または退職後に想定している状況を選んでください。',options:[['ready','働ける状態で、仕事を探す'],['notready','病気・育児などですぐには働けない'],['newjob','再就職先がすでに決まっている'],['unknown','まだ決めていない・わからない']]},
    {id:'reason',title:'退職の理由は？',hint:'最も近いものを選択。最終的な離職理由の区分はハローワークが確認します。',options:[['self','通常の自己都合・定年など'],['dismissal','倒産・解雇などの会社都合'],['contract','更新を希望したが契約が終了した'],['justified','病気・家族の介護など、やむを得ない理由'],['unknown','区分がわからない']]},
    {id:'contractWindow',title:'契約が終了する日は？',hint:'雇止めの一部に適用される、給付日数の特例を確認します。',options:[['before202704','2027年3月31日まで'],['after202704','2027年4月1日以降'],['unknown','まだ決まっていない・わからない']]},
    {id:'recent',title:'直近の雇用保険の期間は？',hint:'原則、賃金の支払基礎日数11日以上、または80時間以上の月を数えます。上から順に当てはまるものを選んでください。',options:[['12months','離職前2年間に12か月以上'],['6months','上には当てはまらず、離職前1年間に6か月以上'],['short','どちらの期間にも満たない'],['none','雇用保険に加入していない'],['unknown','わからない']]},
    {id:'period',title:'給付日数に使う通算加入期間は？',hint:'給付を受けた以前の期間や、1年を超える加入の空白などは通算できない場合があります。わからないときは未確認を選べます。',options:[['under1','1年未満'],['1to4','1年以上・5年未満'],['5to9','5年以上・10年未満'],['10to19','10年以上・20年未満'],['20plus','20年以上'],['unknown','未確認・わからない']]},
    {id:'category',title:'「就職困難者」の区分は？',hint:'障害などがある方に適用される場合がある制度上の区分です。「仕事が見つかりにくい」という意味ではありません。',options:[['none','この区分には該当しない'],['confirmed','ハローワークで該当すると確認済み'],['possible','該当する可能性はあるが、未確認'],['unknown','わからない']]},
    {id:'monthlyYen',title:'退職前6か月の平均月給は？',hint:'税・社会保険料を引く前の給与（賞与を除く）を入力してください。給与が変動する場合は6か月の合計÷6です。',salary:true}
  ];
  let index=0, answers={}, lastTrigger=null, infoTrigger=null, resultText='';
  const sequence = () => questions.filter(q => q.id !== 'contractWindow' || answers.reason === 'contract');
  function lock(){document.body.classList.add('modal-open');}
  function unlock(){if(!dialog.open&&!infoDialog.open)document.body.classList.remove('modal-open');}
  function focusTitle(){content.querySelector('h2')?.focus({preventScroll:true});dialog.scrollTop=0;content.scrollTop=0;}
  function renderQuestion(){
    const steps=sequence(), q=steps[index];
    const fields=q.salary?`<form id="salary-form"><label class="salary-label" for="monthly-salary">平均月給（額面）</label><div class="salary-field"><input id="monthly-salary" name="monthly-salary" inputmode="decimal" type="number" min="0.01" max="1000" step="0.01" required placeholder="例：30" value="${answers.monthlyYen?answers.monthlyYen/10000:''}" aria-describedby="salary-help salary-error"><span>万円</span></div><p id="salary-help" class="question-hint">例：月給30万円なら「30」。結果は1円単位で表示します。</p><p id="salary-error" class="field-error" role="alert"></p><button class="result-link green" type="submit">無料で結果を見る ${arrow}</button></form><button class="unknown-button" data-salary-unknown>月給がわからないので、日数だけ見る</button>`:`<div class="question-options ${q.id==='age'?'age-options':''}">${q.options.map(([value,label])=>`<button class="option-button" data-answer="${value}" aria-pressed="${answers[q.id]===value}">${label}${arrow}</button>`).join('')}</div>`;
    content.innerHTML=`<div class="check-progress" role="progressbar" aria-label="質問の進み具合" aria-valuemin="1" aria-valuemax="${steps.length}" aria-valuenow="${index+1}">${steps.map((_,i)=>`<span class="${i<=index?'done':''}"></span>`).join('')}</div><p class="question-count">質問 <b>${index+1}</b> / ${steps.length}</p><h2 id="check-heading" tabindex="-1">${q.title}</h2><p class="question-hint">${q.hint}</p>${fields}<div class="dialog-bottom"><button class="back-button" data-back ${index===0?'disabled':''}>前の質問に戻る</button><span class="privacy-mini">登録不要・結果まで無料</span></div>`;
    focusTitle();
  }
  function finishEarly(id,value){
    return id==='age'&&value==='65plus'||id==='work'&&value!=='ready'||id==='reason'&&value==='unknown'||id==='contractWindow'&&value!=='before202704'||id==='recent'&&(!['12months','6months'].includes(value)||value==='6months'&&answers.reason==='self')||id==='period'&&(value==='unknown'||value==='under1'&&answers.recent==='12months'||value==='20plus'&&answers.age==='under30')||id==='category'&&!['none','confirmed'].includes(value);
  }
  function accept(value){
    const current=sequence(), q=current[index];
    const pos=questions.findIndex(item=>item.id===q.id);
    if(answers[q.id]!==value)questions.slice(pos+1).forEach(item=>delete answers[item.id]);
    answers[q.id]=value;
    if(finishEarly(q.id,value)){showResult();return;}
    index++;
    if(index>=sequence().length)showResult();else renderQuestion();
  }
  function answerList(){
    return sequence().filter(q=>Object.hasOwn(answers,q.id)).map(q=>[q.title,q.salary?(answers.monthlyYen?yen(answers.monthlyYen):'未確認'):q.options.find(o=>o[0]===answers[q.id])[1]]);
  }
  function showResult(){
    const r=guide.estimate(answers), answered=answerList();
    const amount=r.total!==null?`<div class="estimate-amount"><span>所定給付日数の全日分を受け取る場合の総額</span><strong>${new Intl.NumberFormat('ja-JP').format(r.total)}<small>円</small></strong><p>基本手当日額 ${yen(r.daily)} × ${r.days}日</p></div>`:r.days!==null?`<div class="estimate-amount"><span>所定給付日数の目安</span><strong>${r.days}<small>日</small></strong><p>日額・総額は未算出です</p></div>`:'';
    const notes=r.notes.map(text=>`<li>${text}</li>`).join('');
    const assumptions=answered.map(([title,label])=>`<div><dt>${title}</dt><dd>${label}</dd></div>`).join('');
    resultText=`ちかみち給付金｜${r.title}\n${r.total!==null?`${yen(r.total)}（${yen(r.daily)}×${r.days}日）`:r.days!==null?`${r.days}日・金額未算出`:'受給できないという判定ではありません。'}\n${r.category}\n\n${r.notes.join('\n')}\n\n回答条件\n${answered.map(x=>x.join('：')).join('\n')}\n計算基準：${guide.BASIS}\n出典：${guide.sources.rates}\n${guide.sources.days}`;
    content.innerHTML=`<span class="result-badge">診断・結果表示ともに無料</span><h2 id="check-heading" tabindex="-1">${r.title}</h2>${amount}<p class="result-lead">${r.category||(r.status==='outside'?'この診断の試算対象外です。受給できないという判定ではありません。':'金額の試算には、以下の条件の確認が必要です。受給できないという判定ではありません。')}</p><ul class="estimate-notes">${notes}</ul><details class="answer-summary"><summary>回答した条件を確認する</summary><dl>${assumptions}</dl></details><p class="result-disclaimer">この診断は民間の情報提供サービスです。正式な受給資格・金額はハローワークが確認します。診断だけで申請は完了しません。</p><p class="result-source">基準：${guide.BASIS}<br>出典：<a href="${guide.sources.rates}" target="_blank" rel="noopener noreferrer">厚生労働省の計算表（PDF）↗</a>・<a href="${guide.sources.days}" target="_blank" rel="noopener noreferrer">給付日数表 ↗</a></p><a class="result-link" href="service/">サービスについて見る ${arrow}</a><div class="result-actions"><button data-copy>結果をコピー</button><button data-edit>回答を見直す</button><button data-restart>最初から診断する</button></div><p class="copy-feedback" role="status"></p>`;
    focusTitle();
  }
  function start(trigger){lastTrigger=trigger;index=0;answers={};renderQuestion();dialog.showModal();lock();focusTitle();}
  document.querySelectorAll('[data-start]').forEach(button=>button.addEventListener('click',()=>start(button)));
  content.addEventListener('click',async event=>{
    const answer=event.target.closest('[data-answer]');
    if(answer){accept(answer.dataset.answer);return;}
    if(event.target.closest('[data-back]')&&index>0){index--;renderQuestion();}
    if(event.target.closest('[data-salary-unknown]'))accept(null);
    if(event.target.closest('[data-restart]')){index=0;answers={};renderQuestion();}
    if(event.target.closest('[data-edit]')){index=0;renderQuestion();}
    if(event.target.closest('[data-copy]')){
      const status=content.querySelector('.copy-feedback');
      try{await navigator.clipboard.writeText(resultText);status.textContent='結果をコピーしました。';}
      catch{status.textContent='コピーできませんでした。結果の文章を選択してコピーしてください。';}
    }
  });
  content.addEventListener('submit',event=>{
    if(event.target.id!=='salary-form')return;event.preventDefault();
    const input=content.querySelector('#monthly-salary'), number=Number(input.value);
    if(!input.checkValidity()||!Number.isFinite(number)||number<=0||number>1000){content.querySelector('#salary-error').textContent='0より大きい額面月給を、万円単位で入力してください（上限1,000万円）。';input.focus();return;}
    accept(Math.round(number*10000));
  });
  document.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{unlock();lastTrigger?.focus({preventScroll:true});});
  const info={
    about:{title:'このサイトについて',html:'<p>雇用保険の基本手当について、入力条件に応じた日額・日数・総額の目安と、確認事項をご案内する民間の無料サービスです。行政機関・支給窓口ではありません。</p><p>診断から結果表示まで無料です。有料契約、申請代行、連絡先の登録は必要ありません。</p><p><a href="service/#profile">運営会社</a>・<a href="service/#contact">お問い合わせ</a>・<a href="service/#commerce">無料の範囲と利用条件</a>をご確認いただけます。</p><p>掲載の人物はAIで生成したイメージです。</p>'},
    privacy:{title:'回答の取り扱い',html:'<p>診断には氏名・電話番号・メールアドレスの入力は不要です。回答はこのブラウザのメモリ上だけで計算に使用し、外部への送信や永続保存は行いません。再読み込みすると消えます。</p><p>サイトの配信事業者は、配信・安全管理のためアクセス情報を処理する場合があります。お問い合わせメールや外部の公式リンク先は診断とは別の取り扱いです。</p><p><a href="service/#privacy">プライバシーポリシーの全文を見る</a></p>'}
  };
  document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{infoTrigger=button;const item=info[button.dataset.info];document.querySelector('#info-title').textContent=item.title;document.querySelector('#info-content').innerHTML=item.html;infoDialog.showModal();lock();}));
  document.querySelector('[data-info-close]').addEventListener('click',()=>infoDialog.close());
  infoDialog.addEventListener('close',()=>{unlock();infoTrigger?.focus({preventScroll:true});});
  [dialog,infoDialog].forEach(el=>el.addEventListener('click',event=>{if(event.target!==el)return;const rect=el.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)el.close();}));
  if(location.hash==='#diagnosis')start(document.querySelector('[data-start]'));
})();
