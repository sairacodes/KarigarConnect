const IDB_NAME = 'karigar_connect_files';
const IDB_VERSION = 1;
const STORE_NAME = 'evidence_files';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface StoredEvidenceFile {
  fileKey: string;
  blob: Blob;
  mimeType: string;
  originalName: string;
  size: number;
  createdAt: string;
}

const objectUrlCache = new Map<string, string>();

function openFilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileKey' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB evidence store.'));
  });
}

export function validateEvidenceFiles(files: File[]): string | null {
  if (files.length === 0) {
    return 'Attach an image or short video file as practical evidence.';
  }
  const videos = files.filter((f) => ALLOWED_VIDEO_MIME.includes(f.type));
  if (videos.length > 1) {
    return 'Only one optional short video is allowed per evidence submission.';
  }
  for (const file of files) {
    const isImage = ALLOWED_IMAGE_MIME.includes(file.type);
    const isVideo = ALLOWED_VIDEO_MIME.includes(file.type);
    if (!isImage && !isVideo) {
      return `Unsupported file type "${file.name}". Use JPG, PNG, WebP, MP4, WebM, or MOV.`;
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return `Image "${file.name}" exceeds the 5 MB limit.`;
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      return `Video "${file.name}" exceeds the 25 MB limit.`;
    }
  }
  return null;
}

export async function saveEvidenceFile(fileKey: string, file: Blob, meta: { mimeType: string; originalName: string }): Promise<void> {
  const db = await openFilesDb();
  const record: StoredEvidenceFile = {
    fileKey,
    blob: file,
    mimeType: meta.mimeType,
    originalName: meta.originalName,
    size: file.size,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to save evidence file to IndexedDB.'));
  });
}

export async function getEvidenceFile(fileKey: string): Promise<StoredEvidenceFile | null> {
  const db = await openFilesDb();
  return new Promise<StoredEvidenceFile | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(fileKey);
    req.onsuccess = () => resolve((req.result as StoredEvidenceFile | undefined) || null);
    req.onerror = () => reject(req.error || new Error('Failed to read evidence file from IndexedDB.'));
  });
}

export async function getEvidencePreviewUrl(fileKey: string, seedAssetPath?: string): Promise<string> {
  const cached = objectUrlCache.get(fileKey);
  if (cached) return cached;

  const normalizedSeedPath = seedAssetPath?.startsWith('/src/assets/images/')
    ? seedAssetPath.replace('/src/assets/images/', '/images/')
    : seedAssetPath;

  let record = await getEvidenceFile(fileKey);

  // Hydrate seeded sample asset into IndexedDB on first preview if not already stored
  if (!record && normalizedSeedPath) {
    try {
      const response = await fetch(normalizedSeedPath);
      if (response.ok) {
        const blob = await response.blob();
        await saveEvidenceFile(fileKey, blob, {
          mimeType: blob.type || 'image/jpeg',
          originalName: normalizedSeedPath.split('/').pop() || 'sample.jpg',
        });
        record = await getEvidenceFile(fileKey);
      }
    } catch {
      return normalizedSeedPath;
    }
  }

  if (!record) {
    return normalizedSeedPath || '';
  }

  const url = URL.createObjectURL(record.blob);
  objectUrlCache.set(fileKey, url);
  return url;
}

export async function deleteEvidenceFile(fileKey: string): Promise<void> {
  const cached = objectUrlCache.get(fileKey);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(fileKey);
  }
  const db = await openFilesDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(fileKey);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to delete evidence file from IndexedDB.'));
  });
}
