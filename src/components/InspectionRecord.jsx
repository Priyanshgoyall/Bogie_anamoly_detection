import React from 'react';
import styles from './InspectionRecord.module.css';

export const InspectionRecord = ({ record, recordSaved, onChange, onSave }) => {
  const missingFields = [];
  if (!record.trainNumber.trim()) missingFields.push('train number');
  if (!record.inspectionLocation.trim()) missingFields.push('inspection location');
  const incomplete = missingFields.length > 0;

  const noticeText = recordSaved
    ? `Record saved · ${record.trainNumber}${record.coachBogie ? ` · ${record.coachBogie}` : ''}`
    : incomplete
      ? `Add ${missingFields.join(' and ')} before the scan can be started.`
      : 'Record has changed — save it again before detection.';

  return (
    <section className={`glass-card ${styles.card}`} aria-labelledby="recordTitle">
      <div className={styles.heading}>
        <div>
          <p className="step-label">Inspection record</p>
          <h2 id="recordTitle">Vehicle and location details</h2>
        </div>
        <span
          className={`${styles.state} ${recordSaved ? styles.stateReady : ''}`}
          aria-live="polite"
        >
          {recordSaved ? 'Record ready' : 'Record incomplete'}
        </span>
      </div>
      <div className={styles.fields}>
        <label className={styles.field} htmlFor="trainNumber">
          <span>Train number <b aria-label="required">*</b></span>
          <input
            id="trainNumber"
            value={record.trainNumber}
            onChange={e => onChange('trainNumber', e.target.value)}
            placeholder="e.g. WAP-7 30723"
            autoComplete="off"
            aria-required="true"
          />
        </label>
        <label className={styles.field} htmlFor="coachBogie">
          <span>Coach / bogie</span>
          <input
            id="coachBogie"
            value={record.coachBogie}
            onChange={e => onChange('coachBogie', e.target.value)}
            placeholder="e.g. B2 · Bogie 01"
            autoComplete="off"
          />
        </label>
        <label className={styles.field} htmlFor="inspectionLocation">
          <span>Inspection location <b aria-label="required">*</b></span>
          <input
            id="inspectionLocation"
            value={record.inspectionLocation}
            onChange={e => onChange('inspectionLocation', e.target.value)}
            placeholder="e.g. Pit line 3, New Delhi"
            autoComplete="off"
            aria-required="true"
          />
        </label>
        <label className={styles.field} htmlFor="officerId">
          <span>Officer ID</span>
          <input
            id="officerId"
            value={record.officerId}
            onChange={e => onChange('officerId', e.target.value)}
            placeholder="Badge or staff ID"
            autoComplete="off"
          />
        </label>
        <button className={`btn-secondary ${styles.saveBtn}`} id="saveRecordButton" onClick={onSave}>
          Save record
        </button>
      </div>
      <p className={`${styles.notice} ${recordSaved ? styles.noticeReady : ''}`} aria-live="polite">
        {noticeText}
      </p>
    </section>
  );
};
