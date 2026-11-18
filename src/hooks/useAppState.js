import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { PROCESS_KEYS, QUALITY_MIN_WIDTH, QUALITY_MIN_HEIGHT } from '../types';
import { timestamp, isoNow } from '../utils/timestamp';
import { buildImageView, runFullPipeline } from '../utils/imageProcessing';
import { evaluateScanGates } from '../utils/scanGates';
import { sendInspectionRequest, ApiError } from '../services/inspectionApi';
import { DEMO_SVG_URL } from '../utils/demoFrame';

// ─── module-level counters ──────────────────────────────────────────────────
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
  naturalWidth: 0,
  naturalHeight: 0,
});

const emptyChecklist = () => ({
  operatorAreaClear: false,
});

/** Helper to convert SVG data URL to Blob for HTTP multipart upload */
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/svg+xml';
  const byteString = decodeURIComponent(parts[1]);
  return new Blob([byteString], { type: mime });
}

export function useAppState() {
  // ─── inspection record ─────────────────────────────────────────────────────
  const [record, setRecord] = useState(emptyRecord);
  const [recordSaved, setRecordSaved] = useState(false);

  // ─── source / image ────────────────────────────────────────────────────────
  const [sourceKind, setSourceKind] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [originalBlob, setOriginalBlob] = useState(null);
  const [currentView, setCurrentView] = useState('original');
  const [viewUrls, setViewUrls] = useState({});
  const [imageDisplayUrl, setImageDisplayUrl] = useState('');
  const [imageMeta, setImageMeta] = useState(emptyMeta());

  // ─── processing pipeline ───────────────────────────────────────────────────
  const [process, setProcess] = useState(emptyProcess());

  // ─── real AI inspection states ─────────────────────────────────────────────
  // scanStatus: 'idle' | 'preparing' | 'uploading' | 'inferring' | 'receiving' | 'complete' | 'failed' | 'cancelled'
  const [scanStatus, setScanStatus] = useState('idle');
  const [scanError, setScanError] = useState(null);
  const [inspectionResult, setInspectionResult] = useState(null);
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
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const pipelineSignalRef = useRef({ cancelled: false });
  const [cameraActive, setCameraActive] = useState(false);

  // Attach camera stream once the <video> element has rendered
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Teardown camera & abort pending requests on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ─── helpers ───────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = '') => {
    const id = String(++_toastId);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
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
    setRecordSaved(false); // Invalidate record until saved again
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

  // ─── camera operations ─────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  // Dedicated "End Feed" action: stops live camera without deleting inspection context
  const endCameraFeed = useCallback(() => {
    stopCamera();
    addLog('Live camera feed closed.', 'blue');
    addToast('Camera feed ended.', 'info');
  }, [stopCamera, addLog, addToast]);

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

      // Abort any active request and reset views
      if (abortControllerRef.current) abortControllerRef.current.abort();
      pipelineSignalRef.current.cancelled = true;

      revokeBlobs(viewUrls);
      if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl);

      setOriginalUrl('');
      setOriginalBlob(null);
      setViewUrls({});
      setCurrentView('original');
      setImageDisplayUrl('');
      setSourceKind('camera');
      setCameraActive(true);
      setInspectionResult(null);
      setScanError(null);
      setScanStatus('idle');
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
        naturalWidth: sw,
        naturalHeight: sh,
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
  const showImage = useCallback((url, kind, label, meta = {}, blob = null) => {
    stopCamera();
    pipelineSignalRef.current.cancelled = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();

    // Revoke previous blobs
    revokeBlobs(viewUrls);
    if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl);

    setOriginalUrl(url);
    setOriginalBlob(blob);
    setViewUrls({ original: url });
    setCurrentView('original');
    setImageDisplayUrl(url);
    setSourceKind(kind);
    setInspectionResult(null);
    setScanError(null);
    setScanStatus('idle');
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
  // Demo frame remains for UI testing, but produces NO fake AI findings
  const loadDemo = useCallback(() => {
    const demoBlob = dataUrlToBlob(DEMO_SVG_URL);
    showImage(DEMO_SVG_URL, 'demo', 'Demo frame', {
      status: 'Reference frame',
      fileSize: 'Embedded SVG frame',
      acquired: timestamp(),
      fileName: 'bogie-demo-frame.svg',
    }, demoBlob);
    addToast('Demonstration frame loaded.', 'success');
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
        fileSize: `${(blob.size / 1024).toFixed(1)} KB`,
        acquired: timestamp(),
        fileName: `capture-${Date.now()}.jpg`,
      }, blob);
      addToast('Frame captured and ready for inspection.', 'success');
    }, 'image/jpeg', 0.92);
  }, [stopCamera, showImage, addToast]);

  // ─── switch image view ────────────────────────────────────────────────────
  const switchView = useCallback(async (mode) => {
    if (!originalUrl) return;

    // Handle backend annotated view if available
    if (mode === 'annotated') {
      if (viewUrls.annotated) {
        setImageDisplayUrl(viewUrls.annotated);
        setCurrentView('annotated');
        addLog('AI annotated evidence view displayed.');
      } else {
        addToast('Annotated view is not available for this inspection.', 'info');
      }
      return;
    }

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

  // ─── real AI detection scan ───────────────────────────────────────────────
  const startScan = useCallback(async () => {
    const isScanning = ['preparing', 'uploading', 'inferring', 'receiving'].includes(scanStatus);
    if (isScanning) return; // Prevent duplicate requests

    // Verify mandatory scan gates
    if (!originalUrl) {
      addToast('A still image is required — upload an image, capture from camera, or load the demo frame.', 'warn');
      return;
    }

    if (!recordSaved) {
      addToast('Inspection record must be saved before detection can proceed.', 'warn');
      const target = !record.trainNumber.trim()
        ? document.getElementById('trainNumber')
        : document.getElementById('inspectionLocation');
      target?.focus();
      return;
    }

    if (!checklist.operatorAreaClear) {
      addToast('Operator area clear confirmation must be ticked before detection.', 'warn');
      document.getElementById('check-operatorAreaClear')?.focus();
      return;
    }

    // Prepare Blob for upload
    let uploadBlob = originalBlob;
    if (!uploadBlob) {
      if (originalUrl.startsWith('data:')) {
        uploadBlob = dataUrlToBlob(originalUrl);
      } else {
        try {
          const res = await fetch(originalUrl);
          uploadBlob = await res.blob();
        } catch {
          addToast('Could not extract image data for upload.', 'warn');
          return;
        }
      }
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Track request ID to ignore stale responses
    const currentRequestId = ++requestIdRef.current;

    // Clear previous results and errors
    setInspectionResult(null);
    setScanError(null);
    setDecisionRecord(null);

    // Cancel and restart offscreen CV diagnostic pipeline
    pipelineSignalRef.current.cancelled = true;
    pipelineSignalRef.current = { cancelled: false };
    const cvSignal = pipelineSignalRef.current;

    runFullPipeline(originalUrl, (stage, url) => {
      if (cvSignal.cancelled) return;
      setViewUrls(prev => ({ ...prev, [stage]: url }));
      completeProcess(stage);
    }, cvSignal).catch(() => {
      // Diagnostic pipeline non-fatal
    });

    addLog(`AI detection request initiated for Train ${record.trainNumber.trim()}.`);

    try {
      const result = await sendInspectionRequest({
        imageBlob: uploadBlob,
        filename: imageMeta.fileName || 'inspection-frame.jpg',
        metadata: {
          trainNumber: record.trainNumber.trim(),
          coachBogie: record.coachBogie.trim(),
          inspectionLocation: record.inspectionLocation.trim(),
          officerId: record.officerId.trim(),
        },
        signal: controller.signal,
        onStateChange: (state) => {
          if (requestIdRef.current === currentRequestId) {
            setScanStatus(state);
          }
        },
      });

      // Discard stale responses
      if (requestIdRef.current !== currentRequestId) return;

      const newScanNumber = ++_scanCounter;
      setScanNumber(newScanNumber);
      setInspectionResult(result);
      setScanStatus('complete');
      completeProcess('scan');

      // If backend returned annotated image, register it in viewUrls
      if (result.annotatedImage) {
        setViewUrls(prev => ({ ...prev, annotated: result.annotatedImage }));
      }

      const defectFound = result.verdict === 'DEFECT DETECTED' || result.regionsCount > 0;
      addLog(
        `AI inspection complete: ${result.verdict} (${result.regionsCount} anomalous region(s) detected).`,
        defectFound ? 'red' : 'green'
      );
      addToast(
        defectFound
          ? `Verdict: ${result.verdict}. ${result.regionsCount} anomaly candidate(s) detected.`
          : 'Verdict: NO DEFECT DETECTED. Bogie appearance matches normal reference.',
        defectFound ? 'warn' : 'success'
      );
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      if (err.code === 'CANCELLED') {
        setScanStatus('cancelled');
        addLog('AI detection request cancelled.', 'blue');
        addToast('Detection cancelled.', 'info');
      } else {
        setScanStatus('failed');
        setScanError({
          message: err.message,
          status: err.status,
          code: err.code,
        });
        addLog(`AI backend error: ${err.message}`, 'red');
        addToast(`AI Detection failed: ${err.message}`, 'warn');
      }
    }
  }, [
    scanStatus,
    originalUrl,
    originalBlob,
    record,
    recordSaved,
    checklist.operatorAreaClear,
    imageMeta.fileName,
    completeProcess,
    addLog,
    addToast,
  ]);

  // ─── decision ─────────────────────────────────────────────────────────────
  const recordDecision = useCallback((type) => {
    if (decisionRecord) return; // locked after first decision
    const dr = { type, recordedAt: isoNow() };
    setDecisionRecord(dr);
    const release = type === 'release';
    setModalContent({
      type,
      title: release ? 'Vehicle release recorded' : 'Maintenance request recorded',
      body: release
        ? 'The vehicle has been marked released by the operator. Retain the exported evidence record for inspection history.'
        : 'The vehicle has been marked for maintenance. The detected anomaly regions have been retained in the session report.',
    });
    setShowModal(true);
    addLog(
      release ? 'Vehicle release was recorded by operator.' : 'Vehicle was marked for maintenance by operator.',
      release ? 'green' : 'red'
    );
  }, [decisionRecord, addLog]);

  const closeModal = useCallback(() => setShowModal(false), []);

  // ─── export report ────────────────────────────────────────────────────────
  const exportReport = useCallback(() => {
    const decisionLabel = decisionRecord
      ? (decisionRecord.type === 'release' ? 'Released' : 'Maintenance required')
      : 'Operator review pending';

    const aiStatus = scanStatus === 'complete'
      ? 'success'
      : (scanStatus === 'failed' ? 'failed' : 'not_inspected');

    const report = {
      application: 'BogieVision',
      generatedAt: isoNow(),
      inspectionRecord: record,
      imageInformation: imageMeta,
      source: sourceKind,
      processingChecks: process,
      aiInspection: {
        status: aiStatus,
        modelArchitecture: 'Vision Transformer (ViT) + DINO Memory Bank',
        verdict: inspectionResult?.verdict ?? (aiStatus === 'not_inspected' ? 'NOT INSPECTED' : 'FAILED'),
        regionsCount: inspectionResult?.regionsCount ?? 0,
        defectPercentage: inspectionResult?.defectPercentage ?? null,
        peakAnomalyScore: inspectionResult?.peakScore ?? null,
        regions: inspectionResult?.regions ?? [],
        error: scanError ? { message: scanError.message, status: scanError.status, code: scanError.code } : null,
      },
      decision: decisionLabel,
      decisionRecord: decisionRecord ?? null,
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
  }, [
    record,
    imageMeta,
    sourceKind,
    process,
    scanStatus,
    inspectionResult,
    scanError,
    decisionRecord,
    completeProcess,
    addLog,
    addToast,
  ]);

  // ─── clear workspace ──────────────────────────────────────────────────────
  const clearWorkspace = useCallback(() => {
    // Abort active inference request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    pipelineSignalRef.current.cancelled = true;

    stopCamera();

    revokeBlobs(viewUrls);
    if (originalUrl.startsWith('blob:')) URL.revokeObjectURL(originalUrl);

    setOriginalUrl('');
    setOriginalBlob(null);
    setViewUrls({});
    setCurrentView('original');
    setImageDisplayUrl('');
    setSourceKind(null);
    setImageMeta(emptyMeta());
    setInspectionResult(null);
    setScanError(null);
    setScanStatus('idle');
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
    viewUrls, switchView, showImage,
    // camera
    videoRef, cameraActive, openCamera, stopCamera, endCameraFeed, captureFrame,
    // process
    process,
    // real AI inspection
    scanStatus, scanError, inspectionResult, scanNumber, startScan,
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
