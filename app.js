const $ = (selector) => document.querySelector(selector);

const refs = {
  fileInput: $('#fileInput'), uploadButton: $('#uploadButton'), cameraButton: $('#cameraButton'),
  demoButton: $('#demoButton'), startButton: $('#startButton'), monitorRunButton: $('#monitorRunButton'), clearButton: $('#clearButton'), startHint: $('#startHint'),
  imageStage: $('#imageStage'), emptyState: $('#emptyState'), mediaWrap: $('#mediaWrap'), sourceImage: $('#sourceImage'), sourceVideo: $('#sourceVideo'),
  sourceTag: $('#sourceTag'), imageFooterInfo: $('#imageFooterInfo'), imageReadyDot: $('#imageReadyDot'), cameraControls: $('#cameraControls'),
  captureButton: $('#captureButton'), stopCameraButton: $('#stopCameraButton'), scanLine: $('#scanLine'), overlayLayer: $('#overlayLayer'),
  imageTools: $('#imageTools'), infoSource: $('#infoSource'), infoStatus: $('#infoStatus'), infoResolution: $('#infoResolution'), infoFileSize: $('#infoFileSize'), infoLocation: $('#infoLocation'), infoTimestamp: $('#infoTimestamp'),
  progressBar: $('#progressBar'), progressValue: $('#progressValue'), progressText: $('#progressText'), statusPill: $('#statusPill'),
  accuracyToggle: $('#accuracyToggle'), recordText: $('#recordText'), resultsSection: $('#resultsSection'), resultSummary: $('#resultSummary'), findingsGrid: $('#findingsGrid'),
  exportButton: $('#exportButton'), newScanButton: $('#newScanButton'), maintenanceButton: $('#maintenanceButton'), releaseButton: $('#releaseButton'), decisionBar: $('#decisionBar'),
  decisionTitle: $('#decisionTitle'), decisionDescription: $('#decisionDescription'), activityList: $('#activityList'), toastRegion: $('#toastRegion'),
  themeToggle: $('#themeToggle'), modalBackdrop: $('#modalBackdrop'), modalClose: $('#modalClose'), modalConfirm: $('#modalConfirm'), modalSymbol: $('#modalSymbol'), modalTitle: $('#modalTitle'), modalBody: $('#modalBody'),
  cameraButtonText: $('#cameraButtonText'), cameraButtonSubtext: $('#cameraButtonSubtext'), operatorCheck: $('#operatorCheck'),
  trainNumber: $('#trainNumber'), coachBogie: $('#coachBogie'), inspectionLocation: $('#inspectionLocation'), officerId: $('#officerId'), saveRecordButton: $('#saveRecordButton'), caseState: $('#caseState'), recordNotice: $('#recordNotice'), pipelineSummary: $('#pipelineSummary')
};

let stream = null;
let source = null;
let highAccuracy = true;
let results = [];
let activity = [];
let scanTimer = null;
let originalImageUrl = '';
let imageMeta = {};
let imageViews = {};
let currentView = 'original';
let recordSaved = false;
const processState = { open: false, display: false, information: false, grayscale: false, blur: false, threshold: false, edges: false, quality: false, scan: false, report: false };

const demoSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
<defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#364757"/><stop offset=".53" stop-color="#182736"/><stop offset="1" stop-color="#111b26"/></linearGradient><linearGradient id="metal" x2="0" y2="1"><stop stop-color="#9ca8ad"/><stop offset=".35" stop-color="#53616a"/><stop offset="1" stop-color="#222d35"/></linearGradient><radialGradient id="lamp"><stop stop-color="#f8edc5" stop-opacity=".84"/><stop offset="1" stop-color="#f8edc5" stop-opacity="0"/></radialGradient><filter id="n"><feTurbulence baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .2 0 0 0 0 .25 0 0 0 0 .3 0 0 0 .12 0"/></filter></defs>
<rect width="1200" height="720" fill="url(#bg)"/><rect width="1200" height="720" filter="url(#n)" opacity=".38"/>
<ellipse cx="310" cy="130" rx="420" ry="280" fill="url(#lamp)" opacity=".35"/><ellipse cx="960" cy="170" rx="340" ry="300" fill="url(#lamp)" opacity=".24"/>
<path d="M0 102 1200 42v140L0 245Z" fill="#293742"/><path d="M0 113 1200 56M0 199l1200-66M0 310 1200 260" stroke="#7c8990" stroke-opacity=".35" stroke-width="6"/>
<path d="M-10 500 C160 384 320 398 470 456 S800 562 1210 410V730H-10Z" fill="#0f1821"/>
<g transform="translate(90,138) rotate(-3)"><path d="M0 135 935 64l64 155-930 107Z" fill="url(#metal)" stroke="#b0bbc0" stroke-opacity=".65" stroke-width="5"/><path d="M65 170 910 105M90 245l845-82" stroke="#202c34" stroke-width="20" opacity=".72"/><path d="M112 186 885 123M131 257l776-75" stroke="#c4cdd0" stroke-opacity=".25" stroke-width="4"/><g fill="#1a252d" stroke="#8d9ba1" stroke-width="4"><circle cx="175" cy="156" r="32"/><circle cx="392" cy="140" r="35"/><circle cx="632" cy="120" r="36"/><circle cx="840" cy="105" r="34"/></g><g fill="#bdc7c8"><circle cx="175" cy="156" r="12"/><circle cx="392" cy="140" r="12"/><circle cx="632" cy="120" r="12"/><circle cx="840" cy="105" r="12"/></g></g>
<g transform="translate(35 375) rotate(-8)"><rect x="0" y="0" width="470" height="112" rx="22" fill="#394650" stroke="#a8b0b3" stroke-opacity=".48" stroke-width="6"/><rect x="40" y="25" width="390" height="38" rx="10" fill="#0c141b"/><path d="M20 95h425" stroke="#b5bec0" stroke-opacity=".28" stroke-width="6"/></g>
<g transform="translate(720 348) rotate(6)"><rect x="0" y="0" width="405" height="135" rx="21" fill="#4f5c62" stroke="#a3b0b3" stroke-opacity=".5" stroke-width="6"/><path d="M33 30h335M40 90h320" stroke="#202c31" stroke-width="17"/><circle cx="76" cy="67" r="18" fill="#182229"/><circle cx="330" cy="67" r="18" fill="#182229"/></g>
<path d="M175 530c51-23 105-23 147 0l-22 73H201Z" fill="#59636a"/><path d="M807 514c42-26 111-18 144 16l-21 69H824Z" fill="#59636a"/>
<g transform="translate(573 355) rotate(15)"><path d="M0 0h65l20 48-24 28-59-19Z" fill="#ded5bf" stroke="#806d50" stroke-width="5"/><path d="M13 18h50M9 36h57" stroke="#8e8068" stroke-width="4"/></g>
<g transform="translate(313 272) rotate(-9)"><path d="m0 12 25-12 23 11-3 33-31 7Z" fill="#262b2d" stroke="#c3c9c5" stroke-width="4"/><circle cx="25" cy="23" r="7" fill="#a8aa9e"/></g>
</svg>`)}`;

function log(message, tone = 'blue') {
  activity.unshift({ message, tone, at: new Date() });
  refs.activityList.innerHTML = activity.slice(0, 5).map(item => `<div class="activity-item"><i style="background:${item.tone === 'red' ? '#e24462' : item.tone === 'green' ? '#07b684' : '#5d92ff'}"></i><span>${item.message}</span><time>${item.at.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</time></div>`).join('');
}

function toast(message, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  refs.toastRegion.append(el);
  setTimeout(() => el.remove(), 3400);
}

