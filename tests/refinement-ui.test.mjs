import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/encounter/turn-player.js', import.meta.url), 'utf8');
const { createTurnPlayer } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const app = await readFile(new URL('../public/encounter/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/encounter/index.html', import.meta.url), 'utf8');

// Execute the actual render functions with a text-only DOM. This verifies data
// contracts, not layout, focus behavior, or browser accessibility.
function renderHarness(snapshot) {
  const ids = new Map(), selectors = new Map();
  const element = (tag = 'div', text = '') => ({
    tag, ownText: String(text), children: [], hidden: false, value: '',
    get textContent() { return this.ownText + this.children.map(child => child.textContent).join(' '); },
    set textContent(value) { this.ownText = String(value); this.children = []; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.ownText = ''; this.children = children; },
    querySelector(selector) { if (!selectors.has(selector)) selectors.set(selector, element()); return selectors.get(selector); },
    setCustomValidity(value) { this.validityMessage = value; },
  });
  const $ = id => { if (!ids.has(id)) ids.set(id, element()); return ids.get(id); };
  const context = vm.createContext({ snapshot, $, node: element,
    termKeys: ['units', 'upfront', 'repayment', 'extra', 'days'],
    names: { units: 'Contra units', upfront: 'Cash now', repayment: 'New principal', extra: 'Additional repayment', days: 'Repay within (days)' },
    offer: () => snapshot.play.counteroffer,
    character: () => ({ name: 'Marcus' }), commercial: () => true,
    selectedAction: () => ({ intent: { action: 'DEAL' } }), refreshControls() {},
    document: { querySelector: selector => { if (!selectors.has(selector)) selectors.set(selector, element()); return selectors.get(selector); } },
  });
  for (const name of ['termTable', 'draftTerms', 'updateDraft', 'renderOffer', 'renderReceipt']) {
    const start = app.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} remains an executable renderer`);
    const remainder = app.slice(start), end = remainder.search(/\n(?:async )?function /);
    vm.runInContext(end < 0 ? remainder : remainder.slice(0, end), context);
  }
  return { $, selectors, run: name => vm.runInContext(`${name}()`, context) };
}

test('UI element references resolve to unique markup or explicitly created IDs', () => {
  const declared = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(declared).size, declared.length, 'duplicate markup IDs');
  const generated = [...app.matchAll(/\.id\s*=\s*"([^"]+)"/g)].map(match => match[1]);
  for (const [, id] of app.matchAll(/\$\("([^"]+)"\)/g)) {
    assert.ok(declared.includes(id) || generated.includes(id), `missing DOM ID ${id}`);
  }
});

test('receipt uses settled cash and exact accepted terms, never internal metadata or stale draft', () => {
  for (const [cash, upfront, principal, extra] of [[40, 40, 80, 10], [32, 48, 72, 11]]) {
    const snapshot = { options: { price: 60 }, play: {
      status: 'AGREED', metrics: { cash, debt: 250 + principal + extra }, obligations: { existing: 250 },
      agreement: { id: 'DO_NOT_RENDER_ID', version: 7, source: 'DO_NOT_RENDER_SOURCE', terms: { units: 2, upfront, repayment: principal, extra, days: 7 } },
      conversation: { outcomeQuality: { creditObjectiveMet: true, relationalConsequences: ['Confidence rose.'] } }, events: [],
    } };
    const before = JSON.stringify(snapshot), harness = renderHarness(snapshot);
    harness.run('renderReceipt');
    const text = harness.$('agreement').textContent;
    assert.ok(text.includes(`Cash remaining $${cash}`));
    assert.ok(text.includes(`$${principal + extra} in 7 days`));
    assert.ok(text.includes('Old debt: $250'));
    assert.match(text, /Accepted terms/);
    assert.doesNotMatch(text, /DO_NOT_RENDER|creditObjectiveMet|APPROVED_PROPOSAL/);
    assert.equal(harness.$('outcome').textContent, 'Confidence rose.');
    for (const [key, value] of Object.entries({ units: 2, upfront: 40, repayment: 80, extra: 10, days: 7 })) harness.$(key).value = String(value);
    harness.run('updateDraft');
    assert.equal(harness.$('draft-summary').textContent, '', 'no hypothetical second deduction after settlement');
    harness.run('renderOffer');
    assert.equal(harness.$('current-offer').textContent, '');
    assert.equal(harness.selectors.get('.offer-sheet').hidden, true);
    assert.equal(JSON.stringify(snapshot), before, 'presentation cannot mutate settled state');
  }
});

test('live offer retains exact terms, information condition, and replacement warning', () => {
  const snapshot = { play: { metrics: { cash: 80 }, events: [], counteroffer: {
    id: 'PRIVATE_OFFER_ID', version: 9, source: 'APPROVED_PROPOSAL',
    terms: { units: 2, upfront: 48, repayment: 72, extra: 11, days: 7 },
    informationExchange: { summary: 'Share the private collection instructions.' },
  } } };
  const before = JSON.stringify(snapshot), harness = renderHarness(snapshot);
  harness.run('renderOffer');
  const text = harness.$('current-offer').textContent;
  for (const value of ['48 cash', '2 Contra', '72 principal', '11 additional', '7 days', '32 cash retained', '83 new repayment', 'Share the private collection instructions.']) assert.ok(text.includes(value), value);
  assert.doesNotMatch(text, /PRIVATE_OFFER_ID/);
  assert.match(harness.$('accept-reason').textContent, /Clarification preserves.*Other discussion.*replaces/);
  assert.equal(harness.selectors.get('.offer-sheet').hidden, false);
  assert.equal(JSON.stringify(snapshot), before);
});

test('acceptance binds the current offer identity, not the editable draft', () => {
  const start = app.indexOf('function intentFields('), end = app.indexOf('\nfunction draftKey(', start);
  const context = vm.createContext({
    selectedAction: () => ({ available: true, intent: { action: 'ACCEPT' } }),
    delivery: { getSelection: () => ({ vibeId: 'EA', intensity: 'BALANCED' }) },
    keywordId: 'current-offer', actionId: 'accept-offer',
    offer: () => ({ id: 'current-exact-offer', version: 9 }),
    draftTerms: () => { throw new Error('Acceptance must not read draft terms'); },
  });
  vm.runInContext(app.slice(start, end), context);
  const accepted = vm.runInContext('intentFields()', context);
  assert.equal(accepted.offerId, 'current-exact-offer');
  assert.equal(accepted.offerVersion, 9);
  assert.equal(accepted.terms, undefined);
  context.offer = () => null;
  assert.equal(vm.runInContext('intentFields()', context), null);
});

test('compact actions preserve every authored choice in menu and completed choices in Revisit', () => {
  const start = app.indexOf('function renderKeywords('), end = app.indexOf('\nfunction fillOptions(', start);
  const boxes = new Map();
  const box = () => ({ textContent: '', hidden: false, children: [], append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; }, setAttribute() {}, addEventListener() {} });
  const $ = id => { if (!boxes.has(id)) boxes.set(id, box()); return boxes.get(id); };
  const actions = Array.from({ length: 20 }, (_, index) => ({ id: `action-${index}`, label: `Choice ${index}`, available: true, intent: { action: 'ASK', topic: `TOPIC_${index}` }, completion: { done: index === 0 }, description: index === 19 ? 'Exact detail is shared and cannot become private again.' : 'Ordinary question.' }));
  const keyword = { id: 'known', actions }, revisit = { hidden: true, lastElementChild: box() };
  const context = vm.createContext({ $, node: box, keywords: () => [keyword], selectedKeyword: () => keyword,
    selectedAction: () => actions[19], keywordId: 'known', actionId: 'action-19', revisit, builder: { open: true },
    actionButton: (_keyword, action) => action.id, renderEdge() {}, refreshControls() {},
  });
  vm.runInContext(app.slice(start, end), context);
  vm.runInContext('renderKeywords()', context);
  assert.deepEqual(Array.from($('keyword-actions').children), actions.map(action => action.id));
  assert.ok($('context-actions').children.includes('action-19'), 'selected non-primary action remains visible');
  assert.ok(!$('context-actions').children.includes('action-0'));
  assert.deepEqual(Array.from(revisit.lastElementChild.children), ['action-0']);
  assert.equal(revisit.hidden, false);
  assert.match($('action-description').textContent, /cannot become private again/);
  assert.equal(context.builder.open, false, 'questions collapse the offer draft');
});

test('skip and replay remain outside the disabled turn fieldset; no automatic acceptance submission', () => {
  const fieldsStart = html.indexOf('<fieldset id="turn-fields"'), fieldsEnd = html.indexOf('</fieldset>', fieldsStart);
  for (const id of ['skip', 'replay']) {
    const index = html.indexOf(`id="${id}"`);
    assert.ok(index >= 0 && (index < fieldsStart || index > fieldsEnd), `${id} must work during presentation and after ending`);
  }
  const start = app.indexOf('function applySnapshot('), end = app.indexOf('\nasync function getState(', start);
  assert.doesNotMatch(app.slice(start, end), /\b(?:submit|post)\(/, 'offer selection must never commit acceptance');
  assert.match(app, /offerId = offer\(\)\.id; fields\.offerVersion = offer\(\)\.version/);
  assert.match(app, /Asking keeps these exact terms open, but spends a turn/);
});

test('presentation holds response until skip and finishes exactly once', async () => {
  const observed = [], event = { playerText: 'My proposal', marcusText: 'My response' };
  const player = createTurnPlayer({ delay: 10000, reducedMotion: () => false,
    onReceiving: value => observed.push(['heard', value]),
    onResponding: value => observed.push(['responded', value]),
    onFinish: value => observed.push(['finished', value]),
  });
  const pending = player.play(event);
  assert.deepEqual(observed, [['heard', event]]);
  assert.equal(player.playing, true);
  player.skip(); player.skip();
  assert.equal(await pending, true);
  assert.deepEqual(observed, [['heard', event], ['responded', event], ['finished', event]]);
  assert.equal(player.playing, false);
});

test('cancelled presentation does not expose a stale response', async () => {
  const responses = [];
  const player = createTurnPlayer({ delay: 10000, onReceiving() {}, onResponding: value => responses.push(value), onFinish() {} });
  const stale = player.play({ id: 'old' });
  const latest = player.play({ id: 'new' });
  assert.equal(await stale, false);
  player.skip();
  assert.equal(await latest, true);
  assert.deepEqual(responses, [{ id: 'new' }]);
  const cancelled = player.play({ id: 'cancelled' });
  player.cancel(); player.skip();
  assert.equal(await cancelled, false);
  assert.deepEqual(responses, [{ id: 'new' }]);
});
