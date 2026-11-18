const KEYS = {
  USERS: "crawdhub_users_v7",
  CURRENT_USER: "crawdhub_current_user_v7",
  ORDERS: "crawdhub_orders_v7",
  HISTORY: "crawdhub_history_v7",
  GROUPS: "crawdhub_groups_v7",
  LANG: "crawdhub_lang_v8",
  CHATS: "crawdhub_chats_v13",
  PENDING_VERIFICATION: "crawdhub_pending_verification_v21"
};

// VK contact is a full, secure profile or community URL; legacy @handles are not valid VK links.
function isVkProfileLink(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" && ["vk.com", "www.vk.com"].includes(url.hostname.toLowerCase())
      && url.pathname.split("/").some(segment => segment.length > 0);
  } catch {
    return false;
  }
}

const seedUsers = [
  { id: "u-company", name: "Level Studio", email: "employer@demo.test", password: "1234", contact: "@levelstudio", role: "company", wallet: 50000, favorites: [], emailVerified: true },
  { id: "u-student", name: "Алексей", email: "student@demo.test", password: "1234", contact: "@alex_dev", role: "performer", wallet: 3500, favorites: [1, 3], emailVerified: true }
];

const seedOrders = [
  { id: 1, ownerId: "company-one", company: "Nova Market", contact: "@nova_hr", title: "UX-аудит карточки интернет-магазина", category: "Аналитика", description: "Нужно проанализировать карточку товара интернет-магазина, найти UX-проблемы и предложить улучшения. Результат можно предоставить в Figma или PDF.", skills: ["UX", "Figma", "Research"], price: 7000, status: "open", favorites: 17, createdAt: Date.now() - 1000 * 60 * 60 * 5, submissions: [], reviews: [] },
  { id: 2, ownerId: "company-two", company: "Green Hub", contact: "@greenhub", title: "Telegram-бот для обработки заявок", category: "Разработка", description: "Необходимо создать Telegram-бота, который принимает заявки пользователей, сохраняет их и отправляет уведомление менеджеру.", skills: ["Python", "API", "Telegram"], price: 15000, status: "in_review", favorites: 26, createdAt: Date.now() - 1000 * 60 * 60 * 13, submissions: [{ id: 2001, userId: "other-user", author: "Илья", contact: "@ilya_python", link: "https://github.com/example/tg-bot", comment: "Готовый бот на Python с SQLite.", winner: false }], reviews: [] },
  { id: 3, ownerId: "company-three", company: "Flow Academy", contact: "@flow_academy", title: "Лендинг для онлайн-курса", category: "Дизайн", description: "Нужен адаптивный концепт лендинга курса: первый экран, преимущества, программа, преподаватель и CTA.", skills: ["Figma", "UI", "Web Design"], price: 9000, status: "open", favorites: 31, createdAt: Date.now() - 1000 * 60 * 60 * 2, submissions: [], reviews: [] },
  { id: 4, ownerId: "company-four", company: "Start Media", contact: "@startmedia", title: "Рекламные креативы для нового продукта", category: "Маркетинг", description: "Нужно подготовить несколько рекламных концепций и баннеров для тестирования новой рекламной кампании.", skills: ["Marketing", "Ads", "Design"], price: 5500, status: "open", favorites: 11, createdAt: Date.now() - 1000 * 60 * 60 * 20, submissions: [], reviews: [] },
  { id: 5, ownerId: "company-five", company: "Core Metrics", contact: "team@coremetrics.test", title: "Прототип аналитического дашборда", category: "Дизайн", description: "Разработать UX/UI прототип SaaS-дашборда с KPI, графиками и фильтрами.", skills: ["Dashboard", "Figma", "Analytics"], price: 18000, status: "paid", favorites: 38, createdAt: Date.now() - 1000 * 60 * 60 * 48, submissions: [{ id: 5001, userId: "other-designer", author: "Мария", contact: "@maria_design", link: "https://figma.com/example", comment: "Интерактивный прототип панели.", winner: true }], reviews: [] },
  { id: 6, ownerId: "company-six", company: "Bright School", contact: "@bright_school", title: "Тексты для образовательного сайта", category: "Контент", description: "Нужно подготовить тексты для главной страницы образовательного проекта.", skills: ["Copywriting", "Content"], price: 4000, status: "open", favorites: 8, createdAt: Date.now() - 1000 * 60 * 60 * 8, submissions: [], reviews: [] }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return clone(fallback);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return clone(fallback);
  }
}

