(() => {
  'use strict';
  const labs = window.SIS3_DATA;
  const $ = (s, root = document) => root.querySelector(s);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = 'sis3-study-v1';
  let progress = {learned: [], scores: {}};
  try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && Array.isArray(saved.learned) && saved.scores && typeof saved.scores === 'object') progress = saved; } catch (_) {}
  progress.learned = progress.learned.filter(id => labs.some(l => l.id === id));
  let active = null, currentTab = 'theory', flash = {index: 0, revealed: false}, quiz = null;
  let toastTimer;
  const learned = id => progress.learned.includes(id);
  const verifiedPractice = lab => ['complete', 'adapted'].includes(lab.status);
  const status = lab => `<span class="status ${escape(lab.status === 'partial' ? 'pending' : lab.status)}">${escape(lab.statusLabel)}</span>`;
  const practiceSummary = () => [['complete', 'Packet Tracer выполнены'], ['adapted', 'выполнены с адаптацией'], ['partial', 'частично выполнены'], ['pending', 'ожидают проверки']].map(([state, label]) => [labs.filter(l => l.status === state).length, label]).filter(([count]) => count).map(([count, label]) => `${count} — ${label}`).join(' · ');
  const save = () => { try { localStorage.setItem(key, JSON.stringify(progress)); } catch (_) { toast('Браузер не разрешил сохранить прогресс. В текущей вкладке он останется.'); } };
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2800); }
  function renderNav() {
    const term = $('#search').value.toLocaleLowerCase('ru').trim();
    const visible = labs.filter(l => [l.id,l.title,l.english,l.group,l.essence,...l.terms.flat()].join(' ').toLocaleLowerCase('ru').includes(term));
    let nav = `<a class="nav-link ${!active && location.hash !== '#tools' ? 'active' : ''}" href="#home"><span class="nav-id">⌂</span><span>План подготовки</span></a>`;
    for (const group of ['ACL','Криптография','Мониторинг']) {
      const groupLabs = visible.filter(l => l.group === group); if (!groupLabs.length) continue;
      nav += `<div class="nav-group">${group}</div>` + groupLabs.map(l => `<a class="nav-link ${active?.id === l.id ? 'active' : ''}" href="#lab/${l.id}/theory"><span class="nav-id">${l.id}</span><span>${escape(l.title)}</span>${learned(l.id) ? '<span class="check" aria-label="Изучено">✓</span>' : ''}</a>`).join('');
    }
    if (!visible.length) nav += '<p class="nav-empty">Ничего не найдено. Попробуй «ACL», «хеш» или номер лабы.</p>';
    nav += `<div class="nav-group">Разобрать на примере</div><a class="nav-link ${location.hash === '#tools' ? 'active' : ''}" href="#tools"><span class="nav-id">↗</span><span>Интерактивные тренажёры</span></a>`;
    $('#lab-nav').innerHTML = nav;
    $('#learned-count').textContent = `${progress.learned.length} / ${labs.length}`;
    $('#learned-bar').style.width = `${progress.learned.length / labs.length * 100}%`;
  }
  function labCard(l) {
    const score = progress.scores[l.id];
    return `<a class="lab-card" href="#lab/${l.id}/theory"><div class="card-top"><span class="number">${l.id}</span><span class="group-tag">${escape(l.group)}</span></div><h3>${escape(l.title)}</h3><p>${escape(l.essence.split('. ')[0])}.</p><div style="margin:2px 0 14px">${status(l)}</div><div class="card-foot"><span class="${learned(l.id) ? 'learned' : ''}">${learned(l.id) ? '✓ Тема изучена' : `≈ ${l.minutes} мин изучения`}</span>${score ? `<span class="mini-score">Тест ${score.best}/${score.total}</span>` : '<span aria-hidden="true">→</span>'}</div></a>`;
  }
  function renderHome() {
    const next = labs.find(l => !learned(l.id)) || labs[0];
    $('#breadcrumb').textContent = 'Твой план подготовки';
    const term = $('#search').value.toLocaleLowerCase('ru').trim();
    const filtered = labs.filter(l => [l.id,l.title,l.english,l.group,l.essence,...l.terms.flat()].join(' ').toLocaleLowerCase('ru').includes(term));
    $('#content').innerHTML = `<section class="hero"><div><div class="eyebrow">Cyber Security Fundamentals</div><h1>Подготовка<br>к защите SIS3</h1><p>Разберись в результате каждой лабораторной, потренируй объяснение своими словами и проверь себя вопросами.</p><div class="action-row"><a class="btn btn-primary" href="#lab/${next.id}/theory">${progress.learned.length ? 'Продолжить изучение' : 'Начать с ACL'} <span aria-hidden="true">→</span></a><a class="btn btn-secondary" href="#tools">Попробовать тренажёры</a></div></div><div class="hero-metric"><strong>${progress.learned.length}<span style="display:inline;font-size:25px;color:#8ba297"> / 10</span></strong><span>тем отмечено изученными<br>Практика учитывается отдельно</span></div></section>
      <div class="study-route"><div class="route-step"><span>01</span><div><h3>Пойми основную идею</h3><p>Прочитай суть и ход работы.</p></div></div><div class="route-step"><span>02</span><div><h3>Объясни без подсказки</h3><p>Используй карточки с вопросами.</p></div></div><div class="route-step"><span>03</span><div><h3>Проверь слабые места</h3><p>Пройди тест и изучи объяснения.</p></div></div></div>
      <div class="evidence"><strong>Фактическая практика</strong><div style="margin-top:5px">${practiceSummary()}</div><div style="margin-top:5px">В каждой лабораторной указан результат и границы выполненной работы. Отметка «изучено» и тесты сохраняют отдельно твой прогресс подготовки.</div></div>
      <div class="section-title"><h2>${term ? 'Результаты поиска' : 'Твои лабораторные'}</h2><span>${filtered.length} тем · карточек: ${labs.reduce((s,l) => s+l.qa.length,0)}</span></div><div class="lab-grid">${filtered.map(labCard).join('')}</div>${!filtered.length ? '<div class="no-search">По этому запросу тем нет.</div>' : ''}
      <div class="section-title"><h2>Когда нужно увидеть принцип</h2><span>Учебные модели</span></div><div class="tools-menu"><a class="tool-link" href="#tools"><b>Как ACL принимает решение <span aria-hidden="true" style="display:inline">↗</span></b><span>Измени пакет и найди первое совпавшее правило.</span></a><a class="tool-link" href="#tools"><b>Wildcard без заучивания</b><span>Биты «сравнить» и «игнорировать», сети /24, /27 и /28.</span></a><a class="tool-link" href="#tools"><b>Шифрование, хеш и стеганография</b><span>Четыре разных задачи, которые часто путают.</span></a><a class="tool-link" href="#tools"><b>NetFlow по направлениям</b><span>Почему запрос и ответ — разные потоки.</span></a></div>
      <div class="study-banner"><div><h3>Что значит «изучено»?</h3><p>Ты можешь объяснить тему. Эта отметка не означает, что практика завершена или отчёт сдан.</p></div><a class="btn btn-secondary" href="#lab/${next.id}/questions">Перейти к вопросам</a></div>`;
  }
  function renderLab() {
    const l = active;
    $('#breadcrumb').textContent = `${l.group} / ${l.id}`;
    const tabs = [['theory','Разобраться'],['flash','Карточки'],['quiz','Проверить себя'],['questions','Все вопросы']];
    const verified = verifiedPractice(l);
    $('#content').innerHTML = `<section class="lab-head"><div class="lab-head-top"><span class="number">${l.id}</span><span class="eyebrow">${escape(l.group)}</span><span class="muted small">≈ ${l.minutes} мин изучения</span></div><h1>${escape(l.title)}</h1><p class="english">${escape(l.english)}</p><p class="lead">${escape(l.essence)}</p><div class="action-row"><button class="btn ${learned(l.id) ? 'btn-subtle' : 'btn-secondary'}" data-action="learn">${learned(l.id) ? '✓ Тема изучена' : 'Отметить тему изученной'}</button>${progress.scores[l.id] ? `<span class="mini-score">Лучший тест: ${progress.scores[l.id].best}/${progress.scores[l.id].total}</span>` : ''}</div><div class="evidence ${verified ? 'verified' : ''}">${status(l)}<div style="margin-top:5px">${escape(l.evidence)}</div></div></section>
      <div class="tabs" role="tablist" aria-label="Способ изучения">${tabs.map(([id,label]) => `<button role="tab" class="tab" data-action="tab" data-tab="${id}" aria-selected="${currentTab === id}">${label}${id==='flash' ? ` · ${l.qa.length}` : ''}</button>`).join('')}</div><section id="tab-content" role="tabpanel"></section>`;
    if (currentTab === 'flash') renderFlash();
    else if (currentTab === 'quiz') renderQuiz();
    else if (currentTab === 'questions') renderQuestions();
    else renderTheory();
  }
  function renderConceptualLesson(l) {
    if (!l.lesson) return '';
    const sources = l.lessonSources ? `<p class="small muted">Источники пояснений: ${l.lessonSources.map(([label, url]) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`).join(' · ')}</p>` : '';
    const expected = l.expectedResults;
    const expectedPanel = expected ? `<section class="panel" style="margin-bottom:24px"><div class="eyebrow">Примеры задания · не измерения этого запуска</div><h2>${escape(expected.title)}</h2><p>${escape(expected.intro)}</p><div class="table-wrap"><table class="comparison"><thead><tr>${expected.headers.map(h => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${expected.rows.map(row => `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="demo-description" style="margin-top:18px">${escape(expected.note)}</p></section>` : '';
    return `<section class="panel" style="margin-bottom:24px"><div class="eyebrow">Полная тема исходной лабораторной</div><h2>Что нужно понимать для защиты</h2>${l.lesson.map(([title, text]) => `<h3>${escape(title)}</h3><p>${escape(text)}</p>`).join('')}${sources}</section>${expectedPanel}`;
  }
  function renderTheory() {
    const l = active;
    $('#tab-content').innerHTML = `<div class="content-grid"><div><section class="panel"><div class="eyebrow" style="margin-bottom:9px">Ход работы</div><h2>${verifiedPractice(l) ? 'Что сделали в практике' : l.status === 'partial' ? 'Выполненная часть и ограничение' : 'Что требуется проверить'}</h2><ol class="steps">${l.steps.map(s => `<li>${escape(s)}</li>`).join('')}</ol></section>${l.commands ? `<section class="panel"><h2>Команды и смысл</h2><div class="code-label"><span>${l.group === 'ACL' && l.status === 'complete' ? 'Конфигурация, применённая в Packet Tracer' : l.group === 'ACL' ? 'Конфигурация из учебного задания' : 'Команды учебного опыта'}</span><button data-action="copy-code">Копировать</button></div><pre id="lab-code">${escape(l.commands)}</pre></section>` : ''}</div><div><section class="panel"><div class="eyebrow" style="margin-bottom:9px">Нужные значения</div><h2>На что смотреть</h2><dl class="facts">${l.facts.map(([a,b]) => `<div><dt>${escape(a)}</dt><dd>${escape(b)}</dd></div>`).join('')}</dl></section><section class="panel"><h2>Не перепутай</h2><ul class="pitfalls">${l.pitfalls.map(p => `<li>${escape(p)}</li>`).join('')}</ul></section></div></div><h2>Понятия простыми словами</h2><div class="terms">${l.terms.map(([a,b])=>`<article class="term"><h3>${escape(a)}</h3><p>${escape(b)}</p></article>`).join('')}</div><section class="say"><div class="eyebrow">Объяснение за минуту</div><p>«${escape(l.say)}»</p></section><div class="study-banner"><div><h3>Теперь объясни без текста</h3><p>Открой карточку, ответь вслух, затем сверься с подсказкой.</p></div><button class="btn btn-primary" data-action="tab" data-tab="flash">Открыть карточки →</button></div>`;
    if (l.lesson) { const panel = $('#tab-content'); panel.innerHTML = renderConceptualLesson(l) + panel.innerHTML; }
  }
  function renderQuestions() { $('#tab-content').innerHTML = `<div class="section-title" style="margin-top:0"><h2>Вопросы для защиты</h2><button class="quiet" data-action="expand-qa">Раскрыть все</button></div><div class="qa-list">${active.qa.map(([q,a],i) => `<details><summary><span class="qa-num">${String(i+1).padStart(2,'0')}</span>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}</div>`; }
  function renderFlash() {
    const [q,a] = active.qa[flash.index];
    $('#tab-content').innerHTML = `<div class="card-view"><div class="flash-top"><span>${active.id} · вопрос ${flash.index+1} из ${active.qa.length}</span><span>Ответь вслух до подсказки</span></div><div class="flash-card"><span class="eyebrow">Вопрос преподавателя</span><h2 class="flash-question">${escape(q)}</h2>${flash.revealed ? `<div class="flash-answer">${escape(a)}</div>` : '<button class="btn btn-primary" data-action="reveal">Показать ответ</button>'}</div><div class="flash-actions"><button class="btn btn-secondary" data-action="flash-prev">← Назад</button><button class="btn btn-secondary" data-action="flash-shuffle">Случайная</button><button class="btn btn-primary" data-action="flash-next">Следующая →</button></div><p class="flash-caption">Стрелки ← → переключают карточки. Кнопка раскрывает ответ.</p></div>`;
  }
  function newQuiz() { quiz = {lab: active.id, index: 0, selected: null, answers: [], done: false}; }
  function renderQuiz() {
    if (!quiz || quiz.lab !== active.id) newQuiz();
    if (quiz.done) {
      const score = quiz.answers.filter(Boolean).length, total = active.quiz.length;
      $('#tab-content').innerHTML = `<div class="card-view panel quiz-result"><div class="eyebrow">Тест завершён</div><div class="score">${score} <span style="font-size:25px;color:#8aa393">/ ${total}</span></div><h2>${score === total ? 'Основная логика понятна' : 'Есть темы для повторения'}</h2><p class="muted">${score === total ? 'Следующий шаг — объяснить ход работы своими словами без вариантов ответа.' : 'Вернись к объяснениям и карточкам. Тест можно повторить.'}</p><button class="btn btn-primary" data-action="quiz-restart">Повторить тест</button><button class="btn btn-secondary" data-action="tab" data-tab="flash">Карточки</button></div>`; return;
    }
    const q = active.quiz[quiz.index], answered = quiz.selected !== null;
    $('#tab-content').innerHTML = `<div class="card-view"><div class="quiz-heading"><span>Вопрос ${quiz.index+1} из ${active.quiz.length}</span><span>Без ограничения времени</span></div><section class="panel"><div class="eyebrow">Проверь понимание</div><h2 class="quiz-question">${escape(q.q)}</h2><div class="quiz-options">${q.choices.map((text,i) => `<button class="option ${answered && i === q.correct ? 'correct' : ''} ${answered && i === quiz.selected && i !== q.correct ? 'wrong' : ''}" data-action="quiz-answer" data-choice="${i}" ${answered ? 'disabled' : ''}><span class="letter">${String.fromCharCode(65+i)}</span><span>${escape(text)}</span>${answered && i===q.correct ? '<span style="margin-left:auto">✓</span>' : ''}</button>`).join('')}</div>${answered ? `<div class="feedback" role="status"><strong>${quiz.selected===q.correct ? 'Верно' : 'Правильный ответ выделен зелёным'}</strong>${escape(q.explain)}</div><div class="action-row"><button class="btn btn-primary" data-action="quiz-next">${quiz.index+1 === active.quiz.length ? 'Посмотреть результат' : 'Следующий вопрос →'}</button></div>` : ''}</section></div>`;
  }
  const scenarioRules = {
    r2: {title:'14.5.6 · R2 · G0/0 out', note:'Пакет уже направлен на выход R2 G0/0. Стандартный ACL проверяет только источник; назначение и сервис не участвуют.', src:'192.168.11.10', dst:'192.168.20.254', proto:'icmp', port:80, rules:[{action:'deny',src:'192.168.11.0',wc:'0.0.0.255',text:'deny 192.168.11.0 0.0.0.255'},{action:'permit',text:'permit any'}]},
    r3: {title:'14.5.6 · R3 · G0/0 out', note:'Пакет уже идёт через R3 G0/0 out в LAN PC3. Список отличается от ACL 1 на R2.',src:'192.168.10.10',dst:'192.168.30.10',proto:'icmp',port:80,rules:[{action:'deny',src:'192.168.10.0',wc:'0.0.0.255',text:'deny 192.168.10.0 0.0.0.255'},{action:'permit',text:'permit any'}]},
    ftp: {title:'14.5.12 · PC1 LAN · G0/0 in',note:'Рассматривается вход LAN PC1 в R1. Разрешены TCP/21 и ICMP только к серверу. FTP здесь означает управляющее соединение из учебного задания.',src:'172.22.34.66',dst:'172.22.34.62',proto:'tcp',port:21,rules:[{action:'permit',src:'172.22.34.64',wc:'0.0.0.31',dst:'172.22.34.62',proto:'tcp',port:21,text:'permit tcp 172.22.34.64 0.0.0.31 host 172.22.34.62 eq ftp'},{action:'permit',src:'172.22.34.64',wc:'0.0.0.31',dst:'172.22.34.62',proto:'icmp',text:'permit icmp 172.22.34.64 0.0.0.31 host 172.22.34.62'}]},
    http: {title:'14.5.12 · PC2 LAN · G0/1 in',note:'Рассматривается вход LAN PC2 в R1. Разрешены TCP/80 и ICMP только к серверу. HTTPS 443 этим правилом не разрешён.',src:'172.22.34.98',dst:'172.22.34.62',proto:'tcp',port:80,rules:[{action:'permit',src:'172.22.34.96',wc:'0.0.0.15',dst:'172.22.34.62',proto:'tcp',port:80,text:'permit tcp 172.22.34.96 0.0.0.15 host 172.22.34.62 eq www'},{action:'permit',src:'172.22.34.96',wc:'0.0.0.15',dst:'172.22.34.62',proto:'icmp',text:'permit icmp 172.22.34.96 0.0.0.15 host 172.22.34.62'}]},
    multi: {title:'14.5.13 · RT1 · G0/0 in',note:'Один список: PC1 запрещены HTTP/HTTPS, PC2 — FTP, PC3 — ICMP к двум серверам. Остальной IP-трафик разрешается.',src:'172.31.1.101',dst:'64.101.255.254',proto:'tcp',port:80,rules:[]}
  };
  for (const dst of ['64.101.255.254','64.103.255.254']) for (const port of [80,443]) scenarioRules.multi.rules.push({action:'deny',src:'172.31.1.101',wc:'0.0.0.0',dst,proto:'tcp',port,text:`deny tcp host 172.31.1.101 host ${dst} eq ${port}`});
  for (const dst of ['64.101.255.254','64.103.255.254']) scenarioRules.multi.rules.push({action:'deny',src:'172.31.1.102',wc:'0.0.0.0',dst,proto:'tcp',port:21,text:`deny tcp host 172.31.1.102 host ${dst} eq 21`});
  for (const dst of ['64.101.255.254','64.103.255.254']) scenarioRules.multi.rules.push({action:'deny',src:'172.31.1.103',wc:'0.0.0.0',dst,proto:'icmp',text:`deny icmp host 172.31.1.103 host ${dst}`});
  scenarioRules.multi.rules.push({action:'permit',text:'permit ip any any'});
  const ipNumber = ip => { if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return null; const octets = ip.split('.').map(Number); if (octets.some(n=>n>255)) return null; return octets.reduce((sum,n)=>(sum*256+n)>>>0,0); };
  const ipString = n => [24,16,8,0].map(s=>(n>>>s)&255).join('.');
  const wildcardMatches = (ip,network,wc) => { const mask=(~ipNumber(wc))>>>0; return ((ip & mask)>>>0)===((ipNumber(network)&mask)>>>0); };
  function aclDecision(scenario, packet) {
    const rules = [...scenario.rules, {action:'deny',text:'deny ip any any  (неявный запрет)',implicit:true}];
    let first = rules.findIndex(r => (!r.src || wildcardMatches(packet.src,r.src,r.wc)) && (!r.dst || packet.dst===ipNumber(r.dst)) && (!r.proto || r.proto===packet.proto) && (r.port===undefined || r.port===packet.port));
    return {rules, first, action: rules[first].action};
  }
  function renderTools() {
    $('#breadcrumb').textContent = 'Интерактивные учебные модели';
    $('#content').innerHTML = `<div class="eyebrow">Разобрать на примере</div><h1>Проверь принцип<br>на своих значениях</h1><p class="demo-description">Модели объясняют логику. Они не подключаются к сети и не являются доказательством выполнения лабораторных в Packet Tracer.</p><div class="quick-links"><a href="#acl-demo" data-action="anchor">ACL</a><a href="#wildcard-demo" data-action="anchor">Wildcard</a><a href="#compare-demo" data-action="anchor">Что с чем не путать</a><a href="#flow-demo" data-action="anchor">NetFlow</a><a href="#password-demo" data-action="anchor">Число вариантов</a></div>
      <section class="panel" id="acl-demo"><div class="eyebrow" style="margin-bottom:10px">01 · Решение по первому совпадению</div><h2>Пройдёт ли пакет через ACL?</h2><label class="field full">Точка применения списка<select id="acl-scenario">${Object.entries(scenarioRules).map(([id,s])=>`<option value="${id}">${escape(s.title)}</option>`).join('')}</select></label><p class="demo-description" id="acl-note" style="margin-top:12px"></p><div class="form-grid"><label class="field">IPv4 источника<input id="acl-src" autocomplete="off" inputmode="decimal"></label><label class="field">IPv4 назначения<input id="acl-dst" autocomplete="off" inputmode="decimal"></label><label class="field">Протокол<select id="acl-proto"><option value="tcp">TCP</option><option value="udp">UDP</option><option value="icmp">ICMP</option></select></label><label class="field">Порт назначения<input id="acl-port" type="number" min="0" max="65535"></label></div><div id="acl-result" aria-live="polite"></div></section>
      <section class="panel" id="wildcard-demo"><div class="eyebrow" style="margin-bottom:10px">02 · Нулевой бит сравниваем, единицу игнорируем</div><h2>Wildcard по шагам</h2><p class="demo-description">Для обычной непрерывной маски подсети: wildcard = 255.255.255.255 − маска. В IOS возможны и непрерывные, и непривычные побитовые wildcard; здесь моделируется CIDR.</p><div class="form-grid"><label class="field">Адрес / сеть<input id="wild-ip" value="172.22.34.64" inputmode="decimal"></label><label class="field">Длина префикса<select id="wild-prefix">${Array.from({length:33},(_,i)=>`<option value="${i}" ${i===27?'selected':''}>/${i}</option>`).join('')}</select></label><label class="field" style="grid-column:span 2">Адрес для проверки<input id="wild-test" value="172.22.34.66" inputmode="decimal"></label></div><div id="wild-output" aria-live="polite"></div></section>
      <section class="panel" id="compare-demo"><div class="eyebrow" style="margin-bottom:10px">03 · Четыре разных задачи</div><h2>Шифрование, кодирование, хеш, стеганография</h2><div class="table-wrap"><table class="comparison"><thead><tr><th>Механизм</th><th>Что делает</th><th>Обратный путь</th><th>В лабораторных</th></tr></thead><tbody><tr><td>Шифрование</td><td>Защищает содержание</td><td>С правильным ключом</td><td>AES, RSA, OpenSSL</td></tr><tr><td>Кодирование</td><td>Меняет представление</td><td>Без секрета</td><td>Base64</td></tr><tr><td>Хеширование</td><td>Даёт дайджест байтов</td><td>Нет расшифрования</td><td>SHA-256, SHA-512</td></tr><tr><td>Стеганография</td><td>Скрывает наличие данных</td><td>Извлечение подходящим методом</td><td>ODT внутри JPEG</td></tr></tbody></table></div><p class="demo-description" style="margin:18px 0 0">Методы можно сочетать: Steghide в нашем опыте сжимал и шифровал документ, затем встраивал его в JPEG. Сам хеш документ не прячет.</p></section>
      <section class="panel" id="flow-demo"><div class="eyebrow" style="margin-bottom:10px">04 · Поток всегда имеет направление</div><h2>Какие записи увидит NetFlow?</h2><p class="demo-description">Учебный прогноз для 20.3.10. Порт клиента ниже условный; DNS-сервер изображён без придуманного IP. Кэши и таймауты могут менять число записей.</p><div class="flow-mode"><button class="active" data-action="flow" data-mode="ping">Ping шлюза</button><button data-action="flow" data-mode="http">HTTP по IP</button><button data-action="flow" data-mode="dns">HTTP по имени</button></div><div id="flow-output"></div></section>
      <section class="panel" id="password-demo"><div class="eyebrow" style="margin-bottom:10px">05 · Только математическая модель</div><h2>Как растёт число вариантов?</h2><p class="demo-description">Каждая позиция независимо выбирается из N символов. Никакие пароли не вводятся и не подбираются. Это модель равномерного случайного выбора, а не оценка конкретного человеческого пароля.</p><div class="form-grid"><label class="field">Алфавит N<input id="pw-alphabet" type="number" min="2" max="256" value="26"></label><label class="field">Длина L<input id="pw-length" type="number" min="1" max="32" value="6"></label></div><div id="pw-result" aria-live="polite"></div></section>`;
    setScenario(); drawWildcard(); drawFlows('ping'); drawPassword();
  }
  function setScenario() { const s = scenarioRules[$('#acl-scenario').value]; $('#acl-src').value=s.src; $('#acl-dst').value=s.dst; $('#acl-proto').value=s.proto; $('#acl-port').value=s.port; $('#acl-note').textContent=s.note; drawACL(); }
  function drawACL() {
    const source=$('#acl-src').value.trim(),destination=$('#acl-dst').value.trim(),src=ipNumber(source),dst=ipNumber(destination),proto=$('#acl-proto').value,port=Number($('#acl-port').value);
    $('#acl-port').disabled=proto==='icmp';
    if(src===null||dst===null||proto!=='icmp'&&(!Number.isInteger(port)||port<0||port>65535||$('#acl-port').value==='')) { $('#acl-result').innerHTML='<div class="verdict invalid"><div><strong>Проверь значения</strong><p>IPv4 должен состоять из четырёх чисел 0–255. Порт TCP/UDP: целое число 0–65535.</p></div></div>';return; }
    const s=scenarioRules[$('#acl-scenario').value], d=aclDecision(s,{src,dst,proto,port}),allow=d.action==='permit';
    $('#acl-result').innerHTML=`<div class="packet-route"><div class="packet-node"><strong>${escape(source)}</strong>источник</div><span class="packet-arrow">→</span><div class="packet-node"><strong>${proto.toUpperCase()}${proto!=='icmp'?'/'+port:''}</strong>пакет</div><span class="packet-arrow">→</span><div class="packet-node"><strong>${escape(destination)}</strong>назначение</div></div><div class="verdict ${allow?'allow':'deny'}"><div class="verdict-icon">${allow?'✓':'×'}</div><div><strong>${allow?'Разрешён':'Запрещён'}</strong><p>${d.rules[d.first].implicit?'Ни одно явное правило не совпало. Сработал неявный запрет.':`Первое совпадение — строка ${(d.first+1)*10}. Следующие строки не проверяются.`}</p></div></div><ol class="rules">${d.rules.map((r,i)=>`<li class="${i===d.first?(allow?'hit':'hit-deny'):i>d.first?'after':''}"><span class="line-no">${r.implicit?'—':(i+1)*10}</span><span>${escape(r.text)}</span><span class="rule-note">${i===d.first?'← решение':i<d.first?'не совпало':'не проверяется'}</span></li>`).join('')}</ol>`;
  }
  function drawWildcard() {
    const ip=ipNumber($('#wild-ip').value.trim()),test=ipNumber($('#wild-test').value.trim()),prefix=Number($('#wild-prefix').value);
    if(ip===null||test===null){$('#wild-output').innerHTML='<div class="verdict invalid"><p>Введи корректные IPv4-адреса: четыре числа от 0 до 255.</p></div>';return;}
    const mask=prefix===0?0:(0xffffffff<<(32-prefix))>>>0,wc=(~mask)>>>0,net=(ip&mask)>>>0,end=(net|wc)>>>0,match=((test&mask)>>>0)===net;
    const bits=Array.from({length:32},(_,i)=>`${i&&i%8===0?'<span class="bit-sep">.</span>':''}<span class="bit ${i>=prefix?'ignore':''}">${i>=prefix?'1':'0'}</span>`).join('');
    $('#wild-output').innerHTML=`<div class="wild-grid"><div class="wild-result"><small>Маска подсети</small><strong>${ipString(mask)}</strong><small>Wildcard</small><strong style="margin-bottom:0;color:var(--teal)">${ipString(wc)}</strong></div><div class="wild-result"><small>Диапазон, совпадающий с правилом</small><strong style="font-size:19px">${ipString(net)} — ${ipString(end)}</strong><small>Всего совпадающих адресов</small><strong style="font-size:20px;margin-bottom:0">${(2**(32-prefix)).toLocaleString('ru-RU')}</strong></div></div><div class="bits" aria-label="Двоичная wildcard маска">${bits}</div><div class="bit-legend"><span>0 — сравнить бит</span><span>1 — игнорировать бит</span></div><div class="verdict ${match?'allow':'deny'}"><div><strong style="font-size:17px">${escape($('#wild-test').value.trim())}: ${match?'совпадает':'не совпадает'}</strong><p>Это проверка совпадения адреса, а не решение permit/deny. Само действие задаётся отдельным словом в ACL. Диапазон включает все адреса маски, включая границы подсети.</p></div></div>`;
  }
  function drawFlows(mode) {
    document.querySelectorAll('[data-action="flow"]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    let flows=[],note='';
    if(mode==='ping'){flows=[['ICMP · 1','10.0.0.10','10.0.0.1','']];note='В первой части задания мониторится вход LAN. Отображается направление PC-1 → шлюз; отсутствие обратной записи связано с точкой наблюдения, а не с отсутствием ответа.';}
    if(mode==='http'||mode==='dns'){flows=[['TCP · 6','10.0.0.10:1100','192.0.2.100:80',''],['TCP · 6','192.0.2.100:80','10.0.0.10:1100','']];note='Два направления имеют разные ключи: адреса и порты меняются местами. Порт 1100 здесь только иллюстрация, не измерение.';}
    if(mode==='dns'){flows.unshift(['UDP · 17','клиент:временный','DNS-сервер:53','dns'],['UDP · 17','DNS-сервер:53','клиент:временный','dns']);note='При пустом DNS-кэше добавляется запрос имени и ответ. Прогноз: две записи DNS + две HTTP. Если имя уже в кэше, DNS-трафика может не быть.';}
    $('#flow-output').innerHTML=`<div class="flow-rows">${flows.map(([type,from,to,css])=>`<div class="flow-row ${css}"><b>${type}</b><span>${from}</span><span class="arrow">→</span><span>${to}</span></div>`).join('')}</div><div class="flow-note">${note}</div>`;
  }
  function drawPassword(){
    const n=Number($('#pw-alphabet').value),l=Number($('#pw-length').value);
    if(!Number.isInteger(n)||n<2||n>256||!Number.isInteger(l)||l<1||l>32){$('#pw-result').innerHTML='<p class="muted">Для этой модели N — целое 2–256, L — целое 1–32.</p>';return;}
    const count=BigInt(n)**BigInt(l),sum=(BigInt(n)**BigInt(l+1)-BigInt(n))/(BigInt(n)-1);
    $('#pw-result').innerHTML=`<div class="wild-grid"><div class="wild-result"><small>Ровно ${l} символов: ${n}<sup>${l}</sup></small><strong style="font-size:21px;overflow-wrap:anywhere">${count.toLocaleString('ru-RU')}</strong><small>Модельная энтропия: ${(l*Math.log2(n)).toFixed(1)} бит</small></div><div class="wild-result"><small>Все длины от 1 до ${l}</small><strong style="font-size:21px;overflow-wrap:anywhere">${sum.toLocaleString('ru-RU')}</strong><small>Ещё один символ увеличит пространство фиксированной длины в ${n} раз</small></div></div><p class="demo-description" style="margin:17px 0 0">Здесь нет оценки времени восстановления. Она требует дополнительных условий и измерений.</p>`;
  }
  function route(focus=false) {
    const parts=location.hash.slice(1).split('/'); const next=labs.find(l=>l.id===parts[1]);
    if(parts[0]==='lab'&&next){if(active?.id!==next.id)flash={index:0,revealed:false};active=next;currentTab=['theory','flash','quiz','questions'].includes(parts[2])?parts[2]:'theory';renderLab();}
    else{active=null; if(parts[0]==='tools')renderTools();else renderHome();}
    renderNav(); if(focus){$('#content').focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});}
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
    if(action==='anchor'){e.preventDefault();$(b.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='tab'){location.hash=`lab/${active.id}/${b.dataset.tab}`;return;}
    if(action==='learn'){progress.learned=learned(active.id)?progress.learned.filter(id=>id!==active.id):[...progress.learned,active.id];save();renderLab();renderNav();toast(learned(active.id)?'Тема отмечена изученной':'Отметка изучения снята');return;}
    if(action==='reveal'){flash.revealed=true;renderFlash();return;}
    if(action.startsWith('flash-')){flash.index=action==='flash-prev'?(flash.index-1+active.qa.length)%active.qa.length:action==='flash-next'?(flash.index+1)%active.qa.length:(flash.index+1+Math.floor(Math.random()*(active.qa.length-1)))%active.qa.length;flash.revealed=false;renderFlash();return;}
    if(action==='quiz-answer'){if(quiz.selected!==null)return;quiz.selected=Number(b.dataset.choice);quiz.answers.push(quiz.selected===active.quiz[quiz.index].correct);renderQuiz();return;}
    if(action==='quiz-next'){if(quiz.index+1<active.quiz.length){quiz.index++;quiz.selected=null;}else{quiz.done=true;const score=quiz.answers.filter(Boolean).length;progress.scores[active.id]={best:Math.max(score,progress.scores[active.id]?.best||0),last:score,total:active.quiz.length};save();}renderQuiz();return;}
    if(action==='quiz-restart'){newQuiz();renderQuiz();return;}
    if(action==='expand-qa'){const all=[...document.querySelectorAll('.qa-list details')],open=all.some(d=>!d.open);all.forEach(d=>d.open=open);b.textContent=open?'Свернуть все':'Раскрыть все';return;}
    if(action==='copy-code'){try{await navigator.clipboard.writeText(active.commands);toast('Команды скопированы');}catch(_){const range=document.createRange();range.selectNodeContents($('#lab-code'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);toast('Текст выделен. Нажми Ctrl+C, чтобы скопировать.');}return;}
    if(action==='flow')drawFlows(b.dataset.mode);
  });
  document.addEventListener('input',e=>{if(['acl-src','acl-dst','acl-port'].includes(e.target.id))drawACL();if(['wild-ip','wild-test'].includes(e.target.id))drawWildcard();if(['pw-alphabet','pw-length'].includes(e.target.id))drawPassword();});
  document.addEventListener('change',e=>{if(e.target.id==='acl-scenario')setScenario();if(e.target.id==='acl-proto')drawACL();if(e.target.id==='wild-prefix')drawWildcard();});
  $('#search').addEventListener('input',()=>{renderNav();if(!active&&location.hash!=='#tools')renderHome();});
  $('#print').addEventListener('click',()=>window.print());
  document.addEventListener('keydown',e=>{if(active&&currentTab==='flash'&&!['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(document.activeElement.tagName)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();flash.index=(flash.index+(e.key==='ArrowLeft'?-1:1)+active.qa.length)%active.qa.length;flash.revealed=false;renderFlash();}});
  window.addEventListener('hashchange',()=>route(true));
  window.SIS3_TEST = {ipNumber,ipString,wildcardMatches,aclDecision,scenarioRules};
  route();
})();