function timestamp() {
  return new Date().toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getRecordData() {
  return {
    trainNumber: refs.trainNumber.value.trim(),
    coachBogie: refs.coachBogie.value.trim(),
    location: refs.inspectionLocation.value.trim(),
    officerId: refs.officerId.value.trim()
  };
}

function setRecordState(ready, message) {
  recordSaved = ready;
  refs.caseState.textContent = ready ? 'Record ready' : 'Record incomplete';
  refs.caseState.classList.toggle('ready', ready);
  refs.recordNotice.textContent = message;
  refs.recordNotice.classList.toggle('ready', ready);
  updateImageInformation();
}

function saveRecord(showFeedback = true) {
  const record = getRecordData();
  const missing = [];
  if (!record.trainNumber) missing.push('train number');
  if (!record.location) missing.push('inspection location');
  if (missing.length) {
    setRecordState(false, `Add ${missing.join(' and ')} before the scan can be started.`);
    if (showFeedback) toast(`Record incomplete: add ${missing.join(' and ')}.`, 'warn');
    return false;
  }
  setRecordState(true, `Record saved ${timestamp()} · ${record.trainNumber}${record.coachBogie ? ` · ${record.coachBogie}` : ''}`);
  if (showFeedback) { log(`Inspection record saved for train ${record.trainNumber}.`, 'green'); toast('Inspection record saved.', 'success'); }
  return true;
}

function resetProcessSteps() {
  Object.keys(processState).forEach((id) => {
    processState[id] = false;
    const step = document.querySelector(`[data-process="${id}"]`);
    if (!step) return;
    step.classList.remove('complete');
    step.querySelector('input').checked = false;
    step.querySelector('em').textContent = 'Pending';
  });
  updatePipelineSummary();
}

function completeProcess(id) {
  processState[id] = true;
  const step = document.querySelector(`[data-process="${id}"]`);
  if (!step) return;
  step.classList.add('complete');
  step.querySelector('input').checked = true;
  step.querySelector('em').textContent = 'Complete';
  updatePipelineSummary();
}

function updatePipelineSummary() {
  const completeCount = Object.values(processState).filter(Boolean).length;
  refs.pipelineSummary.textContent = completeCount ? `${completeCount} of ${Object.keys(processState).length} processing checks complete.` : 'Awaiting an inspection image.';
}

function updateImageInformation(meta = imageMeta) {
  const record = getRecordData();
  refs.infoSource.textContent = meta.source || '—';
  refs.infoStatus.textContent = meta.status || (source ? 'Ready' : 'No image');
  refs.infoResolution.textContent = meta.resolution || '—';
  refs.infoFileSize.textContent = meta.fileSize || '—';
  refs.infoLocation.textContent = record.location || meta.location || 'Not recorded';
  refs.infoTimestamp.textContent = meta.acquired || '—';
}

function sourceImageLoaded(label, meta) {
  imageMeta = {
    source: label,
    status: meta.status || (label === 'Captured frame' ? 'Captured' : 'Ready'),
    resolution: `${refs.sourceImage.naturalWidth} × ${refs.sourceImage.naturalHeight}`,
    fileSize: meta.fileSize || 'Stream frame',
    location: meta.location || '',
    acquired: meta.acquired || timestamp(),
    fileName: meta.fileName || ''
  };
  updateImageInformation();
  completeProcess('information');
  completeProcess('quality');
}

function buildImageView(mode) {
  if (mode === 'original') return Promise.resolve(originalImageUrl);
  if (imageViews[mode]) return Promise.resolve(imageViews[mode]);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1280 / image.naturalWidth);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (mode === 'blur') {
        context.filter = 'blur(2.2px)';
        context.drawImage(image, 0, 0, width, height);
      } else {
        context.drawImage(image, 0, 0, width, height);
        const frame = context.getImageData(0, 0, width, height);
        const { data } = frame;
        if (mode === 'grayscale' || mode === 'threshold') {
          for (let index = 0; index < data.length; index += 4) {
            const luminance = Math.round(data[index] * .299 + data[index + 1] * .587 + data[index + 2] * .114);
            const value = mode === 'threshold' ? (luminance > 128 ? 255 : 0) : luminance;
            data[index] = value; data[index + 1] = value; data[index + 2] = value;
          }
        } else if (mode === 'edges') {
          const grey = new Uint8ClampedArray(width * height);
          for (let pixel = 0, index = 0; index < data.length; pixel += 1, index += 4) grey[pixel] = Math.round(data[index] * .299 + data[index + 1] * .587 + data[index + 2] * .114);
          for (let y = 1; y < height - 1; y += 1) {
            for (let x = 1; x < width - 1; x += 1) {
              const p = y * width + x;
              const gx = -grey[p - width - 1] + grey[p - width + 1] - 2 * grey[p - 1] + 2 * grey[p + 1] - grey[p + width - 1] + grey[p + width + 1];
              const gy = -grey[p - width - 1] - 2 * grey[p - width] - grey[p - width + 1] + grey[p + width - 1] + 2 * grey[p + width] + grey[p + width + 1];
              const value = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 1.35);
              const offset = p * 4;
              data[offset] = value; data[offset + 1] = value; data[offset + 2] = value;
            }
          }
        }
        context.putImageData(frame, 0, 0);
      }
      imageViews[mode] = canvas.toDataURL('image/png');
      resolve(imageViews[mode]);
    };
    image.onerror = () => reject(new Error('The source image could not be processed.'));
    image.src = originalImageUrl;
  });
}