let users = load(KEYS.USERS, seedUsers);
let orders = load(KEYS.ORDERS, seedOrders);
let history = load(KEYS.HISTORY, []);
// Keep historical wallet activity consistent with the new CT unit.
let currencyHistoryUpdated = false;
history = history.map(item => {
  if (!item || typeof item.text !== "string" || !item.text.includes("CrowdTokens")) return item;
  currencyHistoryUpdated = true;
  return { ...item, text: item.text.replaceAll("CrowdTokens", "CT") };
});
if (currencyHistoryUpdated) localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
let groups = load(KEYS.GROUPS, []);
let chats = load(KEYS.CHATS, {});
let currentLang = localStorage.getItem(KEYS.LANG) === "en" ? "en" : "ru";

const saveUsers = () => localStorage.setItem(KEYS.USERS, JSON.stringify(users));
const saveOrders = () => localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
const saveHistory = () => localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
const saveGroups = () => localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
const saveChats = () => localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));

// Accounts created before the email-verification prototype existed stay usable.
// Only newly registered accounts are explicitly marked as unverified.
let emailVerificationMigrationChanged = false;
users = users.map(user => {
  if (typeof user.emailVerified === "boolean") return user;
  emailVerificationMigrationChanged = true;
  return { ...user, emailVerified: true };
});
if (emailVerificationMigrationChanged) saveUsers();

function setPendingVerification(userId) {
  if (!userId) return localStorage.removeItem(KEYS.PENDING_VERIFICATION);
  localStorage.setItem(KEYS.PENDING_VERIFICATION, String(userId));
}

function getPendingVerificationUser() {
  const id = localStorage.getItem(KEYS.PENDING_VERIFICATION);
  return id ? users.find(user => user.id === id) || null : null;
}

function clearPendingVerification() {
  localStorage.removeItem(KEYS.PENDING_VERIFICATION);
}


// Binary attachments are kept outside localStorage.
// v19 uses OPFS (Origin Private File System) when available because it is much
// better suited to real files than dozens of IndexedDB transactions. IndexedDB
// stays as a compatibility fallback and for files created in v16-v18.
const FILE_DB_NAME = "crawdhub_files_v1";
const FILE_DB_VERSION = 2;
const FILE_STORE_NAME = "submission_files";
const FILE_CHUNK_STORE_NAME = "submission_file_chunks";
const FILE_CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB fallback chunks
const FILE_STORAGE_RESERVE = 2 * 1024 * 1024;
const OPFS_DIRECTORY_NAME = "crawdhub-files";
const OPFS_WORK_DIRECTORY_NAME = "work";

function makeAttachmentError(code, message, cause = null) {
  const error = new Error(message);
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function isQuotaError(error) {
  return error?.name === "QuotaExceededError" ||
    error?.code === 22 ||
    /quota/i.test(String(error?.message || ""));
}

function openFileDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(makeAttachmentError("unsupported", "IndexedDB is not supported"));
      return;
    }

    const request = indexedDB.open(FILE_DB_NAME, FILE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
        db.createObjectStore(FILE_STORE_NAME, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(FILE_CHUNK_STORE_NAME)) {
        const chunkStore = db.createObjectStore(FILE_CHUNK_STORE_NAME, { keyPath: "id" });
        chunkStore.createIndex("fileKey", "fileKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open file storage"));
    request.onblocked = () => reject(makeAttachmentError("blocked", "File storage upgrade is blocked by another open tab"));
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function idbTransactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction was aborted"));
  });
}

