/**
 * API Service Layer for BogieVision
 * Handles communication with the FastAPI AI backend (DINO + ViT Anomaly Detection).
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 60000;

export class ApiError extends Error {
  constructor(message, status = null, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates and normalizes raw backend inspection payload into frontend domain structure.
 */
export function normalizeInspectionResult(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError('Invalid response received from inspection backend: expected JSON object.', 502, 'INVALID_PAYLOAD');
  }

  // Handle explicit error status from backend
  if (data.status === 'error' || data.error) {
    throw new ApiError(data.message || data.error || 'Backend reported an inspection failure.', 500, 'BACKEND_ERROR', data);
  }

  const rawRegions = Array.isArray(data.regions) ? data.regions : [];
  const regionsCount = typeof data.regions_count === 'number' ? data.regions_count : rawRegions.length;

  const verdict = data.verdict || (regionsCount > 0 ? 'DEFECT DETECTED' : 'NO DEFECT DETECTED');

  const normalizedRegions = rawRegions.map((r, idx) => ({
    id: r.id ? String(r.id) : `region-${idx + 1}`,
    x: Number(r.x) || 0,
    y: Number(r.y) || 0,
    width: Number(r.width) || 0,
    height: Number(r.height) || 0,
    anomalyScore: typeof r.anomaly_score === 'number' ? r.anomaly_score : (typeof r.score === 'number' ? r.score : null),
    description: r.description || `Visual deviation #${idx + 1} requiring operator review`,
  }));

  // Handle annotated image data (base64 or data URL)
  let annotatedImage = null;
  if (typeof data.annotated_image === 'string' && data.annotated_image.trim()) {
    const raw = data.annotated_image.trim();
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
      annotatedImage = raw;
    } else {
      annotatedImage = `data:image/jpeg;base64,${raw}`;
    }
  }

  return {
    status: 'success',
    verdict,
    defectPercentage: typeof data.defect_percentage === 'number' ? data.defect_percentage : null,
    regionsCount,
    peakScore: typeof data.peak_score === 'number' ? data.peak_score : null,
    regions: normalizedRegions,
    annotatedImage,
    receivedAt: new Date().toISOString(),
    rawResponse: data,
  };
}

/**
 * Sends a still inspection frame and record metadata to POST /api/inspect.
 *
 * @param {Object} params
 * @param {Blob|File} params.imageBlob - The still image Blob/File
 * @param {string} [params.filename] - Image filename
 * @param {Object} params.metadata - { trainNumber, coachBogie, inspectionLocation, officerId }
 * @param {AbortSignal} [params.signal] - Caller's abort signal for cancellation
 * @param {Function} [params.onStateChange] - Callback for request stage updates
 * @returns {Promise<Object>} Normalized inspection result
 */
export async function sendInspectionRequest({
  imageBlob,
  filename = 'inspection-frame.jpg',
  metadata = {},
  signal,
  onStateChange = () => {},
}) {
  if (!imageBlob) {
    throw new ApiError('No image supplied for AI inspection.', 400, 'NO_IMAGE');
  }

  const endpoint = `${API_BASE_URL}/api/inspect`;

  // Build FormData matching expected FastAPI signature
  onStateChange('preparing');
  const formData = new FormData();
  formData.append('image', imageBlob, filename);
  formData.append('train_number', metadata.trainNumber || '');
  formData.append('coach_bogie', metadata.coachBogie || '');
  formData.append('inspection_location', metadata.inspectionLocation || '');
  formData.append('officer_id', metadata.officerId || '');

  // Setup abort controller with timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, DEFAULT_TIMEOUT_MS);

  // Link caller signal if provided
  const combinedAbortHandler = () => {
    timeoutController.abort();
  };
  if (signal) {
    signal.addEventListener('abort', combinedAbortHandler);
  }

  try {
    onStateChange('uploading');
    // Once fetch initiates, upload progresses to waiting for inference
    const fetchPromise = fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: timeoutController.signal,
    });

    onStateChange('inferring');
    const response = await fetchPromise;

    onStateChange('receiving');

    if (!response.ok) {
      let errorDetail = `Backend HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && (errorJson.detail || errorJson.message || errorJson.error)) {
          errorDetail = errorJson.detail || errorJson.message || errorJson.error;
        }
      } catch {
        // use status text fallback
      }
      throw new ApiError(errorDetail, response.status, 'HTTP_ERROR');
    }

    let json;
    try {
      json = await response.json();
    } catch {
      throw new ApiError('Failed to parse backend response as JSON.', 502, 'JSON_PARSE_ERROR');
    }

    const normalized = normalizeInspectionResult(json);
    onStateChange('completed');
    return normalized;
  } catch (err) {
    if (signal?.aborted) {
      onStateChange('cancelled');
      throw new ApiError('Inspection request was cancelled by operator.', null, 'CANCELLED');
    }

    if (timeoutController.signal.aborted) {
      onStateChange('failed');
      throw new ApiError(
        `AI inference timed out after ${DEFAULT_TIMEOUT_MS / 1000}s. The backend took too long to respond.`,
        408,
        'TIMEOUT'
      );
    }

    onStateChange('failed');

    if (err instanceof ApiError) {
      throw err;
    }

    // Network error (e.g. server down, CORS refusal, connection refused)
    if (err instanceof TypeError || err.name === 'TypeError') {
      throw new ApiError(
        `Could not reach AI inspection backend at ${API_BASE_URL}. Ensure the FastAPI service is running.`,
        0,
        'NETWORK_ERROR',
        err
      );
    }

    throw new ApiError(err.message || 'Unknown error during inspection request.', 500, 'UNKNOWN_ERROR', err);
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', combinedAbortHandler);
    }
  }
}

/**
 * Checks backend reachability.
 */
export async function checkBackendHealth({ signal } = {}) {
  const endpoint = `${API_BASE_URL}/api/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onAbort);

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    return { available: res.ok, status: res.status, url: API_BASE_URL };
  } catch (err) {
    return { available: false, error: err.message, url: API_BASE_URL };
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}
