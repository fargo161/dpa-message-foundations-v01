import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/encounter/turn-player.js', import.meta.url), 'utf8');
const { createTurnPlayer } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

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