async function setImageView(mode) {
  if (!originalImageUrl) return;
  try {
    const url = await buildImageView(mode);
    refs.sourceImage.src = url;
    currentView = mode;
    document.querySelectorAll('.image-view-control').forEach((control) => control.classList.toggle('active', control.dataset.view === mode));
    if (mode !== 'original') completeProcess(mode === 'edges' ? 'edges' : mode);
    log(`${mode === 'edges' ? 'Edge map' : mode[0].toUpperCase() + mode.slice(1)} review view displayed.`);
  } catch (error) {
    toast('The selected processing view could not be created.', 'warn');
  }
}

async function prepareImagePipeline() {
  if (!originalImageUrl) return;
  const stages = ['grayscale', 'blur', 'threshold', 'edges'];
  try {
    for (const stage of stages) {
      await buildImageView(stage);
      completeProcess(stage);
    }
    log('Image preparation pipeline completed.', 'green');
  } catch (error) {
    log('Image preparation pipeline could not complete.', 'red');
  }
}

function setReady(kind, label, details) {
  source = kind;
  resetProcessSteps();
  refs.imageStage.classList.remove('empty');
  refs.emptyState.hidden = true;
  refs.mediaWrap.hidden = false;
  refs.sourceTag.textContent = label;
  refs.imageFooterInfo.textContent = details;
  refs.imageReadyDot.classList.add('live');
  refs.startButton.disabled = false;
  refs.monitorRunButton.disabled = false;
  refs.startHint.textContent = 'Ready to run anomaly detection.';
  refs.statusPill.textContent = 'Ready';
  refs.statusPill.className = 'status-pill';
  refs.progressText.textContent = 'Analysis progress';
  completeProcess('open');
  completeProcess('display');
  log(`${label} is ready for inspection.`, 'green');
}

function chooseUpload() { refs.fileInput.click(); }

function showImage(url, label = 'Image source', details = 'Image loaded · ready for inspection', meta = {}) {
  stopCamera(false);
  originalImageUrl = url;
  imageViews = { original: url };
  currentView = 'original';
  refs.sourceImage.onload = () => {
    refs.sourceImage.onload = null;
    sourceImageLoaded(label, meta);
  };
  refs.sourceImage.src = url;
  refs.sourceImage.hidden = false;
  refs.sourceVideo.hidden = true;
  refs.mediaWrap.classList.toggle('demo-media', label === 'Demo frame');
  refs.cameraControls.hidden = true;
  refs.imageTools.hidden = false;
  document.querySelectorAll('.image-view-control').forEach((control) => control.classList.toggle('active', control.dataset.view === 'original'));
  setReady(label === 'Demo frame' ? 'demo' : 'upload', label, details);
}

