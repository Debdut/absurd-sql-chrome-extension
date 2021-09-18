import { initBackend } from 'absurd-sql/dist/indexeddb-main-thread';

function initWorker (): Worker {
  const workerPath = chrome.runtime.getURL('worker.js');
  const worker = new Worker(workerPath);

  initBackend(worker);

  return worker;
}

const worker = initWorker();

console.log('[Background Script] Loaded');