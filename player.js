/* Load only the selected film. Keep original files available for portfolio review. */
(() => {
  'use strict';
  window.createPortfolioPlayer = function ({ dialog, player, projects, onOpen, onClose }) {
    const $ = selector => document.querySelector(selector);
    const quality = $('#player-quality');
    const qualityControl = $('#player-quality-control');
    const status = $('#player-loading');
    const error = $('#player-error');
    const variants = window.portfolioVideoVariants || {};
    const base = (window.PORTFOLIO_MEDIA_BASE || 'assets/').replace(/\/?$/, '/');
    let current = null, lastFocus = null, request = 0, timer = null;
    let pending = null, metadataListener = null, hasFailed = false;

    function clearLoading() {
      clearTimeout(timer);
      timer = null;
      status.hidden = true;
    }

    function showLoading() {
      if (!dialog.open || hasFailed) return;
      clearTimeout(timer);
      status.hidden = false;
      status.textContent = '正在加载视频…';
      timer = setTimeout(() => {
        if (!dialog.open) return;
        status.textContent = quality.value === 'original' && variants[current.id]
          ? '加载较慢，可以切换到流畅画质。'
          : '当前网络较慢，视频仍在加载，请稍候…';
      }, 8000);
    }

    function stopSource() {
      request++;
      if (metadataListener) player.removeEventListener('loadedmetadata', metadataListener);
      metadataListener = null;
      pending = null;
      clearLoading();
      player.pause();
      player.removeAttribute('src');
      player.load();
    }

    function position() {
      return pending ? pending.time : (Number.isFinite(player.currentTime) ? player.currentTime : 0);
    }

    function loadSource({ time = 0, play = true } = {}) {
      const rate = player.playbackRate;
      stopSource();
      if (!current || !dialog.open) return;
      hasFailed = false;
      error.hidden = true;
      const ticket = request;
      const file = quality.value === 'lite' && variants[current.id]
        ? variants[current.id] : 'film.mp4';
      pending = { time, play };
      metadataListener = () => {
        if (ticket !== request || !dialog.open) return;
        const state = pending;
        pending = null;
        metadataListener = null;
        player.playbackRate = rate;
        if (state && state.time > 0 && Number.isFinite(player.duration)) {
          player.currentTime = Math.min(state.time, Math.max(0, player.duration - 0.05));
        }
        if (!state?.play) clearLoading();
      };
      player.addEventListener('loadedmetadata', metadataListener, { once: true });
      player.src = `${base}${current.id}/${file}`;
      player.load();
      showLoading();
      if (play) {
        player.play().catch(reason => {
          if (ticket !== request || !dialog.open) return;
          if (reason.name === 'NotAllowedError') {
            clearTimeout(timer);
            if (pending) pending.play = false;
            status.hidden = false;
            status.textContent = '视频已准备加载，请点击播放按钮。';
          }
          // Decode/network errors are handled by the media error event.
        });
      }
    }

    function open(id) {
      const project = projects.find(p => p.id === id);
      if (!project) return;
      current = project;
      lastFocus = document.activeElement;
      $('#player-title').textContent = project.title;
      $('#player-kicker').textContent = `${project.series} / ${project.en} / ${project.duration}`;
      $('#player-role').textContent = project.role;
      $('#player-description').textContent = project.detail;
      qualityControl.hidden = !variants[project.id];
      quality.value = variants[project.id] ? 'lite' : 'original';
      player.poster = project.cover || `assets/${project.id}/poster.jpg`;
      if (!dialog.open) dialog.showModal();
      document.body.classList.add('modal-open');
      onOpen?.();
      loadSource();
      $('#close-player').focus();
    }

    quality.addEventListener('change', () => {
      const time = position();
      const play = pending ? pending.play : !player.paused && !player.ended;
      loadSource({ time, play });
    });
    $('#retry-player').addEventListener('click', () => {
      if (current) loadSource({ time: position(), play: true });
    });
    $('#close-player').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      stopSource();
      current = null;
      document.body.classList.remove('modal-open');
      onClose?.();
      lastFocus?.focus({ preventScroll: true });
    });
    player.addEventListener('playing', clearLoading);
    player.addEventListener('canplay', clearLoading);
    player.addEventListener('pause', clearLoading);
    player.addEventListener('waiting', () => { if (!player.paused) showLoading(); });
    player.addEventListener('error', () => {
      if (!dialog.open || !player.getAttribute('src')) return;
      hasFailed = true;
      clearLoading();
      error.hidden = false;
    });
    return { open };
  };
})();
