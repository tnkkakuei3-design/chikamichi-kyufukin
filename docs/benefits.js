/* Basic allowance estimate. Source: MHLW 2026-08-01 leaflet and Hello Work benefit-days table. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BenefitGuide = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BASIS = '2026年8月1日';
  const ages = ['under30', '30to34', '35to44', '45to59', '60to64', '65plus'];
  const periods = ['under1', '1to4', '5to9', '10to19', '20plus'];
  const caps = {under30:7450, '30to34':8270, '35to44':8270, '45to59':9110, '60to64':7830};
  const specialDays = {
    under30:[90,90,120,180,null], '30to34':[90,120,180,210,240],
    '35to44':[90,150,180,240,270], '45to59':[90,180,240,270,330],
    '60to64':[90,150,180,210,240]
  };
  const sources = {
    rates:'https://www.mhlw.go.jp/content/001726934.pdf',
    days:'https://www.hellowork.mhlw.go.jp/insurance/insurance_benefitdays.html',
    eligibility:'https://www.hellowork.mhlw.go.jp/insurance/insurance_basicbenefit.html',
    reasons:'https://www.hellowork.mhlw.go.jp/insurance/insurance_range.html'
  };
  function dailyAmount(age, monthlyYen) {
    if (!Object.hasOwn(caps, age) || typeof monthlyYen !== 'number' || !Number.isFinite(monthlyYen) || monthlyYen <= 0) return null;
    const wage = Math.max(3203, monthlyYen * 6 / 180);
    let value;
    if (wage < 5480) value = wage * 0.8;
    else if (age === '60to64') {
      value = wage <= 12120 ? Math.min(0.8*wage - 0.35*((wage-5480)/6640)*wage, 0.05*wage+4848) : wage*0.45;
    } else value = wage <= 13490 ? 0.8*wage - 0.3*((wage-5480)/8010)*wage : wage*0.5;
    return Math.min(caps[age], Math.max(2562, Math.floor(value + 1e-8)));
  }
  function estimate(a) {
    const r = {status:'confirm', title:'確認が必要な項目があります', daily:null, days:null, total:null, category:'', notes:[], basis:BASIS};
    const stop = (title,note) => {r.title=title;r.notes.push(note);return r;};
    if (!ages.includes(a.age)) return stop('退職時の年齢を確認してください','年齢により、対象制度と日額・日数が変わります。');
    if (a.age === '65plus') {r.status='outside';return stop('65歳以上は別の給付を確認してください','高年齢求職者給付金などが対象となる場合があります。この基本手当の試算では金額を算出しません。');}
    if (a.work === 'notready') return stop('すぐに働けない事情の確認が先です','基本手当には、働く意思と能力があり求職していることが必要です。病気・育児などの場合は受給期間の延長等の手続きを確認してください。');
    if (a.work === 'newjob') return stop('再就職の状況を確認してください','就職が決まった時期や手続き状況で扱いが変わります。再就職手当などは、この試算に含めていません。');
    if (a.work !== 'ready') return stop('今後の求職の希望を確認してください','退職後、働ける状態で仕事を探すことが基本手当の条件です。');
    if (!['self','dismissal','contract','justified'].includes(a.reason)) return stop('離職理由の区分を確認してください','離職票の記載と実際の事情を確認しましょう。自己都合・会社都合・特定理由などの最終的な判断はハローワークが行います。');
    if (a.reason === 'contract' && a.contractWindow !== 'before202704') return stop('雇止めの離職日を確認してください','一部の特定理由離職者に対する日数の特例は、2027年3月31日までの離職が対象です。それ以降・未定の場合は適用を再確認してください。');
    if (a.recent === 'none') return stop('雇用保険の加入記録を確認してください','未加入の場合、この基本手当の試算はできません。勤務実態と加入記録に相違がある場合は、窓口で確認できます。');
    if (a.recent === 'short') return stop('受給資格に必要な期間を確認してください','一般的には離職前2年間に12か月以上、特定受給資格者・特定理由離職者は離職前1年間に6か月以上の被保険者期間が必要です。特例や期間の通算は窓口でご確認ください。');
    if (!['12months','6months'].includes(a.recent)) return stop('直近の被保険者期間を確認してください','賃金支払基礎日数が11日以上または80時間以上ある月を数えます。加入年数だけでは受給資格を判断できません。');
    if (a.recent === '6months' && a.reason === 'self') return stop('通常の自己都合退職の期間要件を確認してください','直近2年間に12か月以上の被保険者期間が原則です。特定理由などに該当する事情がある場合は、離職理由の確認が必要です。');
    const p = periods.indexOf(a.period);
    if (p < 0) return stop('給付日数に使う加入期間を確認してください','過去の受給や加入の空白期間によって通算の扱いが変わります。雇用保険の書類をもとに確認してください。');
    if (a.recent === '12months' && a.period === 'under1') return stop('加入期間の回答を確認してください','「直近2年に12か月以上」と「通算期間1年未満」は一致しません。回答を見直してください。');
    if (a.age === 'under30' && a.period === '20plus') return stop('年齢と加入期間の回答を確認してください','30歳未満・20年以上の組み合わせは、この試算の対象外です。入力内容をご確認ください。');
    if (!['none','confirmed'].includes(a.category)) return stop('就職困難者の区分を確認してください','障害などがあるだけで自動的にこの区分になるわけではありません。未確認の状態では300日・360日を前提に総額を表示しません。');
    if (a.category === 'confirmed') {
      r.days = p === 0 ? 150 : ['45to59','60to64'].includes(a.age) ? 360 : 300;
      r.category = '就職困難者として認められる場合';
    } else if (a.reason === 'dismissal' || a.reason === 'contract') {
      r.days = specialDays[a.age][p];
      r.category = '特定受給資格者・一部の特定理由離職者として認められる場合';
    } else {
      r.days = p < 3 ? 90 : p === 3 ? 120 : 150;
      r.category = a.reason === 'justified' ? '特定理由離職者（雇止めの特例以外）として認められる場合' : '一般の離職者に該当する場合';
    }
    r.daily = dailyAmount(a.age, a.monthlyYen);
    if (r.daily === null) {
      r.status='partial';r.title='給付日数の目安を確認できます';
      r.notes.push('平均月給が未入力のため、日額・総額は算出していません。');
    } else {
      r.status='estimate';r.title='回答条件に基づく試算結果';r.total=r.daily*r.days;
    }
    r.notes.push('離職理由・加入期間・対象区分が認められ、所定給付日数の全日分が支給される場合の試算です。受給資格・支給額の決定ではありません。');
    r.notes.push('2026年8月1日の計算基準を全期間に適用しています。実際には毎年の改定、再就職、就労、失業認定などにより総額が変わります。');
    if (a.reason !== 'self') r.notes.push('離職理由の最終的な区分は、離職票や事実関係に基づきハローワークが判断します。');
    return r;
  }
  return Object.freeze({BASIS,sources,dailyAmount,estimate});
});
