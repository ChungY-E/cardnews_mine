'use strict';

(() => {
  const LIMIT = 4 * 1024 * 1024;
  const get = (id) => document.getElementById(id);
  const fileInput = get('fileInput');
  const dropZone = get('dropZone');
  const selectedFile = get('selectedFile');
  const fileName = get('fileName');
  const analyzeButton = get('analyzeButton');
  const accessCodeWrap = get('accessCodeWrap');
  const accessCodeInput = get('accessCode');
  const loading = get('loading');
  const errorBox = get('errorBox');
  const results = get('results');
  const toastElement = get('toast');
  let currentFile = null;
  let currentResult = null;
  let requesting = false;
  let toastTimer;

  function toast(message) {
    toastElement.textContent = message;
    toastElement.classList.remove('toast-hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastElement.classList.add('toast-hidden'), 2500);
  }

  function setFile(file) {
    if (requesting) return;
    currentFile = null;
    fileInput.value = '';
    selectedFile.hidden = true;
    analyzeButton.disabled = true;
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > LIMIT) {
      toast('4MB 이하의 PDF만 업로드할 수 있습니다.');
      return;
    }
    currentFile = file;
    fileName.textContent = file.name;
    selectedFile.hidden = false;
    analyzeButton.disabled = false;
    toast('PDF 파일이 준비되었습니다.');
  }

  fileInput.addEventListener('change', () => setFile(fileInput.files?.[0]));
  dropZone.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === dropZone) {
      event.preventDefault();
      fileInput.click();
    }
  });
  for (const type of ['dragenter', 'dragover']) {
    dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      if (!requesting) dropZone.classList.add('dragging');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      dropZone.classList.remove('dragging');
    });
  }
  dropZone.addEventListener('drop', (event) => {
    if (requesting) return;
    setFile(event.dataTransfer?.files?.[0]);
  });

  function displayResult(data) {
    currentResult = data;
    get('easyExplanation').textContent = String(data.card1_easy_explanation ?? '');
    const takeawayContainer = get('takeaways');
    const takeawayItems = Array.isArray(data.card2_takeaways) ? data.card2_takeaways.slice(0, 3) : [];
    const takeawayNodes = takeawayItems.map((item, index) => {
      const row = document.createElement('div');
      row.className = 'flex gap-3 items-start rounded-xl bg-emerald-50/70 px-4 py-3';
      const number = document.createElement('span');
      number.className = 'flex shrink-0 items-center justify-center rounded-full bg-emerald-500 h-7 w-7 text-white text-xs font-extrabold';
      number.textContent = String(index + 1);
      const text = document.createElement('p');
      text.className = 'whitespace-pre-line break-words text-sm sm:text-base leading-7 text-slate-700';
      text.textContent = String(item);
      row.append(number, text);
      return row;
    });
    takeawayContainer.replaceChildren(...takeawayNodes);

    const newsContainer = get('cardNews');
    const slides = Array.isArray(data.card3_card_news) ? data.card3_card_news.slice(0, 4) : [];
    const newsNodes = slides.map((item, index) => {
      const card = document.createElement('div');
      card.className = 'rounded-2xl bg-gradient-to-br from-indigo-950 to-indigo-800 p-5 sm:p-6 min-h-52 flex flex-col text-white shadow-lg shadow-indigo-100';
      const top = document.createElement('div');
      top.className = 'flex items-center justify-between gap-2 mb-8';
      const count = document.createElement('span');
      count.className = 'text-indigo-200 text-xs font-extrabold tracking-widest';
      count.textContent = `Slide ${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      const tag = document.createElement('span');
      tag.className = 'rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-semibold tracking-wide';
      tag.textContent = 'Card News';
      top.append(count, tag);
      const body = document.createElement('p');
      body.className = 'whitespace-pre-line break-words text-base leading-7 font-bold flex-1';
      body.textContent = String(item);
      card.append(top, body);
      return card;
    });
    newsContainer.replaceChildren(...newsNodes);
    results.hidden = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  analyzeButton.addEventListener('click', async () => {
    if (requesting) return;
    if (!currentFile) {
      toast('먼저 PDF 파일을 업로드해 주세요.');
      return;
    }
    requesting = true;
    analyzeButton.disabled = true;
    fileInput.disabled = true;
    loading.hidden = false;
    errorBox.hidden = true;
    results.hidden = true;
    currentResult = null;
    try {
      const code = accessCodeInput.value || sessionStorage.getItem('accessCode') || '';
      const headers = { 'Content-Type': 'application/octet-stream' };
      if (code) headers['x-access-code'] = code;
      // File is a Blob; fetch sends its raw bytes without FileReader/base64/JSON.
      const response = await fetch('/api/analyze', { method: 'POST', headers, body: currentFile });
      let data;
      try { data = await response.json(); } catch { data = {}; }
      if (!response.ok) {
        if (data.code === 'ACCESS_CODE_REQUIRED') {
          sessionStorage.removeItem('accessCode');
          accessCodeWrap.hidden = false;
          accessCodeInput.focus();
        }
        throw new Error(data.error || `요청에 실패했습니다. (HTTP ${response.status})`);
      }
      if (code) sessionStorage.setItem('accessCode', code);
      displayResult(data);
    } catch (error) {
      errorBox.textContent = error.message || '요청에 실패했습니다.';
      errorBox.hidden = false;
    } finally {
      requesting = false;
      loading.hidden = true;
      fileInput.disabled = false;
      analyzeButton.disabled = !currentFile;
    }
  });

  get('copyButton').addEventListener('click', async () => {
    if (!currentResult) return;
    const easy = String(currentResult.card1_easy_explanation ?? '');
    const takeawayLines = (Array.isArray(currentResult.card2_takeaways) ? currentResult.card2_takeaways : [])
      .slice(0, 3).map((value, index) => `${index + 1}. ${String(value)}`).join('\n');
    const slideLines = (Array.isArray(currentResult.card3_card_news) ? currentResult.card3_card_news : [])
      .slice(0, 4).map((value) => String(value)).join('\n\n');
    const all = `[초등학생도 이해하는 쉬운 말 해설]\n${easy}\n\n[핵심 테이크어웨이]\n${takeawayLines}\n\n[SNS 카드뉴스 슬라이드]\n${slideLines}`;
    try {
      await navigator.clipboard.writeText(all);
      toast('전체 결과가 클립보드에 복사되었습니다!');
    } catch {
      toast('복사에 실패했습니다. 직접 선택해서 복사해 주세요.');
    }
  });
})();