function loadDemo() {
  showImage(demoSvg, 'Demo frame', 'CAM 02 · 1200 × 720 · Demonstration scene', { status: 'Reference frame', fileSize: 'Embedded training frame', acquired: timestamp() });
  toast('Demonstration frame loaded.', 'success');
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) { toast('This browser does not provide camera access.', 'warn'); return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    originalImageUrl = '';
    imageViews = {};
    refs.imageTools.hidden = true;
    refs.sourceVideo.srcObject = stream;
    refs.sourceVideo.hidden = false;
    refs.sourceImage.hidden = true;
    refs.mediaWrap.classList.remove('demo-media');
    refs.cameraControls.hidden = false;
    refs.cameraButtonText.textContent = 'Live camera connected';
    refs.cameraButtonSubtext.textContent = 'Capture a frame to inspect';
    setReady('camera', 'Live feed', 'CAM 01 · Live inspection feed');
    imageMeta = { source: 'CAM 01', status: 'Live', resolution: '1280 × 720 (stream)', fileSize: 'Live stream', location: '', acquired: timestamp() };
    updateImageInformation();
    completeProcess('information');
    completeProcess('quality');
    toast('Live camera connected.', 'success');
  } catch (error) {
    toast('Camera access was unavailable. Use an uploaded image or demo frame.', 'warn');
    log('Camera connection could not be established.', 'red');
  }
}

function stopCamera(resetLabel = true) {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  if (refs.sourceVideo.srcObject) refs.sourceVideo.srcObject = null;
  if (resetLabel) { refs.cameraButtonText.textContent = 'Open live camera'; refs.cameraButtonSubtext.textContent = 'Use connected inspection feed'; }
}

function captureFrame() {
  if (!stream || !refs.sourceVideo.videoWidth) { toast('Waiting for a usable camera frame.', 'warn'); return; }
  const canvas = document.createElement('canvas');
  canvas.width = refs.sourceVideo.videoWidth;
  canvas.height = refs.sourceVideo.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(refs.sourceVideo, 0, 0, canvas.width, canvas.height);
  showImage(canvas.toDataURL('image/jpeg', .92), 'Captured frame', `CAM 01 · ${canvas.width} × ${canvas.height} · Captured just now`, { status: 'Captured', fileSize: 'Captured from CAM 01', acquired: timestamp() });
  toast('Frame captured and ready for detection.', 'success');
}

function makeResults() {
  if (source === 'demo') return [
    { name: 'Loose material', severity: 'critical', confidence: 96, location: 'Centre cross-member', box: { left: 49, top: 48, width: 10, height: 16 }, detail: 'Irregular material profile detected near the central frame member.' },
    { name: 'Metal debris', severity: 'low', confidence: 88, location: 'Brake-line zone', box: { left: 25, top: 36, width: 7, height: 10 }, detail: 'Small high-contrast object requires visual confirmation.' }
  ];
  const uploaded = source === 'upload';
  return [
    { name: uploaded ? 'Unverified object' : 'Possible obstruction', severity: 'critical', confidence: highAccuracy ? 92 : 83, location: 'Undercarriage zone B', box: { left: 51, top: 46, width: 12, height: 17 }, detail: 'An anomaly differs from the expected undercarriage profile.' },
    { name: 'Surface anomaly', severity: 'low', confidence: highAccuracy ? 81 : 72, location: 'Outer equipment area', box: { left: 27, top: 34, width: 8, height: 11 }, detail: 'Review illumination and hardware condition at this point.' }
  ];
}

function showOverlays() {
  refs.overlayLayer.innerHTML = results.map((result, index) => `<div class="detection-box ${result.severity}" style="left:${result.box.left}%;top:${result.box.top}%;width:${result.box.width}%;height:${result.box.height}%"><span>${index + 1} · ${result.name} ${result.confidence}%</span></div>`).join('');
}

function updateResultsPanel() {
  const critical = results.filter(r => r.severity === 'critical').length;
  const average = Math.round(results.reduce((sum, result) => sum + result.confidence, 0) / results.length);
  refs.resultSummary.innerHTML = `<div class="summary-stat alert"><span>Review items</span><strong>${results.length}</strong></div><div class="summary-stat"><span>Average confidence</span><strong>${average}%</strong></div><div class="summary-stat"><span>Profile</span><strong>${highAccuracy ? 'High' : 'Standard'}</strong></div>`;
  refs.findingsGrid.innerHTML = results.map((result, index) => `<article class="finding"><div class="finding-top"><h3>${index + 1}. ${result.name}</h3><span class="severity ${result.severity}">${result.severity}</span></div><p>${result.detail}</p><p><b>Location:</b> ${result.location}</p><div class="confidence">Model confidence <b>${result.confidence}%</b></div></article>`).join('');
  refs.decisionTitle.textContent = critical ? 'Operator review required' : 'No blocking items detected';
  refs.decisionDescription.textContent = critical ? 'Confirm the findings before choosing a release action.' : 'The vehicle may be released after standard sign-off.';
  refs.decisionBar.classList.toggle('clear', !critical);
}