function safeStorageName(value) {
  return String(value || "file").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 180);
}

function supportsOPFS() {
  return Boolean(navigator.storage && typeof navigator.storage.getDirectory === "function");
}

async function getOPFSDirectory(directoryName = OPFS_DIRECTORY_NAME, create = true) {
  if (!supportsOPFS()) throw makeAttachmentError("unsupported", "OPFS is not supported");
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(directoryName, { create });
}

async function ensureAttachmentCapacity(file) {
  if (!file || !navigator.storage?.estimate) return;
  try {
    const { quota, usage } = await navigator.storage.estimate();
    if (!Number.isFinite(quota) || !Number.isFinite(usage)) return;
    const free = Math.max(0, quota - usage);
    if (file.size + FILE_STORAGE_RESERVE > free) {
      throw makeAttachmentError("quota", "Not enough browser storage for this file");
    }
  } catch (error) {
    if (error?.code === "quota") throw error;
    // Estimates are advisory only; continue when the browser cannot provide one.
  }
}

async function storeFileInOPFS(file, logicalKey, { directoryName = OPFS_DIRECTORY_NAME, keyPrefix = "opfs" } = {}) {
  const directory = await getOPFSDirectory(directoryName, true);
  const storageName = safeStorageName(logicalKey);
  const handle = await directory.getFileHandle(storageName, { create: true });
  let writable;
  try {
    writable = await handle.createWritable({ keepExistingData: false });
    await writable.write(file);
    await writable.close();
    writable = null;
    return `${keyPrefix}:${storageName}`;
  } catch (error) {
    try { await writable?.abort?.(); } catch {}
    try { await directory.removeEntry(storageName); } catch {}
    if (isQuotaError(error)) throw makeAttachmentError("quota", "Browser storage quota exceeded", error);
    throw error;
  }
}

async function storeFileInIDB(file, logicalKey) {
  const fileKey = `idb:${safeStorageName(logicalKey)}`;
  const chunkCount = Math.max(1, Math.ceil(file.size / FILE_CHUNK_SIZE));
  const chunks = [];

  // Read first, then open one short transaction. This avoids the v17/v18 pattern
  // of one transaction per 512 KB chunk, which could take >30 seconds locally.
  for (let index = 0; index < chunkCount; index += 1) {
    const start = index * FILE_CHUNK_SIZE;
    const end = Math.min(file.size, start + FILE_CHUNK_SIZE);
    chunks.push(await file.slice(start, end).arrayBuffer());
  }

  const db = await openFileDB();
  try {
    await deleteSubmissionFileFromDB(db, fileKey);
    const tx = db.transaction([FILE_STORE_NAME, FILE_CHUNK_STORE_NAME], "readwrite");
    const done = idbTransactionDone(tx);
    tx.objectStore(FILE_STORE_NAME).put({
      key: fileKey,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      chunkCount,
      chunkSize: FILE_CHUNK_SIZE,
      format: "chunked-v19",
      savedAt: Date.now()
    });
    const chunkStore = tx.objectStore(FILE_CHUNK_STORE_NAME);
    chunks.forEach((data, index) => chunkStore.put({
      id: `${fileKey}:${index}`,
      fileKey,
      index,
      data
    }));
    await done;
    return fileKey;
  } catch (error) {
    if (isQuotaError(error)) throw makeAttachmentError("quota", "Browser storage quota exceeded", error);
    throw error;
  } finally {
    db.close();
  }
}

async function storeBrowserFile(file, logicalKey, { workFolder = false } = {}) {
  if (!file) return "";
  await ensureAttachmentCapacity(file);

  if (supportsOPFS()) {
    try {
      return await storeFileInOPFS(file, logicalKey, workFolder
        ? { directoryName: OPFS_WORK_DIRECTORY_NAME, keyPrefix: "opfs-work" }
        : { directoryName: OPFS_DIRECTORY_NAME, keyPrefix: "opfs" });
    } catch (error) {
      if (error?.code === "quota" || isQuotaError(error)) throw error;
      console.warn("OPFS save failed, using IndexedDB fallback", error);
    }
  }

  // Older / unsupported browsers keep the same logical work-* name in IDB.
  return storeFileInIDB(file, workFolder ? `work-${logicalKey}` : logicalKey);
}

