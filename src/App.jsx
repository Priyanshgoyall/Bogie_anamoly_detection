import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { InspectionRecord } from './components/InspectionRecord';
import { SourceControls } from './components/SourceControls';
import { ImageViewer } from './components/ImageViewer';
import { ImageMetadata } from './components/ImageMetadata';
import { DetectionMonitor } from './components/DetectionMonitor';
import { ProcessingChecklist } from './components/ProcessingChecklist';
import { PreScanChecklist } from './components/PreScanChecklist';
import { ActivityLog } from './components/ActivityLog';
import { FindingsPanel } from './components/FindingsPanel';
import { Modal } from './components/Modal';
import { ToastRegion } from './components/Toast';
import { useAppState } from './hooks/useAppState';
import { timestamp } from './utils/timestamp';
import styles from './App.module.css';

export const App = () => {
  const [theme, setTheme] = useState(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const state = useAppState();
  const {
    record, updateRecord, saveRecord, recordSaved,
    originalUrl, currentView, imageDisplayUrl, imageMeta,
    switchView,
    videoRef, cameraActive, openCamera, captureFrame,
    process,
    scanStatus, progress, findings, scanNumber, startScan,
    checklist, setChecklist,
    activity,
    toasts, removeToast,
    decisionRecord, recordDecision,
    showModal, modalContent, closeModal,
    exportReport,
    clearWorkspace,
    scanGates,
    loadDemo,
  } = state;

  const hasImage = Boolean(originalUrl);
  const scanning = scanStatus === 'scanning';

  // Handle file upload
  const handleUpload = useCallback((file) => {
    const blobUrl = URL.createObjectURL(file);
    state.showImage(blobUrl, 'upload', 'Uploaded image', {
      status: 'Uploaded',
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileName: file.name,
      acquired: timestamp(),
    });
  }, [state]);

  const modalSymbol = modalContent?.type === 'release' ? '✓' : '⚑';
  const modalBg = modalContent?.type === 'release' ? '#0bb882' : '#e59600';

  return (
    <div className={styles.shell}>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="main-content" id="mainContent">
        <InspectionRecord
          record={record}
          recordSaved={recordSaved}
          onChange={updateRecord}
          onSave={saveRecord}
        />

        {/* Console grid: controls | viewer | monitor */}
        <div className={styles.consoleGrid}>
          <SourceControls
            cameraActive={cameraActive}
            hasImage={hasImage}
            scanning={scanning}
            scanGates={scanGates}
            onUpload={handleUpload}
            onCamera={openCamera}
            onCapture={captureFrame}
            onEndFeed={clearWorkspace}
            onDemo={loadDemo}
            onStart={startScan}
            onClear={clearWorkspace}
          />

          <div className={styles.viewerColumn}>
            <ImageViewer
              imageUrl={imageDisplayUrl}
              cameraActive={cameraActive}
              hasImage={hasImage}
              currentView={currentView}
              findings={findings}
              scanning={scanning}
              videoRef={videoRef}
              onSwitchView={switchView}
            />
            <ImageMetadata meta={imageMeta} />
          </div>

          <DetectionMonitor
            scanStatus={scanStatus}
            progress={progress}
            scanNumber={scanNumber}
            findingsCount={findings.length}
          />
        </div>

        <ProcessingChecklist processState={process} hasImage={hasImage || cameraActive} />

        {findings.length > 0 && (
          <FindingsPanel
            findings={findings}
            decisionRecord={decisionRecord}
            onRelease={() => recordDecision('release')}
            onMaintenance={() => recordDecision('maintenance')}
            onExport={exportReport}
          />
        )}

        <div className={styles.bottomGrid}>
          <PreScanChecklist
            checklist={checklist}
            onChange={(key, val) => setChecklist(prev => ({ ...prev, [key]: val }))}
          />
          <ActivityLog activity={activity} />
        </div>
      </main>

      <ToastRegion toasts={toasts} onRemove={removeToast} />

      <Modal
        open={showModal}
        title={modalContent?.title ?? ''}
        body={modalContent?.body ?? ''}
        symbol={modalSymbol}
        symbolBg={modalBg}
        onClose={closeModal}
      />
    </div>
  );
};