function runDetection() {
  if (!source || scanTimer) return;
  if (!recordSaved && !saveRecord(false)) {
    toast('Save the train and inspection location before detection.', 'warn');
    (!refs.trainNumber.value.trim() ? refs.trainNumber : refs.inspectionLocation).focus();
    return;
  }
  if (!refs.operatorCheck.checked) { toast('Confirm that the operator area is clear before running a scan.', 'warn'); refs.operatorCheck.focus(); return; }
  if (!originalImageUrl) { toast('Capture a still frame before running the image-processing scan.', 'warn'); return; }
  refs.startButton.disabled = true;
  refs.monitorRunButton.disabled = true;
  refs.progressBar.style.width = '0%';
  refs.progressValue.textContent = '0%';
  refs.progressText.textContent = 'Analysing source';
  refs.statusPill.textContent = 'Scanning';
  refs.statusPill.className = 'status-pill scanning';
  refs.scanLine.hidden = false;
  refs.overlayLayer.innerHTML = '';
  refs.resultsSection.hidden = true;
  prepareImagePipeline();
  let value = 0;
  log(`Detection scan started in ${highAccuracy ? 'high accuracy' : 'standard'} mode.`);
  scanTimer = setInterval(() => {
    value += Math.floor(Math.random() * 10) + 5;
    if (value >= 100) {
      value = 100;
      clearInterval(scanTimer);
      scanTimer = null;
      setTimeout(completeDetection, 250);
    }
    refs.progressBar.style.width = `${value}%`;
    refs.progressValue.textContent = `${value}%`;
  }, highAccuracy ? 175 : 105);
}

function completeDetection() {
  results = makeResults();
  showOverlays();
  updateResultsPanel();
  refs.scanLine.hidden = true;
  refs.progressText.textContent = 'Analysis complete';
  refs.statusPill.textContent = 'Review needed';
  refs.statusPill.className = 'status-pill complete';
  completeProcess('scan');
  refs.recordText.textContent = `Scan ${String(activity.length + 1).padStart(3, '0')} · ${results.length} review items`;
  refs.resultsSection.hidden = false;
  refs.startButton.disabled = false;
  refs.monitorRunButton.disabled = false;
  refs.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  log(`Scan complete: ${results.length} anomaly candidates require review.`, 'red');
  toast(`${results.length} potential object${results.length > 1 ? 's' : ''} found. Review the evidence.`, 'warn');
}

function clearWorkspace() {
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
  stopCamera();
  source = null; results = []; originalImageUrl = ''; imageViews = {}; imageMeta = {}; currentView = 'original';
  refs.sourceImage.removeAttribute('src'); refs.sourceImage.hidden = true; refs.sourceVideo.hidden = true;
  refs.mediaWrap.hidden = true; refs.emptyState.hidden = false; refs.imageStage.classList.add('empty'); refs.mediaWrap.classList.remove('demo-media');
  refs.overlayLayer.innerHTML = ''; refs.scanLine.hidden = true; refs.cameraControls.hidden = true;
  refs.imageTools.hidden = true; resetProcessSteps();
  refs.sourceTag.textContent = 'Awaiting source'; refs.imageFooterInfo.textContent = 'No image metadata available'; refs.imageReadyDot.classList.remove('live');
  updateImageInformation({});
  refs.startButton.disabled = true; refs.monitorRunButton.disabled = true; refs.startHint.textContent = 'Select an image or open the camera to continue.';
  refs.progressBar.style.width = '0%'; refs.progressValue.textContent = '0%'; refs.progressText.textContent = 'Analysis progress'; refs.statusPill.textContent = 'Ready'; refs.statusPill.className = 'status-pill'; refs.recordText.textContent = 'Available after each scan'; refs.resultsSection.hidden = true;
  log('Workspace cleared.'); toast('Inspection workspace cleared.');
}