function isZipFile(file) {
  return Boolean(file && (String(file.name || "").toLowerCase().endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed"));
}

async function storeSubmissionFile(file, orderId, submissionId) {
  const originalName = safeStorageName(file?.name || "solution.zip");
  return storeBrowserFile(file, `submission-${orderId}-${submissionId}-${Date.now()}-${originalName}`, { workFolder: true });
}

async function storeChatFile(file, orderId, participantId, messageId) {
  const originalName = safeStorageName(file?.name || "attachment.bin");
  return storeBrowserFile(file, `chat-${orderId}-${participantId}-${messageId}-${Date.now()}-${originalName}`, { workFolder: isZipFile(file) });
}

async function deleteSubmissionFileFromDB(db, fileKey) {
  if (!fileKey) return;

  {
    const tx = db.transaction(FILE_STORE_NAME, "readwrite");
    const done = idbTransactionDone(tx);
    tx.objectStore(FILE_STORE_NAME).delete(fileKey);
    await done;
  }

  if (db.objectStoreNames.contains(FILE_CHUNK_STORE_NAME)) {
    const tx = db.transaction(FILE_CHUNK_STORE_NAME, "readwrite");
    const done = idbTransactionDone(tx);
    const store = tx.objectStore(FILE_CHUNK_STORE_NAME);
    const index = store.index("fileKey");
    const cursorRequest = index.openCursor(IDBKeyRange.only(fileKey));
    await new Promise((resolve, reject) => {
      cursorRequest.onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) return resolve();
        cursor.delete();
        cursor.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error || new Error("Could not clean attachment chunks"));
    });
    await done;
  }
}

async function deleteStoredFile(fileKey) {
  if (!fileKey) return;
  if (fileKey.startsWith("opfs-work:")) {
    try {
      const directory = await getOPFSDirectory(OPFS_WORK_DIRECTORY_NAME, false);
      await directory.removeEntry(fileKey.slice("opfs-work:".length));
    } catch (error) {
      if (error?.name !== "NotFoundError") throw error;
    }
    return;
  }
  if (fileKey.startsWith("opfs:")) {
    try {
      const directory = await getOPFSDirectory(OPFS_DIRECTORY_NAME, false);
      await directory.removeEntry(fileKey.slice(5));
    } catch (error) {
      if (error?.name !== "NotFoundError") throw error;
    }
    return;
  }

  const db = await openFileDB();
  try { await deleteSubmissionFileFromDB(db, fileKey); }
  finally { db.close(); }
}

function referencedSubmissionFileKeys() {
  const keys = new Set();
  for (const order of orders || []) {
    for (const submission of order.submissions || []) {
      if (submission.fileKey) keys.add(submission.fileKey);
    }
  }
  for (const thread of Object.values(chats || {})) {
    for (const message of Array.isArray(thread) ? thread : []) {
      if (message?.fileKey) keys.add(message.fileKey);
    }
  }
  return keys;
}

async function cleanupOrphanedSubmissionFiles() {
  // Best-effort cleanup for IndexedDB data from v16-v18. OPFS files are not
  // scanned automatically so that active chat attachments are never removed.
  let db;
  try {
    db = await openFileDB();
    const referenced = referencedSubmissionFileKeys();
    const tx = db.transaction(FILE_STORE_NAME, "readonly");
    const done = idbTransactionDone(tx);
    const records = await idbRequest(tx.objectStore(FILE_STORE_NAME).getAll());
    await done;
    for (const record of records || []) {
      if (record?.key && !referenced.has(record.key)) {
        await deleteSubmissionFileFromDB(db, record.key);
      }
    }
  } catch (error) {
    console.warn("Attachment cleanup skipped", error);
  } finally {
    db?.close();
  }
}

