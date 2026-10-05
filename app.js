const slides = [...document.querySelectorAll('.slide')];
const canvas = document.getElementById('canvas');
const numberEl = document.getElementById('slideNumber');
const helpEl = document.getElementById('help');
const notesEl = document.getElementById('speakerNotes');
const noteTextEl = document.getElementById('speakerNoteText');
const startGateEl = document.getElementById('startGate');
const startFullscreenEl = document.getElementById('startFullscreen');

const speakerNotes = [
  '다섯 명이 함께 돈을 모으고, 세 명이 동의해야 지출 가능한 공동계좌 Moa 소개. 정상 사용과 변조 방어의 두 시연 예고.',
  '승인 숫자만으로는 거래 안전성을 보장할 수 없음. 승인자가 본 내용과 실제 실행 데이터의 일치 필요.',
  '사전 촬영 Happy Path 영상 재생. 다섯 명의 공동자금, 제주도 숙소 0.32 ETH 제안, A·B·C 승인, 결제 실행 순서.',
  '다섯 명 중 서로 다른 세 명의 동의 필요. 주소, 금액, 행동, 만료 시간은 컨트랙트 관리 대상.',
  '서명자 수와 독립 방어선 수의 차이 설명. 같은 화면과 장비에 의존하면 하나의 침해가 여러 승인을 동시에 무력화.',
  'Bybit는 표시, Humanity는 보관, Drift는 시간 도메인의 실패. 공통점은 하나의 침해가 여러 승인을 함께 무력화했다는 점.',
  'Chain of Custody 설명. 코드에서 표시, 승인, 시간을 거쳐 실제 실행까지 거래 의미의 보존 필요.',
  'Moa의 세 조건 설명. 서로 다른 세 승인, 유효한 Intent, 실제 실행 내용과의 일치.',
  '받는 주소와 금액, 만료 시간을 묶은 Intent Hash 설명. 값 하나만 달라져도 다른 Hash 생성과 실행 중단.',
  '사전 촬영 Attack Path 영상 재생. 승인 완료 후 받는 주소만 HOTEL에서 ATTACKER로 변경하는 실험.',
  'Threshold, Intent, Time 통과 후 Execution Match 실패. 공동계좌 잔액 변화 없이 실행 차단.',
  'Moa의 결론. 승인 숫자와 실행 내용을 함께 검증하여 사용자가 서명한 조건을 실행 시점까지 보존.'
];

let current = 0;
let step = 0;

function fitCanvas() {
  const viewportWidth = window.visualViewport?.width || document.documentElement.clientWidth;
  const viewportHeight = window.visualViewport?.height || document.documentElement.clientHeight;
  const scale = Math.min(viewportWidth / 1920, viewportHeight / 1080);
  document.documentElement.style.setProperty('--scale', scale.toFixed(4));
  document.documentElement.style.setProperty('--frame-width', `${1920 * scale}px`);
  document.documentElement.style.setProperty('--frame-height', `${1080 * scale}px`);
}

function fragmentsFor(index) {
  return [...slides[index].querySelectorAll('.fragment')];
}

function maxStep(index) {
  return fragmentsFor(index).reduce((max, item) => Math.max(max, Number(item.dataset.step || 0)), 0);
}

function applyFragments() {
  fragmentsFor(current).forEach(item => {
    item.classList.toggle('is-visible', Number(item.dataset.step || 0) <= step);
  });
  const path = slides[current].querySelector('.custody-signal');
  if (path) path.style.animationPlayState = step > 0 ? 'running' : 'paused';
}

function pauseAllVideos() {
  document.querySelectorAll('video').forEach(video => {
    video.pause();
    video.closest('[data-video-shell]')?.classList.remove('is-playing');
  });
}

function showSlide(index, requestedStep = 0) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === next);
    slide.classList.toggle('was-active', i < next);
  });
  current = next;
  step = Math.max(0, Math.min(maxStep(current), requestedStep));
  applyFragments();
  pauseAllVideos();
  numberEl.textContent = String(current + 1).padStart(2, '0');
  noteTextEl.textContent = speakerNotes[current];
  history.replaceState(null, '', `#slide-${current + 1}`);
}

function next() {
  const max = maxStep(current);
  if (step < max) { step += 1; applyFragments(); return; }
  if (current < slides.length - 1) showSlide(current + 1, 0);
}

function previous() {
  if (step > 0) { step -= 1; applyFragments(); return; }
  if (current > 0) showSlide(current - 1, maxStep(current - 1));
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
}

async function startPresentation() {
  try {
    await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
  } catch {
    startFullscreenEl.querySelector('span').textContent = 'F 키로 전체 화면 전환';
  } finally {
    startGateEl.classList.add('is-dismissed');
  }
}

function toggleVideo() {
  const shell = slides[current].querySelector('[data-video-shell]');
  if (!shell) return;
  const video = shell.querySelector('video');
  if (video.paused) {
    video.play().then(() => shell.classList.add('is-playing')).catch(() => {
      shell.querySelector('small').textContent = '영상 파일을 assets 폴더에 추가';
    });
  } else {
    video.pause();
    shell.classList.remove('is-playing');
  }
}

document.addEventListener('keydown', event => {
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); next(); }
  else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); previous(); }
  else if (event.key === 'Enter') { event.preventDefault(); toggleVideo(); }
  else if (event.key.toLowerCase() === 'f') toggleFullscreen();
  else if (event.key.toLowerCase() === 'r') showSlide(current, 0);
  else if (event.key.toLowerCase() === 'h' || event.key === '?') helpEl.hidden = !helpEl.hidden;
  else if (event.key.toLowerCase() === 'n') notesEl.hidden = !notesEl.hidden;
  else if (event.key === 'Escape') { helpEl.hidden = true; notesEl.hidden = true; }
});

document.querySelectorAll('video').forEach(video => {
  video.addEventListener('ended', () => video.closest('[data-video-shell]')?.classList.remove('is-playing'));
  video.addEventListener('error', () => {
    const small = video.closest('[data-video-shell]')?.querySelector('small');
    if (small) small.textContent = '영상 파일 대기';
  });
});

startFullscreenEl.addEventListener('click', event => {
  event.stopPropagation();
  startPresentation();
});

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;

  if (!helpEl.hidden) {
    helpEl.hidden = true;
    return;
  }

  if (event.target.closest('[data-video-shell]')) {
    toggleVideo();
    return;
  }

  if (event.target.closest('.speaker-notes, a, button')) return;
  next();
});

document.addEventListener('contextmenu', event => {
  event.preventDefault();
  if (!helpEl.hidden) {
    helpEl.hidden = true;
    return;
  }
  previous();
});

window.addEventListener('resize', fitCanvas);
window.visualViewport?.addEventListener('resize', fitCanvas);
document.addEventListener('fullscreenchange', fitCanvas);
window.addEventListener('hashchange', () => {
  const match = location.hash.match(/slide-(\d+)/);
  if (match) showSlide(Number(match[1]) - 1, 0);
});

fitCanvas();
const initial = location.hash.match(/slide-(\d+)/);
showSlide(initial ? Number(initial[1]) - 1 : 0, 0);