function exportReport() {
  if (!results.length) { toast('Complete a scan before exporting a report.', 'warn'); return; }
  const report = { application: 'BogieVision', generatedAt: new Date().toISOString(), inspectionRecord: getRecordData(), imageInformation: imageMeta, source, profile: highAccuracy ? 'High accuracy' : 'Standard', processingChecks: processState, decision: 'Operator review required', findings: results.map(({name,severity,confidence,location,detail}) => ({name,severity,confidence,location,detail})) };
  const blob = new Blob([JSON.stringify(report, null, 2)], {type:'application/json'});
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `bogievision-inspection-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  completeProcess('report');
  log('Inspection report exported.', 'green'); toast('Inspection report downloaded.', 'success');
}

function openModal(type) {
  const release = type === 'release';
  refs.modalSymbol.textContent = release ? '✓' : '⚑';
  refs.modalSymbol.style.background = release ? '#0bb882' : '#e59600';
  refs.modalTitle.textContent = release ? 'Vehicle release recorded' : 'Maintenance request recorded';
  refs.modalBody.textContent = release ? 'The vehicle has been marked released in this inspection session. A supervisor should retain the exported evidence record.' : 'The vehicle is marked for maintenance. The review findings have been retained in this session.';
  refs.modalBackdrop.hidden = false;
  log(release ? 'Vehicle release was recorded by operator.' : 'Vehicle was marked for maintenance.', release ? 'green' : 'red');
}

function closeModal() { refs.modalBackdrop.hidden = true; }

refs.uploadButton.addEventListener('click', chooseUpload);
refs.fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('Please select a JPG, PNG, or WebP image.', 'warn'); return; }
  const reader = new FileReader();
  reader.onload = () => showImage(reader.result, 'Uploaded image', `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`, { status: 'Uploaded', fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`, fileName: file.name, acquired: timestamp() });
  reader.readAsDataURL(file);
});
refs.cameraButton.addEventListener('click', () => stream ? captureFrame() : openCamera());
refs.demoButton.addEventListener('click', loadDemo);
refs.captureButton.addEventListener('click', captureFrame);
refs.stopCameraButton.addEventListener('click', () => { stopCamera(); clearWorkspace(); });
refs.startButton.addEventListener('click', runDetection); refs.monitorRunButton.addEventListener('click', runDetection); refs.clearButton.addEventListener('click', clearWorkspace); refs.newScanButton.addEventListener('click', clearWorkspace); refs.exportButton.addEventListener('click', exportReport);
refs.accuracyToggle.addEventListener('click', () => { highAccuracy = !highAccuracy; refs.accuracyToggle.setAttribute('aria-checked', highAccuracy); refs.accuracyToggle.querySelector('.toggle').classList.toggle('on', highAccuracy); toast(`Inspection profile set to ${highAccuracy ? 'high accuracy' : 'standard'} mode.`); });
refs.saveRecordButton.addEventListener('click', () => saveRecord(true));
[refs.trainNumber, refs.coachBogie, refs.inspectionLocation, refs.officerId].forEach((field) => field.addEventListener('input', () => { if (recordSaved) setRecordState(false, 'Record has changed. Save it again before detection.'); else updateImageInformation(); }));
document.querySelectorAll('.image-view-control').forEach((control) => control.addEventListener('click', () => setImageView(control.dataset.view)));
refs.releaseButton.addEventListener('click', () => openModal('release')); refs.maintenanceButton.addEventListener('click', () => openModal('maintenance')); refs.modalClose.addEventListener('click', closeModal); refs.modalConfirm.addEventListener('click', closeModal); refs.modalBackdrop.addEventListener('click', event => { if (event.target === refs.modalBackdrop) closeModal(); });
refs.themeToggle.addEventListener('click', () => { document.body.classList.toggle('dark'); toast(`${document.body.classList.contains('dark') ? 'Dark' : 'Light'} appearance enabled.`); });
window.addEventListener('beforeunload', () => stopCamera(false));
log('Secure inspection session initialized.', 'green');