async function getFileFromIDB(fileKey) {
  const db = await openFileDB();
  try {
    const tx = db.transaction(FILE_STORE_NAME, "readonly");
    const done = idbTransactionDone(tx);
    const record = await idbRequest(tx.objectStore(FILE_STORE_NAME).get(fileKey));
    await done;
    if (!record) return null;
    if (record.blob) return record; // v16 compatibility
    if (!record.chunkCount || !db.objectStoreNames.contains(FILE_CHUNK_STORE_NAME)) return null;

    const chunks = [];
    for (let index = 0; index < record.chunkCount; index += 1) {
      const chunkTx = db.transaction(FILE_CHUNK_STORE_NAME, "readonly");
      const chunkDone = idbTransactionDone(chunkTx);
      const chunk = await idbRequest(chunkTx.objectStore(FILE_CHUNK_STORE_NAME).get(`${fileKey}:${index}`));
      await chunkDone;
      const binary = chunk?.data || chunk?.blob;
      if (!binary) return null;
      chunks.push(binary);
    }
    return { ...record, blob: new Blob(chunks, { type: record.type || "application/octet-stream" }) };
  } finally {
    db.close();
  }
}

async function getSubmissionFile(fileKey) {
  if (!fileKey) return null;

  if (fileKey.startsWith("opfs-work:")) {
    try {
      const directory = await getOPFSDirectory(OPFS_WORK_DIRECTORY_NAME, false);
      const handle = await directory.getFileHandle(fileKey.slice("opfs-work:".length));
      const file = await handle.getFile();
      return { key: fileKey, blob: file, name: file.name, type: file.type, size: file.size };
    } catch (error) {
      if (error?.name === "NotFoundError") return null;
      throw error;
    }
  }

  if (fileKey.startsWith("opfs:")) {
    try {
      const directory = await getOPFSDirectory(OPFS_DIRECTORY_NAME, false);
      const handle = await directory.getFileHandle(fileKey.slice(5));
      const file = await handle.getFile();
      return { key: fileKey, blob: file, name: file.name, type: file.type, size: file.size };
    } catch (error) {
      if (error?.name === "NotFoundError") return null;
      throw error;
    }
  }

  // idb: keys are v19 fallback. Unprefixed keys are v16-v18 legacy records.
  return getFileFromIDB(fileKey);
}

