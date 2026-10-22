(() => {
  'use strict';
  const dialog = document.querySelector('#check-dialog');
  const content = document.querySelector('#check-content');
  const infoDialog = document.querySelector('#info-dialog');
  const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
  const tick = '<span class="check-dot"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></span>';
  const official = 'https://www.hellowork.mhlw.go.jp/insurance/insurance_basicbenefit.html';
  const service = 'service/';
  const questions = [
    { id: 'status', title: '現在の状況を教えてください', hint: 'いちばん近いものを選んでください。', options: [
      ['considering','退職を考えている'],['planned','退職日が決まっている'],['left','すでに退職した'],['newjob','再就職が決まっている']
    ]},
    { id: 'age', title: '退職時の年齢を教えてください', hint: '退職前の方は、退職予定時の年齢を選んでください。', options: [['under65','64歳以下'],['over65','65歳以上']]},
    { id: 'insurance', title: '雇用保険に加入していますか？', hint: '退職済みの方は、退職前の状況を選んでください。', options: [['yes','加入している・加入していた'],['no','加入していない・加入していなかった'],['unknown','わからない']]},
    { id: 'work', title: '再就職について教えてください', hint: '今の希望・状況に近いものを選んでください。', options: [['ready','働ける状態で、再就職を希望している'],['notready','すぐには働けない事情がある'],['undecided','まだ決まっていない']]}
  ];
  let index = 0;
  let answers = {};
  let lastTrigger = null;
  let resultText = '';
  let toastTimer;
  function lock(){ document.body.classList.add('modal-open'); }
  function unlock(){ if(!dialog.open && !infoDialog.open) document.body.classList.remove('modal-open'); }
  function focusTitle(){ content.querySelector('h2')?.focus({preventScroll:true}); dialog.scrollTop=0; }
  function renderQuestion(){
    const q=questions[index];
    content.innerHTML=`<div class="check-progress" role="progressbar" aria-label="質問の進み具合" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${index+1}">${questions.map((_,i)=>`<span class="${i<=index?'done':''}"></span>`).join('')}</div>
      <p class="question-count">QUESTION <b>${index+1}</b> / 4</p><h2 id="check-heading" tabindex="-1">${q.title}</h2><p class="question-hint">${q.hint}</p>
      <div class="question-options">${q.options.map(([value,label])=>`<button class="option-button" data-answer="${value}" aria-pressed="${answers[q.id]===value}">${label}${arrow}</button>`).join('')}</div>
      <div class="dialog-bottom"><button class="back-button" data-back ${index===0?'disabled':''}>前の質問に戻る</button><span class="privacy-mini">回答は外部に送信されません</span></div>`;
    focusTitle();
  }
  function buildResult(a){
    const points=[];
    if(a.status==='newjob') points.push(['再就職が決まっていることを伝える','仕事が決まった時期や、雇用保険の手続きの状況によって確認内容が変わります。まずはその状況をハローワークに伝えてください。']);
    else if(a.status==='considering'||a.status==='planned') points.push(['退職前の書類・加入状況を確認','雇用保険被保険者証や給与明細を確認し、退職日と退職理由を整理しておきましょう。退職前の準備に役立ちます。']);
    else points.push(['離職票と退職時の状況を確認','離職票の受け取り状況や記載内容を確認しましょう。交付されない場合も、管轄のハローワークへ相談できます。']);
    if(a.insurance==='yes') points.push([a.age==='over65'?'高年齢求職者給付金の条件を確認':'雇用保険の基本手当の条件を確認',a.age==='over65'?'65歳以上の被保険者は、基本手当とは異なる給付の対象となる場合があります。加入期間など、ご自身の条件を窓口で確認してください。':'加入していた期間や離職理由によって確認すべき条件が変わります。加入していたことだけで受給が決まるわけではありません。']);
    else if(a.insurance==='unknown') points.push(['雇用保険に加入していたかを確認','給与明細や雇用保険の書類を確認してください。判断がつかない場合は、勤務先またはハローワークへ確認しましょう。']);
    else points.push(['雇用保険の加入記録を窓口で確認','雇用保険の給付には加入状況の確認が必要です。勤務実態と加入記録について、ハローワークで相談してみましょう。']);
    if(a.work==='notready') points.push(['すぐに働けない事情を窓口へ相談','働ける状態であることは給付の重要な条件です。受給期間の延長などの扱いは、年齢や事情により異なるため、窓口で確認してください。']);
    else if(a.work==='undecided') points.push(['今後の働き方・求職の希望を整理','働く意思や就職できる状態かどうかも確認の対象です。今後の希望を整理し、ご自身の場合を窓口で相談しましょう。']);
    else points.push(['求職の申込み・必要な手続きを確認','受給の確認には求職の申込みなどの手続きが必要です。公式の案内を読み、ご自身に必要な書類や手続きを確認しましょう。']);
    return points;
  }
  function getLineUrl(){
    try{const url=new URL(window.CHIKAMICHI_CONFIG?.lineUrl);return url.protocol==='https:'&&['lin.ee','line.me'].includes(url.hostname)?url.href:null;}catch{return null;}
  }
  function showResult(){
    const points=buildResult(answers);
    const line=getLineUrl();
    resultText='ちかみち給付金｜あなたの確認ポイント\n\n'+points.map(([title,text],i)=>`${i+1}. ${title}\n${text}`).join('\n\n')+'\n\nこのチェックは受給資格・金額の判定ではありません。\nサポート内容：'+new URL(service,location.href).href+'\n公式案内：'+official;
    content.innerHTML=`<span class="result-badge">4問のチェックが完了しました</span><h2 id="check-heading" tabindex="-1">あなたの確認ポイント</h2><p class="result-lead">回答に合わせて、次に確認したいことを<br>3つに整理しました。</p><ol class="result-points">${points.map(([title,text])=>`<li>${tick}<div><b>${title}</b><p>${text}</p></div></li>`).join('')}</ol><p class="result-disclaimer">この結果は、受給できる・できないの判定や、金額の見積もりではありません。ご自身の条件は、管轄のハローワークでご確認ください。</p>${line?`<a class="result-link green" href="${line}" target="_blank" rel="noopener noreferrer">LINEで相談する ${arrow}</a>`:''}<a class="result-link" href="${service}">サポート内容を確認する ${arrow}</a><div class="result-actions"><button data-copy>確認ポイントをコピー</button><button data-restart>もう一度チェックする</button></div>`;
    focusTitle();
  }
  document.querySelectorAll('[data-start]').forEach(button=>button.addEventListener('click',()=>{lastTrigger=button;index=0;answers={};renderQuestion();dialog.showModal();lock();focusTitle();}));
  content.addEventListener('click',async event=>{
    const answer=event.target.closest('[data-answer]');
    if(answer){
      answers[questions[index].id]=answer.dataset.answer;
      if(index<questions.length-1){index++;renderQuestion();}else{index=questions.length;showResult();}
      return;
    }
    if(event.target.closest('[data-back]')&&index>0){index--;renderQuestion();}
    if(event.target.closest('[data-restart]')){index=0;answers={};renderQuestion();}
    if(event.target.closest('[data-copy]')){
      try{await navigator.clipboard.writeText(resultText);toast('確認ポイントをコピーしました');}
      catch{toast('コピーできませんでした。結果の文章を選択してコピーしてください。');}
    }
  });
  document.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{unlock();lastTrigger?.focus({preventScroll:true});});
  const info={
    about:{title:'このサイトについて',html:'<p>「ちかみち給付金」は、退職後の給付制度について確認するための情報ガイドです。このページの簡易チェックは、回答に応じた確認事項を整理するものです。</p><p>チェック後は、ちかみち給付金サポートのサービス内容をご覧いただけます。<a href="service/#profile">会社情報</a>・<a href="service/#commerce">サービス料金</a>・<a href="service/#contact">お問い合わせ先</a>はこちらからも確認できます。</p><p>行政機関や給付金の支給窓口ではなく、このページで申請や受給資格の決定を行うことはできません。制度の詳細とご自身の条件は、ハローワークの公式案内・窓口でご確認ください。</p><p>掲載の人物は、AIで生成したイメージです。</p><p><a href="'+official+'" target="_blank" rel="noopener noreferrer">ハローワーク：基本手当について ↗</a></p>'},
    privacy:{title:'プライバシーについて',html:'<p>このページの無料チェックでは、氏名・電話番号・メールアドレスなどの連絡先を入力する必要はありません。</p><p>チェックの回答は、このページ内で確認ポイントを表示するためにのみ使用します。回答を外部に送信したり、ブラウザに永続保存したりする処理はありません。ページを再読み込みすると回答は消えます。</p><p>サポートサービスの個人情報の取り扱いは、<a href="service/#privacy">プライバシーポリシー</a>をご確認ください。</p><p>外部の公式案内やLINEなどのリンク先では、それぞれのサービスのプライバシーポリシーが適用されます。</p>'}
  };
  document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{const item=info[button.dataset.info];document.querySelector('#info-title').textContent=item.title;document.querySelector('#info-content').innerHTML=item.html;infoDialog.showModal();lock();}));
  document.querySelector('[data-info-close]').addEventListener('click',()=>infoDialog.close());
  infoDialog.addEventListener('close',unlock);
  [dialog,infoDialog].forEach(el=>el.addEventListener('click',event=>{if(event.target!==el)return;const rect=el.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)el.close();}));
  function toast(message){const node=document.querySelector('.toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),3500);}
})();
