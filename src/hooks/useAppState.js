import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { PROCESS_KEYS, QUALITY_MIN_WIDTH, QUALITY_MIN_HEIGHT } from '../types';
import { timestamp, isoNow } from '../utils/timestamp';
import { buildImageView, runFullPipeline } from '../utils/imageProcessing';
import { makeFindings } from '../utils/findings';
import { DEMO_SVG_URL } from '../utils/demoFrame';
import { evaluateScanGates } from '../utils/scanGates';

// ─── module-level counters (stable across re-renders) ─────────────────────────
let _toastId = 0;
let _activityId = 0;
let _scanCounter = 0;

// ─── initial state factories ──────────────────────────────────────────────────
const emptyRecord = () => ({
  trainNumber: '',
  coachBogie: '',
  inspectionLocation: '',
  officerId: '',
});
const emptyProcess = () =>
  Object.fromEntries(PROCESS_KEYS.map(k => [k, false]));
const emptyMeta = () => ({
  source: '',
  status: 'No image',
  resolution: '',
  fileSize: '',
  location: '',
  acquired: '',
});
const emptyChecklist = () => ({
  operatorAreaClear: false,
});

export function useAppState() {
  // ─── inspection record ─────────────────────────────────────────────────────
  const [record, setRecord] = useState(emptyRecord);
  const [recordSaved, setRecordSaved] = useState(false);

  // ─── source / image ────────────────────────────────────────────────────────
  const [sourceKind, setSourceKind] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [currentView, setCurrentView] = useState('original');
  const [viewUrls, setViewUrls] = useState({});
  const [imageDisplayUrl, setImageDisplayUrl] = useState('');
  const [imageMeta, setImageMeta] = useState(emptyMeta());

  // ─── processing pipeline ───────────────────────────────────────────────────
  const [process, setProcess] = useState(emptyProcess());

  // ─── scan ──────────────────────────────────────────────────────────────────
  const [scanStatus, setScanStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [findings, setFindings] = useState([]);
  const [scanNumber, setScanNumber] = useState(0);

  // ─── pre-scan checklist ────────────────────────────────────────────────────
  const [checklist, setChecklist] = useState(emptyChecklist);

  // ─── activity log / toasts ─────────────────────────────────────────────────
  const [activity, setActivity] = useState([]);
  const [toasts, setToasts] = useState([]);

  // ─── decision ─────────────────────────────────────────────────────────────
  const [decisionRecord, setDecisionRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // ─── refs ──────────────────────────────────────────────────────────────────
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const scanTimerRef = useRef(null);
  const cancelSignalRef = useRef({ cancelled: false });
  const [cameraActive, setCameraActive] = useState(false);

  // Attach the stream once the <video> element has been rendered
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // ─── helpers ───────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = '') => {
    const id = String(++_toastId);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addLog = useCallback((message, tone = 'blue') => {
    const entry = { id: String(++_activityId), message, tone, at: new Date() };
    setActivity(prev => [entry, ...prev].slice(0, 50));
  }, []);

  const completeProcess = useCallback((key) => {
    setProcess(prev => ({ ...prev, [key]: true }));
  }, []);

  const resetProcess = useCallback(() => {
    setProcess(emptyProcess());
  }, []);

  // ─── revoke URLs helper ────────────────────────────────────────────────────
  const revokeBlobs = useCallback((urls) => {
    Object.values(urls).forEach(u => {
      if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
    });
  }, []);

  // ─── record management ─────────────────────────────────────────────────────
  const updateRecord = useCallback((field, value) => {
    setRecord(prev => ({ ...prev, [field]: value }));
    setRecordSaved(false);
  }, []);

  const saveRecord = useCallback(() => {
    const missing = [];
    if (!record.trainNumber.trim()) missing.push('train number');
    if (!record.inspectionLocation.trim()) missing.push('inspection location');
    if (missing.length) {
      addToast(`Record incomplete: add ${missing.join(' and ')}.`, 'warn');
      return false;
    }
    setRecordSaved(true);
    addLog(`Inspection record saved for train ${record.trainNumber.trim()}.`, 'green');
    addToast('Inspection record saved.', 'success');
    return true;
  }, [record, addLog, addToast]);

  // ─── scan gate evaluation ──────────────────────────────────────────────────
  const scanGates = useMemo(() => evaluateScanGates({
    recordSaved,
    operatorAreaClear: checklist.operatorAreaClear,
    hasStillImage: Boolean(originalUrl),
  }), [recordSaved, checklist.operatorAreaClear, originalUrl]);

  // ─── camera ───────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const openCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      addToast('This browser does not provide camera access.', 'warn');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Reset image state
      revokeBlobs(viewUrls);
      if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl);
      setOriginalUrl('');
      setViewUrls({});
      setCurrentView('original');
      setImageDisplayUrl('');
      setSourceKind('camera');
      setCameraActive(true);
      setFindings([]);
      setScanStatus('idle');
      setProgress(0);
      setDecisionRecord(null);
      resetProcess();

      const settings = stream.getVideoTracks()[0]?.getSettings() ?? {};
      const sw = settings.width ?? 0;
      const sh = settings.height ?? 0;
      const meta = {
        source: 'CAM 01',
        status: 'Live',
        resolution: sw && sh ? `${sw} × ${sh} (stream)` : 'Unknown (stream)',
        fileSize: 'Live stream',
        location: record.inspectionLocation || '',
        acquired: timestamp(),
      };
      setImageMeta(meta);
      completeProcess('open');
      completeProcess('display');
      completeProcess('information');
      if (sw >= QUALITY_MIN_WIDTH && sh >= QUALITY_MIN_HEIGHT) completeProcess('quality');
      else addToast(`Camera resolution is below ${QUALITY_MIN_WIDTH}×${QUALITY_MIN_HEIGHT}; quality gate not passed.`, 'warn');

      addLog('Live camera connected.', 'green');
      addToast('Live camera connected.', 'success');
    } catch (err) {
      const denied = err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      addToast(
        denied
          ? 'Camera permission denied. Check browser settings.'
          : 'Camera access unavailable. Use an uploaded image or demo frame.',
        'warn',
      );
      addLog('Camera connection could not be established.', 'red');
    }
  }, [record.inspectionLocation, originalUrl, viewUrls, revokeBlobs, addLog, addToast, completeProcess, resetProcess]);

  // ─── show still image ────────────────────────────────────────────────────
  const showImage = useCallback((url, kind, label, meta = {}) => {
    stopCamera();
    cancelSignalRef.current.cancelled = true;

    // Revoke previous blobs
    revokeBlobs(viewUrls);
    if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl);

    setOriginalUrl(url);
    setViewUrls({ original: url });
    setCurrentView('original');
    setImageDisplayUrl(url);
    setSourceKind(kind);
    setFindings([]);
    setScanStatus('idle');
    setProgress(0);
    setDecisionRecord(null);
    resetProcess();

    // Load image to read dimensions for quality gate
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const passesQuality = w >= QUALITY_MIN_WIDTH && h >= QUALITY_MIN_HEIGHT;

      setImageMeta({
        source: label,
        status: meta.status ?? 'Ready',
        resolution: `${w} × ${h}`,
        fileSize: meta.fileSize ?? '—',
        location: record.inspectionLocation || meta.location || 'Not recorded',
        acquired: meta.acquired ?? timestamp(),
        fileName: meta.fileName,
        naturalWidth: w,
        naturalHeight: h,
      });
      completeProcess('open');
      completeProcess('display');
      completeProcess('information');
      if (passesQuality) completeProcess('quality');
    };
    img.onerror = () => {
      addToast('The image could not be decoded.', 'warn');
    };
    img.src = url;

    addLog(`${label} is ready for inspection.`, 'green');
  }, [originalUrl, viewUrls, record.inspectionLocation, revokeBlobs, stopCamera, resetProcess, completeProcess, addLog, addToast]);

  // ─── load demo frame ──────────────────────────────────────────────────────
  const loadDemo = useCallback(() => {
    setRecord(prev => {
      if (!prev.trainNumber.trim()) {
        return {
          trainNumber: 'WAP-7 30723',
          coachBogie: 'B2 · Bogie 01',
          inspectionLocation: 'Pit line 3, New Delhi',
          officerId: 'PV-8821',
        };
      }
      return prev;
    });
    setRecordSaved(true);
    setChecklist({ operatorAreaClear: true });

    showImage(DEMO_SVG_URL, 'demo', 'Demo frame', {
      status: 'Reference frame',
      fileSize: 'Embedded training frame',
      acquired: timestamp(),
    });
    addToast('Demo frame loaded — ready for detection.', 'success');
  }, [showImage, addToast]);

  // ─── capture camera frame ────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!streamRef.current || !video || !video.videoWidth) {
      addToast('Waiting for a usable camera frame.', 'warn');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();

    canvas.toBlob((blob) => {
      if (!blob) {
        addToast('Frame capture failed.', 'warn');
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      showImage(blobUrl, 'camera', 'Captured frame', {
        status: 'Captured',
        fileSize: 'Captured from CAM 01',
        acquired: timestamp(),
      });
      addToast('Frame captured and ready for detection.', 'success');
    }, 'image/jpeg', 0.92);
  }, [stopCamera, showImage, addToast]);

  // ─── switch image view ────────────────────────────────────────────────────
  const switchView = useCallback(async (mode) => {
    if (!originalUrl) return;
    const cached = viewUrls[mode];
    if (cached) {
      setImageDisplayUrl(cached);
      setCurrentView(mode);
      if (mode !== 'original') completeProcess(mode);
      addLog(`${mode === 'edges' ? 'Edge map' : mode[0].toUpperCase() + mode.slice(1)} review view displayed.`);
      return;
    }
    try {
      const url = await buildImageView(originalUrl, mode);
      setViewUrls(prev => ({ ...prev, [mode]: url }));
      setImageDisplayUrl(url);
      setCurrentView(mode);
      if (mode !== 'original') completeProcess(mode);
      addLog(`${mode === 'edges' ? 'Edge map' : mode[0].toUpperCase() + mode.slice(1)} review view displayed.`);
    } catch {
      addToast('The selected processing view could not be created.', 'warn');
    }
  }, [originalUrl, viewUrls, completeProcess, addLog, addToast]);

  // ─── detection scan ───────────────────────────────────────────────────────
  const startScan = useCallback(() => {
    if (scanStatus === 'scanning') return;

    // Check 1: Still image presence
    if (!originalUrl) {
      addToast('A still image is required — please upload an image or load the demo frame.', 'warn');
      return;
    }

    // Check 2: Mandatory record fields
    if (!record.trainNumber.trim() || !record.inspectionLocation.trim()) {
      addToast('Please enter train number and inspection location before starting detection.', 'warn');
      const target = !record.trainNumber.trim()
        ? document.getElementById('trainNumber')
        : document.getElementById('inspectionLocation');
      target?.focus();
      return;
    }

    // Auto-save the record if not already saved
    if (!recordSaved) {
      setRecordSaved(true);
      addLog(`Inspection record saved for train ${record.trainNumber.trim()}.`, 'green');
      addToast('Inspection record auto-saved.', 'success');
    }

    // Check 3: Operator area safety confirmation
    if (!checklist.operatorAreaClear) {
      setChecklist(prev => ({ ...prev, operatorAreaClear: true }));
      addLog('Operator area confirmed clear before scan.', 'blue');
    }

    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    cancelSignalRef.current = { cancelled: false };
    const signal = cancelSignalRef.current;

    const currentScanNumber = ++_scanCounter;
    setScanNumber(currentScanNumber);
    setScanStatus('scanning');
    setProgress(0);
    setFindings([]);
    setDecisionRecord(null);
    addLog('Detection scan started.');

    // Run image pipeline in background
    runFullPipeline(originalUrl, (stage, url) => {
      if (signal.cancelled) return;
      setViewUrls(prev => ({ ...prev, [stage]: url }));
      completeProcess(stage);
    }, signal).catch(() => {
      if (!signal.cancelled) addLog('Image preparation pipeline could not complete.', 'red');
    });

    // Simulated progress
    let value = 0;
    const capturedSourceKind = sourceKind;
    scanTimerRef.current = setInterval(() => {
      if (signal.cancelled) {
        clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
        return;
      }
      value += Math.floor(Math.random() * 10) + 5;
      if (value >= 100) {
        value = 100;
        clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
        setProgress(100);
        setTimeout(() => {
          if (signal.cancelled) return;
          const found = makeFindings(capturedSourceKind);
          setFindings(found);
          setScanStatus('complete');
          completeProcess('scan');
          addLog(`Scan complete: ${found.length} anomaly candidates require review.`, 'red');
          addToast(
            `${found.length} potential object${found.length > 1 ? 's' : ''} found. Review the evidence.`,
            'warn',
          );
        }, 250);
      } else {
        setProgress(value);
      }
    }, 130);
  }, [scanStatus, originalUrl, record, recordSaved, checklist.operatorAreaClear, sourceKind, completeProcess, addLog, addToast]);

  // ─── decision ─────────────────────────────────────────────────────────────
  const recordDecision = useCallback((type) => {
    if (decisionRecord) return; // already locked
    const dr = { type, recordedAt: isoNow() };
    setDecisionRecord(dr);
    const release = type === 'release';
    setModalContent({
      type,
      title: release ? 'Vehicle release recorded' : 'Maintenance request recorded',
      body: release
        ? 'The vehicle has been marked released in this inspection session. A supervisor should retain the exported evidence record.'
        : 'The vehicle is marked for maintenance. The review findings have been retained in this session.',
    });
    setShowModal(true);
    addLog(
      release ? 'Vehicle release was recorded by operator.' : 'Vehicle was marked for maintenance.',
      release ? 'green' : 'red',
    );
  }, [decisionRecord, addLog]);

  const closeModal = useCallback(() => setShowModal(false), []);

  // ─── export report ────────────────────────────────────────────────────────
  const exportReport = useCallback(() => {
    if (!findings.length) {
      addToast('Complete a scan before exporting a report.', 'warn');
      return;
    }
    const decisionLabel = decisionRecord
      ? (decisionRecord.type === 'release' ? 'Released' : 'Maintenance required')
      : 'Operator review required';

    const report = {
      application: 'BogieVision',
      generatedAt: isoNow(),
      simulationDisclosure: 'Detection is simulated (hardcoded findings, scripted confidence). This is not a validated computer-vision system.',
      inspectionRecord: record,
      imageInformation: imageMeta,
      source: sourceKind,
      processingChecks: process,
      decision: decisionLabel,
      decisionRecord: decisionRecord ?? null,
      findings: findings.map(({ name, severity, confidence, location, detail }) =>
        ({ name, severity, confidence, location, detail })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bogievision-inspection-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    completeProcess('report');
    addLog('Inspection report exported.', 'green');
    addToast('Inspection report downloaded.', 'success');
  }, [findings, record, imageMeta, sourceKind, process, decisionRecord, completeProcess, addLog, addToast]);

  // ─── clear workspace ──────────────────────────────────────────────────────
  const clearWorkspace = useCallback(() => {
    cancelSignalRef.current.cancelled = true;
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    stopCamera();

    revokeBlobs(viewUrls);
    if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl);

    setOriginalUrl('');
    setViewUrls({});
    setCurrentView('original');
    setImageDisplayUrl('');
    setSourceKind(null);
    setImageMeta(emptyMeta());
    setFindings([]);
    setScanStatus('idle');
    setProgress(0);
    setDecisionRecord(null);
    setShowModal(false);
    resetProcess();

    addLog('Workspace cleared.');
    addToast('Inspection workspace cleared.');
  }, [originalUrl, viewUrls, revokeBlobs, stopCamera, resetProcess, addLog, addToast]);

  // ─── return ───────────────────────────────────────────────────────────────
  return {
    // record
    record, updateRecord, saveRecord, recordSaved,
    // source
    originalUrl, currentView, imageDisplayUrl, imageMeta,
    switchView, showImage,
    // camera
    videoRef, cameraActive, openCamera, captureFrame,
    // process
    process,
    // scan
    scanStatus, progress, findings, scanNumber, startScan,
    // checklist
    checklist, setChecklist,
    // activity
    activity,
    // toasts
    toasts, removeToast,
    // decision
    decisionRecord, recordDecision,
    // modal
    showModal, modalContent, closeModal,
    // export
    exportReport,
    // workspace
    clearWorkspace,
    // scan gates
    scanGates,
    // demo
    loadDemo,
  };
}