async function downloadSubmissionFile(fileKey, fallbackName = "attachment.bin") {
  try {
    const record = await getSubmissionFile(fileKey);
    if (!record?.blob) {
      toast(tr("Файл недоступен на этом устройстве", "File is not available on this device"));
      return false;
    }
    const objectUrl = URL.createObjectURL(record.blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = record.name || fallbackName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    return true;
  } catch (error) {
    console.error("Attachment download failed", error);
    toast(tr("Не удалось скачать файл", "Could not download file"));
    return false;
  }
}

function bindSubmissionFileDownloads(scope = document) {
  scope.querySelectorAll("[data-download-file]").forEach(button => {
    if (button.dataset.downloadBound === "1") return;
    button.dataset.downloadBound = "1";
    button.addEventListener("click", async event => {
      event.preventDefault();
      const fileKey = button.dataset.downloadFile;
      const fileName = button.dataset.fileName || "attachment.bin";
      button.classList.add("is-downloading");
      button.disabled = true;
      await downloadSubmissionFile(fileKey, fileName);
      button.disabled = false;
      button.classList.remove("is-downloading");
    });
  });
}

// Migration: completely remove the old weekly challenge from existing browser data.
const migratedOrders = orders.filter(order => !order.weekly && order.ownerId !== "challenge");
if (migratedOrders.length !== orders.length) {
  orders = migratedOrders;
  saveOrders();
}

const demoEmployerOrders = [
  { id: 101, ownerId: "u-company", company: "Level Studio", contact: "@levelstudio", title: "Собрать страницу кабинета для SaaS", category: "Разработка", description: "Нужен адаптивный кабинет пользователя: навигация, таблица проектов, состояния загрузки и аккуратная мобильная версия.", skills: ["JavaScript", "CSS", "UI"], price: 14500, status: "in_review", favorites: 12, createdAt: Date.now() - 1000*60*60*9, submissions: [{ id: 10101, userId: "candidate-one", author: "Кирилл", contact: "@kirill_front", link: "https://github.com/example/dashboard", comment: "Собрал адаптивный интерфейс без фреймворков и добавил состояния загрузки.", winner: false }, { id: 10102, userId: "candidate-two", author: "Лена", contact: "@lena_ui", link: "https://figma.com/example-dashboard", comment: "Подготовила UI и кликабельный прототип кабинета.", winner: false }], reviews: [] },
  { id: 102, ownerId: "u-company", company: "Level Studio", contact: "@levelstudio", title: "Исследовать онбординг мобильного приложения", category: "Аналитика", description: "Провести быстрый UX-аудит онбординга, найти точки отвалов и предложить 5–7 улучшений с аргументацией.", skills: ["UX", "Research", "Product"], price: 8500, status: "open", favorites: 8, createdAt: Date.now() - 1000*60*60*3, submissions: [], reviews: [] }
];
let demoChanged = false;
for (const demoOrder of demoEmployerOrders) {
  if (!orders.some(order => order.id === demoOrder.id)) { orders.push(demoOrder); demoChanged = true; }
}
if (demoChanged) saveOrders();

function getCurrentUser() {
  const id = localStorage.getItem(KEYS.CURRENT_USER);
  return id ? users.find(user => user.id === id) || null : null;
}

function setCurrentUser(id) {
  localStorage.setItem(KEYS.CURRENT_USER, id);
}

function logout() {
  localStorage.removeItem(KEYS.CURRENT_USER);
  navigateTo("index.html");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat(currentLang === "en" ? "en-US" : "ru-RU").format(Number(value) || 0);
}

function formatPrice(value) {
  return `<span class="ct-amount"><span class="ct-coin" aria-label="CrowdToken">CT</span><span class="ct-number">${formatNumber(value)}</span></span>`;
}

function formatPriceRange(min, max) {
  return `<span class="ct-amount"><span class="ct-coin" aria-label="CrowdToken">CT</span><span class="ct-number">${formatNumber(min)}–${formatNumber(max)}</span></span>`;
}

function avatarInner(user) {
  if (user?.avatarData) return `<img src="${user.avatarData}" alt="${escapeHTML(user.name || "avatar")}" class="avatar-photo">`;
  return escapeHTML((user?.name || "?").charAt(0).toUpperCase());
}

function employerRating(order) {
  const owner = users.find(user => user.id === order.ownerId);
  const explicit = Number(owner?.rating);
  const reviews = (order.reviews || []).map(review => Number(review.rating)).filter(Number.isFinite);
  const average = reviews.length ? reviews.reduce((sum, value) => sum + value, 0) / reviews.length : null;
  const value = explicit || average || Math.min(5, 4.65 + Math.min(Number(order.favorites || 0), 40) * 0.0075);
  const count = Number(owner?.reviewCount) || Math.max(reviews.length, 12 + Math.round(Number(order.favorites || 0) * 1.8));
  return { value: value.toFixed(1), count };
}

function getStatusText(status) {
  const values = {
    open: tr("Открыта", "Open"),
    in_review: tr("На проверке", "Reviewing"),
    paid: tr("Завершена", "Completed"),
    cancelled: tr("Отменена", "Cancelled")
  };
  return values[status] || status;
}

function addHistory(text, userId = null) {
  history.unshift({
    id: Date.now(),
    userId: userId || getCurrentUser()?.id || null,
    text,
    date: new Date().toLocaleString(currentLang === "en" ? "en-US" : "ru-RU")
  });
  saveHistory();
}

function toast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  container.appendChild(element);
  setTimeout(() => element.remove(), 2700);
}

