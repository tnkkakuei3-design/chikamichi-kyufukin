const {test} = require('node:test');
const assert = require('node:assert/strict');
const {dailyAmount,estimate} = require('../docs/benefits.js');
const base={age:'45to59',work:'ready',reason:'self',recent:'12months',period:'1to4',category:'confirmed',monthlyYen:520000};
test('advertised conditional example uses 8,666 yen × 360 days, not a 3.1m cap',()=>{
  const r=estimate(base);assert.equal(r.daily,8666);assert.equal(r.days,360);assert.equal(r.total,3119760);
  assert.equal(estimate({...base,monthlyYen:600000}).total,3279600);
});
test('same salary does not imply the same total for ordinary resignation',()=>{
  const r=estimate({...base,category:'none'});assert.equal(r.days,90);assert.equal(r.total,779940);
});
test('official age-specific caps and minimum',()=>{
  for(const [age,cap] of [['under30',7450],['30to34',8270],['35to44',8270],['45to59',9110],['60to64',7830]]) assert.equal(dailyAmount(age,1000000),cap);
  assert.equal(dailyAmount('45to59',90000),2562);
  assert.equal(dailyAmount('under30',510000),7450);
});
test('progressive formulas and age 60 alternative formula',()=>{
  assert.equal(dailyAmount('35to44',300000),6307);
  assert.equal(dailyAmount('60to64',300000),5348);
  assert.equal(dailyAmount('45to59',164400),4384);
  assert.equal(dailyAmount('60to64',363600),5454);
});
test('90/120/150 general days and special age/period cells',()=>{
  for(const [period,days] of [['1to4',90],['5to9',90],['10to19',120],['20plus',150]]) assert.equal(estimate({...base,category:'none',period}).days,days);
  assert.equal(estimate({...base,reason:'dismissal',category:'none',period:'20plus'}).days,330);
  assert.equal(estimate({...base,age:'30to34',reason:'dismissal',category:'none',period:'5to9'}).days,180);
  assert.equal(estimate({...base,age:'60to64',reason:'dismissal',category:'none',period:'1to4'}).days,150);
});
test('six-month rule is not granted for ordinary voluntary resignation',()=>{
  assert.equal(estimate({...base,recent:'6months',period:'under1'}).total,null);
  const r=estimate({...base,recent:'6months',period:'under1',reason:'justified',category:'none'});assert.equal(r.days,90);
  assert.equal(estimate({...base,recent:'6months',period:'under1',reason:'dismissal'}).days,150);
});
test('unconfirmed facts and inconsistent inputs never get a payout estimate',()=>{
  for(const patch of [{work:'notready'},{work:'newjob'},{age:'65plus'},{category:'possible'},{category:'unknown'},{reason:'unknown'},{recent:'unknown'},{recent:'none'},{recent:'short'},{period:'unknown'},{period:'under1'}]) assert.equal(estimate({...base,...patch}).total,null);
  assert.equal(estimate({...base,age:'under30',period:'20plus'}).total,null);
});
test('contract exception is date-gated',()=>{
  for(const contractWindow of [undefined,'after202704','unknown']) assert.equal(estimate({...base,reason:'contract',contractWindow}).total,null);
  assert.equal(estimate({...base,reason:'contract',contractWindow:'before202704',category:'none'}).days,180);
});
test('unknown salary retains days but invents no amount',()=>{
  const r=estimate({...base,monthlyYen:null});assert.equal(r.status,'partial');assert.equal(r.days,360);assert.equal(r.total,null);
  for(const n of [0,-1,NaN,Infinity,'520000',null]) assert.equal(dailyAmount('45to59',n),null);
});
