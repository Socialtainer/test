import './style.css';
import { course, tools, sections, steps, promptSlotHint } from './data/course.js';
import { samples, toCsv } from './data/samples.js';

const KEY = 'kfpi-practice-v1';
const app = document.getElementById('app');

// ── 저장소: 이 브라우저에만 저장 (외부 전송 없음) ──
const emptyState = () => ({ checks: {}, work: {}, memo: {}, reflect: {}, instructor: false });
let state = emptyState();
try {
  state = { ...emptyState(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
} catch {
  state = emptyState();
}
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 저장이 막힌 환경에서는 화면 안에서만 유지 */
  }
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const stepDone = (s) => {
  const c = state.checks[s.id] || [];
  return s.checklist.every((_, i) => c[i]);
};
const doneCount = () => steps.filter(stepDone).length;
const totalMinutes = steps.reduce((a, s) => a + s.minutes, 0);

// ── 공통 조각 ──
function header(route) {
  const pct = Math.round((doneCount() / steps.length) * 100);
  const link = (href, label, active) =>
    `<a href="${href}" ${active ? 'aria-current="page"' : ''}>${label}</a>`;
  return `
  <header class="top">
    <a class="brand" href="#/">${esc(course.org)} · AI 실습</a>
    <nav aria-label="주요 메뉴">
      ${link('#/', '처음', route === 'home')}
      ${link('#/guide', '실습 안내', route === 'guide')}
      ${link('#/step/' + steps[0].id, '실습', route === 'step')}
      ${link('#/result', '결과 정리', route === 'result')}
    </nav>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="실습 진행률">
      <span style="width:${pct}%"></span><em>${doneCount()}/${steps.length} 단계</em>
    </div>
  </header>`;
}

function sampleButtons(s) {
  if (!s.sample) return '';
  const sm = samples[s.sample];
  return `<button class="btn ghost" data-act="sample" data-key="${s.sample}">⬇ ${esc(sm.label)} 내려받기 <small>(추가 제안)</small></button>`;
}

// ── 화면 ──
function homeView() {
  const bySection = sections
    .map((sec) => {
      const list = steps.filter((s) => s.section === sec.id);
      return `<li><strong>${esc(sec.label)}</strong><span>${list.length}단계 · 약 ${list.reduce((a, s) => a + s.minutes, 0)}분</span></li>`;
    })
    .join('');
  return `
  <section class="hero card">
    <p class="eyebrow">${esc(course.org)}</p>
    <h1>${esc(course.title)}</h1>
    <p class="lead">${esc(course.subtitle)}</p>
    <p><strong>실습 후 만드는 결과물</strong> — ${esc(course.goal)}</p>
    <div class="cta">
      <a class="btn primary big" href="#/step/${steps[0].id}">실습 시작하기</a>
      <a class="btn ghost big" href="#/guide">실습 안내 보기</a>
    </div>
    <p class="privacy">🔒 ${esc(course.privacy)}</p>
  </section>
  <section class="card">
    <h2>전체 흐름</h2>
    <ul class="flow">${bySection}</ul>
    <p class="muted">총 ${steps.length}단계 · 약 ${totalMinutes}분 (진행 속도에 따라 단계를 건너뛰어도 된다)</p>
  </section>`;
}

function guideView() {
  const toolList = tools
    .map(
      (t) =>
        `<li><a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">${esc(t.name)}</a><span>${esc(t.desc)}</span></li>`,
    )
    .join('');
  const order = steps
    .map((s) => `<li><a href="#/step/${s.id}">${esc(s.title)}</a><span>${s.minutes}분</span></li>`)
    .join('');
  return `
  <section class="card">
    <h1>실습 안내</h1>
    <h2>준비물</h2>
    <ul class="plain">
      <li>PC 브라우저 (엑셀 실습은 Excel 설치 PC, 매크로 사용 가능 환경)</li>
      <li>ChatGPT 또는 Google Gemini 계정</li>
      <li>보드(Padlet)의 첨부 자료 — 프롬프트 원문, VBA 코드, 가상 데이터</li>
    </ul>
    <h2>진행 방식</h2>
    <ol>
      <li>한 단계씩 순서대로 진행한다. 단계마다 <strong>목표 → 따라 하기 → 프롬프트 작업칸 → 결과 메모 → 점검</strong> 순이다.</li>
      <li>프롬프트 원문은 보드에서 복사해 작업칸에 붙여 넣고, 내 업무에 맞게 고친 뒤 [복사] 버튼으로 AI에 붙여 넣는다.</li>
      <li>실제 개인정보·내부 비공개 자료는 입력하지 않는다. 시험은 가상 데이터로 한다.</li>
    </ol>
    <p class="muted">대상 수준 가정: ${esc(course.audience)}</p>
  </section>
  <section class="card"><h2>단계와 예상 시간</h2><ol class="plain linklist">${order}</ol></section>
  <section class="card"><h2>사용 도구 모음 (보드 Website 섹션)</h2>
    <ul class="plain linklist">${toolList}</ul>
    <p class="muted">링크는 각 서비스의 대표 주소다. 보드에 연결된 주소와 다르면 보드 링크를 우선한다.</p>
  </section>`;
}

function stepView(id) {
  const idx = steps.findIndex((s) => s.id === id);
  const s = steps[idx];
  if (!s) return `<section class="card"><p>없는 단계다. <a href="#/">처음으로</a></p></section>`;
  const sec = sections.find((x) => x.id === s.section);
  const prev = steps[idx - 1];
  const next = steps[idx + 1];
  const checks = state.checks[s.id] || [];

  const how = s.steps.map((t) => `<li>${esc(t)}</li>`).join('');
  const tips = (s.tips || []).map((t) => `<li>${esc(t)}</li>`).join('');
  const skills = s.skills
    ? `<h3>지침 6종</h3><ul class="plain skill">${s.skills
        .map((k) => `<li><strong>${esc(k.name)}</strong><span>${esc(k.note)}</span></li>`)
        .join('')}</ul>`
    : '';
  const prompt = s.prompt
    ? `<section class="card" aria-labelledby="p-${s.id}">
        <h2 id="p-${s.id}">프롬프트 작업칸</h2>
        <p class="muted">${esc(promptSlotHint)}</p>
        <div class="excerpt"><span>${esc(s.prompt.label)} · 보드 썸네일에서 확인된 부분</span>${esc(s.prompt.excerpt)}</div>
        <label for="w-${s.id}">내 프롬프트</label>
        <textarea id="w-${s.id}" data-field="work" data-id="${s.id}" rows="8" placeholder="여기에 프롬프트 원문을 붙여 넣고 내 업무에 맞게 고친다.">${esc(state.work[s.id] || '')}</textarea>
        <div class="row">
          <button class="btn primary" data-act="copy" data-id="${s.id}">프롬프트 복사</button>
          <button class="btn ghost" data-act="clear-work" data-id="${s.id}">비우기</button>
          ${sampleButtons(s)}
          <span class="status" role="status" aria-live="polite" id="st-${s.id}"></span>
        </div>
      </section>`
    : s.sample
      ? ''
      : '';
  const instructor = state.instructor
    ? `<section class="card note"><h2>강사용 진행 보조 <small>(추가 제안)</small></h2>
        <ul class="plain">
          <li>시연 먼저: 강사가 ${s.minutes > 20 ? '핵심 1~2단계' : '전체'}를 화면으로 보여 준 뒤 수강생이 따라 한다.</li>
          <li>막힘 신호: 결과가 일반론이면 "내 업무 3가지로 다시"를 요청하게 한다.</li>
          <li>마무리 질문: ${esc(s.reflection)}</li>
        </ul></section>`
    : '';

  return `
  <article>
    <p class="eyebrow">${esc(sec.label)} · ${idx + 1}/${steps.length} · 약 ${s.minutes}분 ${s.proposal ? '· <b class="tag">추가 제안 단계</b>' : ''}</p>
    <h1>${esc(s.title)}</h1>
    <section class="card">
      <h2>이 단계의 목표</h2>
      <p>${esc(s.goal)}</p>
      <h2>따라 하기</h2>
      <ol class="how">${how}</ol>
      ${skills}
      <h3>입력 예시</h3><p class="example">${esc(s.example)}</p>
      ${tips ? `<h3>작성 팁</h3><ul class="plain">${tips}</ul>` : ''}
      <p class="source">자료 출처: ${esc(s.source)}</p>
    </section>
    ${prompt}
    ${
      s.sample && !s.prompt
        ? `<section class="card"><div class="row">${sampleButtons(s)}</div></section>`
        : ''
    }
    <section class="card">
      <h2>결과 메모</h2>
      <label for="m-${s.id}">AI가 준 결과 중 남기고 싶은 내용</label>
      <textarea id="m-${s.id}" data-field="memo" data-id="${s.id}" rows="6" placeholder="결과 일부를 붙여 넣거나 느낀 점을 적는다.">${esc(state.memo[s.id] || '')}</textarea>
    </section>
    <section class="card">
      <h2>자기 점검</h2>
      <ul class="checks">
        ${s.checklist
          .map(
            (c, i) =>
              `<li><label><input type="checkbox" data-check="${s.id}:${i}" ${checks[i] ? 'checked' : ''}/> ${esc(c)}</label></li>`,
          )
          .join('')}
      </ul>
      <label for="r-${s.id}">${esc(s.reflection)}</label>
      <textarea id="r-${s.id}" data-field="reflect" data-id="${s.id}" rows="3">${esc(state.reflect[s.id] || '')}</textarea>
    </section>
    ${instructor}
    <nav class="pager" aria-label="단계 이동">
      ${prev ? `<a class="btn ghost big" href="#/step/${prev.id}">← 이전: ${esc(prev.title)}</a>` : '<span></span>'}
      ${
        next
          ? `<a class="btn primary big" href="#/step/${next.id}">다음: ${esc(next.title)} →</a>`
          : `<a class="btn primary big" href="#/result">결과 정리로 →</a>`
      }
    </nav>
  </article>`;
}

function buildSummary() {
  const lines = [`# ${course.org} · ${course.title} 실습 결과`, ''];
  for (const sec of sections) {
    const list = steps.filter((s) => s.section === sec.id);
    lines.push(`## ${sec.label}`);
    for (const s of list) {
      lines.push(`### ${s.title} ${stepDone(s) ? '(완료)' : '(미완료)'}`);
      if (state.work[s.id]) lines.push('', '**내 프롬프트**', '', state.work[s.id]);
      if (state.memo[s.id]) lines.push('', '**결과 메모**', '', state.memo[s.id]);
      if (state.reflect[s.id]) lines.push('', `**회고** — ${s.reflection}`, '', state.reflect[s.id]);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function resultView() {
  const rows = steps
    .map((s) => {
      const c = (state.checks[s.id] || []).filter(Boolean).length;
      const filled = [state.work[s.id], state.memo[s.id], state.reflect[s.id]].filter(Boolean).length;
      return `<tr><td><a href="#/step/${s.id}">${esc(s.title)}</a></td><td>${c}/${s.checklist.length}</td><td>${filled}/3</td><td>${stepDone(s) ? '✅ 완료' : '진행 중'}</td></tr>`;
    })
    .join('');
  return `
  <section class="card">
    <h1>결과 확인 및 정리</h1>
    <p>완료 ${doneCount()} / ${steps.length}단계. 아래 버튼으로 내 프롬프트·메모·회고를 한 번에 모아 가져갈 수 있다.</p>
    <div class="tablewrap"><table>
      <thead><tr><th>단계</th><th>점검</th><th>작성칸</th><th>상태</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="row">
      <button class="btn primary" data-act="copy-all">전체 결과 복사</button>
      <button class="btn ghost" data-act="download-all">Markdown 파일로 저장</button>
      <span class="status" role="status" aria-live="polite" id="st-all"></span>
    </div>
  </section>
  <section class="card">
    <h2>마무리 회고</h2>
    <ul class="plain">
      <li>오늘 만든 것 중 내일 바로 내 업무에 쓸 것 한 가지는?</li>
      <li>AI에게 더 정확히 설명했더니 달라진 점은?</li>
      <li>우리 부서에 공유하고 싶은 지침 또는 도구는?</li>
    </ul>
  </section>
  <section class="card danger">
    <h2>내 입력 지우기</h2>
    <p class="muted">공용 PC라면 실습 후 반드시 지운다. 이 브라우저에 저장된 모든 입력이 삭제된다.</p>
    <button class="btn warn" data-act="reset-all">모든 입력 초기화</button>
  </section>`;
}

// ── 라우팅 ──
function render() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, arg] = hash.split('/');
  let route = 'home';
  let body;
  if (name === 'guide') {
    route = 'guide';
    body = guideView();
  } else if (name === 'step') {
    route = 'step';
    body = stepView(arg);
  } else if (name === 'result') {
    route = 'result';
    body = resultView();
  } else {
    body = homeView();
  }
  app.innerHTML = `${header(route)}<main id="main" tabindex="-1">${body}</main>
    <footer class="foot">
      <label class="switch"><input type="checkbox" data-act="instructor" ${state.instructor ? 'checked' : ''}/> 강사용 진행 보조 보기</label>
      <span>🔒 입력 내용은 이 브라우저에만 저장됩니다.</span>
    </footer>`;
  window.scrollTo(0, 0);
  document.getElementById('main').focus({ preventScroll: true });
}

// ── 동작 ──
function flash(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function download(name, text, type) {
  const blob = new Blob(['﻿' + text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn || btn.tagName === 'INPUT') return;
  const { act, id, key } = btn.dataset;
  if (act === 'copy') {
    const text = state.work[id] || '';
    if (!text.trim()) return flash('st-' + id, '복사할 내용이 없다. 먼저 프롬프트를 붙여 넣는다.');
    flash('st-' + id, (await copyText(text)) ? '복사했다.' : '복사하지 못했다. 직접 선택해 복사한다.');
  } else if (act === 'clear-work') {
    state.work[id] = '';
    save();
    const ta = document.getElementById('w-' + id);
    if (ta) ta.value = '';
    flash('st-' + id, '비웠다.');
  } else if (act === 'sample') {
    const sm = samples[key];
    download(sm.file, toCsv(sm.build()), 'text/csv;charset=utf-8');
  } else if (act === 'copy-all') {
    flash('st-all', (await copyText(buildSummary())) ? '복사했다.' : '복사하지 못했다.');
  } else if (act === 'download-all') {
    download('ai_practice_result.md', buildSummary(), 'text/markdown;charset=utf-8');
  } else if (act === 'reset-all') {
    if (confirm('저장된 모든 입력과 점검 기록을 지운다. 계속할까?')) {
      state = emptyState();
      save();
      render();
    }
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.field) {
    state[t.dataset.field][t.dataset.id] = t.value;
    save();
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.check) {
    const [id, i] = t.dataset.check.split(':');
    const arr = state.checks[id] || [];
    arr[Number(i)] = t.checked;
    state.checks[id] = arr;
    save();
    const bar = document.querySelector('.progress');
    if (bar) {
      const pct = Math.round((doneCount() / steps.length) * 100);
      bar.setAttribute('aria-valuenow', pct);
      bar.querySelector('span').style.width = pct + '%';
      bar.querySelector('em').textContent = `${doneCount()}/${steps.length} 단계`;
    }
  } else if (t.dataset.act === 'instructor') {
    state.instructor = t.checked;
    save();
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }
});

window.addEventListener('hashchange', render);
render();
