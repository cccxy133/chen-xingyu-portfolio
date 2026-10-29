const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
class Element {
  constructor() { this.events = new Map(); this.hidden = false; this.textContent = ''; this.value = 'lite'; this.open = false; this.attrs = {}; }
  addEventListener(type, fn, opts) { const list = this.events.get(type) || []; list.push({ fn, once: opts?.once }); this.events.set(type, list); }
  removeEventListener(type, fn) { this.events.set(type, (this.events.get(type) || []).filter(x => x.fn !== fn)); }
  fire(type, extra = {}) { for (const item of [...(this.events.get(type) || [])]) { if (item.once) this.removeEventListener(type, item.fn); item.fn({ target: this, ...extra }); } }
  focus() { this.focused = true; }
  getAttribute(key) { return this.attrs[key]; }
  removeAttribute(key) { delete this.attrs[key]; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
}
class Video extends Element {
  constructor() { super(); this.currentTime = 0; this.playbackRate = 1; this.paused = true; this.ended = false; this.duration = 30; this.loads = []; }
  set src(value) { this.attrs.src = value; }
  get src() { return this.attrs.src; }
  load() { this.currentTime = 0; this.loads.push(this.src || null); }
  pause() { this.paused = true; this.fire('pause'); }
  play() { if (this.blockPlay) return Promise.reject({ name: 'NotAllowedError' }); this.paused = false; return Promise.resolve(); }
}
const els = {};
for (const id of ['player-quality','player-quality-control','player-loading','player-error','player-title','player-kicker','player-role','player-description','retry-player','close-player']) els[id] = new Element();
const player = new Video(), dialog = new Element(), focus = new Element();
const window = { portfolioVideoVariants: { hongkong: 'film-lite.mp4', carp: 'film-lite.mp4' } };
const document = { querySelector: s => els[s.slice(1)], activeElement: focus, body: { classList: { add() {}, remove() {} } } };
const context = { window, document, setTimeout, clearTimeout, console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../player.js'), 'utf8'), context);
const projects = ['hongkong','carp','heritage'].map(id => ({ id, title:id, series:'test', en:'test', duration:'00:30', role:'test', detail:'test', cover:id+'.jpg' }));
let opens=0, closes=0;
const controller = window.createPortfolioPlayer({ player, dialog, projects, onOpen:()=>opens++, onClose:()=>closes++ });
(async()=>{
 assert.equal(player.loads.length,0,'no video preload before a user selection');
 controller.open('hongkong');
 assert.equal(player.src,'assets/hongkong/film-lite.mp4');
 player.fire('loadedmetadata'); player.currentTime=12; player.playbackRate=1.5;
 els['player-quality'].value='original'; els['player-quality'].fire('change');
 assert.equal(player.src,'assets/hongkong/film.mp4');
 player.fire('loadedmetadata');
 assert.equal(player.currentTime,12); assert.equal(player.playbackRate,1.5); assert.equal(player.paused,false);
 player.pause(); player.currentTime=18;
 els['player-quality'].value='lite'; els['player-quality'].fire('change'); player.fire('loadedmetadata');
 assert.equal(player.currentTime,18); assert.equal(player.paused,true,'quality changes preserve pause');
 const oldLoads=player.loads.length;
 controller.open('unknown'); assert.equal(player.loads.length,oldLoads);
 controller.open('carp');
 const stale=player.events.get('loadedmetadata')[0].fn;
 dialog.close(); stale();
 assert.equal(player.src,undefined); assert.equal(player.paused,true); assert.equal(els['player-loading'].hidden,true);
 assert.equal(focus.focused,true);
 controller.open('heritage');
 assert.equal(player.src,'assets/heritage/film.mp4'); assert.equal(els['player-quality-control'].hidden,true);
 player.fire('loadedmetadata'); player.currentTime=9; player.fire('error');
 assert.equal(els['player-error'].hidden,false); assert.equal(els['player-loading'].hidden,true);
 els['retry-player'].fire('click'); player.fire('loadedmetadata');
 assert.equal(player.currentTime,9); assert.equal(els['player-error'].hidden,true);
 dialog.close(); player.blockPlay=true; controller.open('hongkong'); await Promise.resolve();
 assert.match(els['player-loading'].textContent,/点击播放/);
 dialog.close();
 assert.equal(opens,4); assert.equal(closes,3);
 console.log('PASS: no preload; lite/original switching; seek, pause and speed preservation; invalid ID; close cancellation; unchanged low-bitrate source; retry; autoplay restriction.');
})().catch(err=>{console.error(err);process.exitCode=1;});
