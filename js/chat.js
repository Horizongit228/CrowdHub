function chatKey(orderOrId, participantOrId) {
  const orderId = typeof orderOrId === "object" ? orderOrId.id : orderOrId;
  const participantId = typeof participantOrId === "object" ? participantOrId.id : participantOrId;
  return `${orderId}:${participantId}`;
}

function chatClock() {
  return new Date().toLocaleTimeString(currentLang === "en" ? "en-US" : "ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function ensureChatThread(order, participantId, participantName = "") {
  const key = chatKey(order.id, participantId);
  let changed = false;

  if (!Array.isArray(chats[key])) {
    chats[key] = [{
      id: `welcome-${order.id}-${participantId}`,
      senderId: order.ownerId,
      senderRole: "company",
      text: tr(`Здравствуйте! Это чат по задаче «${order.title}». Если есть вопросы по ТЗ — напишите сюда.`, `Hi! This is the chat for “${order.title}”. Ask any questions about the brief here.`),
      time: chatClock()
    }];
    changed = true;
  }

  // v13-v18 stored messages as from: "me" / "employer". Convert them once
  // so the exact same thread can be rendered correctly from both accounts.
  chats[key] = chats[key].map(message => {
    if (message.senderId) return message;
    changed = true;
    const performerSent = message.from === "me" || message.from === "performer";
    return {
      ...message,
      senderId: performerSent ? participantId : order.ownerId,
      senderRole: performerSent ? "performer" : "company",
      participantName: participantName || message.participantName || ""
    };
  });

  if (changed) saveChats();
  return { key, thread: chats[key] };
}

function appendSubmissionToChat(order, submission) {
  if (!order || !submission?.userId) return;
  const { thread } = ensureChatThread(order, submission.userId, submission.author);
  const marker = `submission-${submission.id}`;
  if (thread.some(message => String(message.id) === marker || message.submissionId === submission.id)) return;

  thread.push({
    id: marker,
    submissionId: submission.id,
    kind: "submission",
    senderId: submission.userId,
    senderRole: "performer",
    text: submission.comment || tr("Отправил решение задачи", "Submitted a solution"),
    link: submission.link || "",
    fileKey: submission.fileKey || "",
    fileName: submission.fileName || "",
    fileSize: submission.fileSize || 0,
    time: chatClock()
  });
  saveChats();
}

function chatAttachmentMarkup(message) {
  const parts = [];
  if (message.link) {
    parts.push(`<a class="chat-link-attachment" href="${escapeHTML(message.link)}" target="_blank" rel="noopener">${tr("Открыть ссылку", "Open link")} ↗</a>`);
  }
  if (message.fileName) {
    const extension = String(message.fileName).split(".").pop()?.toUpperCase().slice(0, 5) || "FILE";
    if (message.fileKey) {
      parts.push(`<button type="button" class="chat-file-attachment" data-download-file="${escapeHTML(message.fileKey)}" data-file-name="${escapeHTML(message.fileName)}"><b>${escapeHTML(extension)}</b><span>${escapeHTML(message.fileName)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></button>`);
    } else {
      parts.push(`<span class="chat-file-attachment unavailable"><b>${escapeHTML(extension)}</b><span>${escapeHTML(message.fileName)}</span></span>`);
    }
  }
  return parts.length ? `<div class="chat-message-attachments">${parts.join("")}</div>` : "";
}

function chatMessageMarkup(message, currentUser) {
  const mine = message.senderId === currentUser?.id;
  const systemLabel = message.kind === "submission" ? `<span class="chat-message-label">${tr("Решение отправлено", "Solution submitted")}</span>` : "";
  return `<div class="chat-message ${mine ? "mine" : "theirs"}">
    ${systemLabel}
    ${message.text ? `<div>${escapeHTML(message.text)}</div>` : ""}
    ${chatAttachmentMarkup(message)}
    <small>${escapeHTML(message.time || "")}</small>
  </div>`;
}

function bindChatComposer({ form, input, fileInput, fileLabel, messages, order, participantId, sender }) {
  if (!form) return;

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (fileLabel) {
      fileLabel.textContent = file ? file.name : tr("Прикрепить файл", "Attach file");
      fileLabel.classList.toggle("has-file", Boolean(file));
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const text = input?.value.trim() || "";
    const file = fileInput?.files?.[0] || null;
    if (!text && !file) return;
    if (file && file.size > 15 * 1024 * 1024) {
      toast(tr("Файл слишком большой. Максимум 15 МБ", "File is too large. Maximum 15 MB"));
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    const messageId = Date.now();
    let fileKey = "";
    if (submitButton) submitButton.disabled = true;
    form.classList.add("is-sending");

    try {
      if (file) fileKey = await storeChatFile(file, order.id, participantId, messageId);
      const { thread } = ensureChatThread(order, participantId, sender.name);
      thread.push({
        id: messageId,
        senderId: sender.id,
        senderRole: sender.role,
        text,
        fileKey,
        fileName: file?.name || "",
        fileSize: file?.size || 0,
        time: chatClock()
      });
      saveChats();
      if (input) input.value = "";
      if (fileInput) fileInput.value = "";
      if (fileLabel) {
        fileLabel.textContent = tr("Прикрепить файл", "Attach file");
        fileLabel.classList.remove("has-file");
      }
      messages.innerHTML = thread.map(message => chatMessageMarkup(message, sender)).join("");
      bindSubmissionFileDownloads(messages);
      messages.scrollTop = messages.scrollHeight;
      addHistory(sender.role === "company"
        ? tr(`Отправлено сообщение исполнителю по задаче «${order.title}»`, `Sent a message to the contributor for “${order.title}”`)
        : tr(`Отправлено сообщение заказчику по задаче «${order.title}»`, `Sent a message to the employer for “${order.title}”`), sender.id);
    } catch (error) {
      console.error("Chat attachment send failed", error);
      if (fileKey) { try { await deleteStoredFile(fileKey); } catch {} }
      if (error?.code === "quota" || error?.name === "QuotaExceededError") {
        toast(tr("Не хватает места в браузере для этого файла", "There is not enough browser storage for this file"));
      } else {
        toast(tr("Не удалось отправить сообщение или файл", "Could not send the message or file"));
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
      form.classList.remove("is-sending");
    }
  });
}

function renderEmployerChat(order) {
  document.querySelector(".employer-chat")?.remove();
  const user = getCurrentUser();

  // Employers talk to contributors from their dedicated workspace, never to
  // themselves from the public task page.
  if (user?.role === "company") return;

  const wrap = document.createElement("section");
  wrap.className = "employer-chat";

  if (!user) {
    wrap.innerHTML = `<button type="button" class="chat-fab chat-fab-label" data-chat-login aria-label="${tr("Войти, чтобы открыть чат с заказчиком", "Sign in to open employer chat")}">
      <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg><span>${tr("Открыть чат с заказчиком", "Open employer chat")}</span>
    </button>`;
    document.body.appendChild(wrap);
    wrap.querySelector("[data-chat-login]")?.addEventListener("click", () => navigateTo("login.html"));
    return;
  }

  const { thread } = ensureChatThread(order, user.id, user.name);
  const renderMessages = () => thread.map(message => chatMessageMarkup(message, user)).join("");

  wrap.innerHTML = `
    <button type="button" class="chat-fab chat-fab-label" data-chat-toggle aria-label="${tr("Открыть чат с заказчиком", "Open employer chat")}">
      <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg><span>${tr("Открыть чат с заказчиком", "Open employer chat")}</span><span class="chat-fab-dot"></span>
    </button>
    <div class="chat-panel" data-chat-panel hidden>
      <header class="chat-head">
        <div class="chat-employer-avatar">${escapeHTML(order.company.charAt(0).toUpperCase())}</div>
        <div><strong>${escapeHTML(order.company)}</strong><span><i></i>${tr("заказчик · чат по задаче", "employer · task chat")}</span></div>
        <button type="button" class="chat-close" data-chat-close aria-label="${tr("Закрыть чат", "Close chat")}">×</button>
      </header>
      <div class="chat-task-context"><span>${tr("Задача", "Task")}</span><strong>${escapeHTML(order.title)}</strong></div>
      <div class="chat-messages" data-chat-messages>${renderMessages()}</div>
      <div class="chat-file-name" data-chat-file-label>${tr("Прикрепить файл", "Attach file")}</div>
      <form class="chat-form" data-chat-form>
        <label class="chat-attach" title="${tr("Прикрепить файл", "Attach file")}"><input type="file" data-chat-file hidden><svg viewBox="0 0 24 24"><path d="m20 12.5-8.1 8.1a6 6 0 0 1-8.5-8.5l9-9a4 4 0 1 1 5.7 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/></svg></label>
        <textarea rows="1" data-chat-input placeholder="${tr("Написать сообщение…", "Write a message…")}"></textarea>
        <button type="submit" aria-label="${tr("Отправить", "Send")}"><svg viewBox="0 0 24 24"><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg></button>
      </form>
    </div>`;
  document.body.appendChild(wrap);

  const panel = wrap.querySelector("[data-chat-panel]");
  const toggle = wrap.querySelector("[data-chat-toggle]");
  const close = wrap.querySelector("[data-chat-close]");
  const messages = wrap.querySelector("[data-chat-messages]");
  const input = wrap.querySelector("[data-chat-input]");
  const fileInput = wrap.querySelector("[data-chat-file]");
  const fileLabel = wrap.querySelector("[data-chat-file-label]");
  const openChat = () => {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("show"));
    toggle.classList.add("open");
    setTimeout(() => { messages.scrollTop = messages.scrollHeight; input.focus(); }, 60);
  };
  const closeChat = () => {
    panel.classList.remove("show");
    toggle.classList.remove("open");
    setTimeout(() => { panel.hidden = true; }, 180);
  };
  toggle.addEventListener("click", () => panel.hidden ? openChat() : closeChat());
  close.addEventListener("click", closeChat);
  bindSubmissionFileDownloads(messages);
  bindChatComposer({ form: wrap.querySelector("[data-chat-form]"), input, fileInput, fileLabel, messages, order, participantId: user.id, sender: user });
}

function companyChatConversations(companyUser) {
  const mine = orders.filter(order => order.ownerId === companyUser.id);
  const byKey = new Map();

  for (const order of mine) {
    for (const submission of order.submissions || []) {
      appendSubmissionToChat(order, submission);
      byKey.set(chatKey(order.id, submission.userId), {
        key: chatKey(order.id, submission.userId),
        order,
        participantId: submission.userId,
        participantName: submission.author || users.find(user => user.id === submission.userId)?.name || tr("Исполнитель", "Contributor"),
        contact: submission.contact || ""
      });
    }
  }

  for (const [key] of Object.entries(chats || {})) {
    const [orderIdRaw, participantId] = key.split(":");
    const order = mine.find(item => String(item.id) === String(orderIdRaw));
    if (!order || !participantId || byKey.has(key)) continue;
    const participant = users.find(user => user.id === participantId);
    byKey.set(key, {
      key,
      order,
      participantId,
      participantName: participant?.name || tr("Исполнитель", "Contributor"),
      contact: participant?.contact || ""
    });
  }

  return [...byKey.values()].sort((a, b) => {
    const aThread = chats[a.key] || [];
    const bThread = chats[b.key] || [];
    return Number(bThread.at(-1)?.id || 0) - Number(aThread.at(-1)?.id || 0);
  });
}

function initCompanyChats() {
  const root = document.getElementById("companyChatsRoot");
  if (!root) return;
  const user = typeof requireCompany === "function" ? requireCompany(root) : getCurrentUser();
  if (!user || user.role !== "company") return;

  const conversations = companyChatConversations(user);
  const params = new URLSearchParams(location.search);
  const requestedOrder = params.get("order");
  const requestedUser = params.get("user");
  let selected = conversations.find(item => String(item.order.id) === String(requestedOrder) && item.participantId === requestedUser) || conversations[0] || null;

  root.innerHTML = `
    <div class="company-page-head">
      <div><span class="section-caption">${tr("ОБЩЕНИЕ ПО ЗАДАЧАМ", "TASK CONVERSATIONS")}</span><h1>${tr("Чаты с исполнителями", "Contributor chats")}</h1><p>${tr("Сообщения, файлы и отправленные решения находятся в одном диалоге по каждой задаче.", "Messages, files and submitted work stay together in one task conversation.")}</p></div>
    </div>
    <nav class="company-workspace-nav">
      <a href="company.html">${tr("Обзор", "Overview")}</a>
      <a href="company-tasks.html">${tr("Мои задачи", "My tasks")}</a>
      <a href="company-submissions.html">${tr("Входящие решения", "Incoming submissions")}</a>
      <a class="active" href="company-chats.html">${tr("Чаты", "Chats")}</a>
    </nav>
    ${selected ? `<div class="company-chat-workspace">
      <aside class="company-chat-list">
        ${conversations.map(item => {
          const thread = chats[item.key] || [];
          const last = thread.at(-1);
          const active = item.key === selected.key;
          return `<a class="company-chat-person ${active ? "active" : ""}" href="company-chats.html?order=${encodeURIComponent(item.order.id)}&user=${encodeURIComponent(item.participantId)}">
            <span class="company-chat-avatar">${escapeHTML((item.participantName || "?").charAt(0).toUpperCase())}</span>
            <span class="company-chat-person-copy"><strong>${escapeHTML(item.participantName)}</strong><small>${escapeHTML(item.order.title)}</small><em>${escapeHTML(last?.text || last?.fileName || tr("Диалог по задаче", "Task conversation"))}</em></span>
          </a>`;
        }).join("")}
      </aside>
      <section class="company-chat-thread" id="companyChatThread"></section>
    </div>` : `<div class="empty-state show"><strong>${tr("Чатов пока нет", "No chats yet")}</strong><span>${tr("Когда исполнитель напишет по задаче или отправит решение, диалог появится здесь.", "When a contributor messages you or submits work, the conversation will appear here.")}</span><a class="btn btn-primary" href="company-tasks.html">${tr("Открыть мои задачи", "Open my tasks")}</a></div>`}`;

  if (!selected) return;
  const threadRoot = document.getElementById("companyChatThread");
  const { thread } = ensureChatThread(selected.order, selected.participantId, selected.participantName);
  threadRoot.innerHTML = `
    <header class="company-chat-thread-head">
      <div class="company-chat-avatar large">${escapeHTML(selected.participantName.charAt(0).toUpperCase())}</div>
      <div><strong>${escapeHTML(selected.participantName)}</strong><span>${vkContactMarkup(selected.contact) ? `${vkContactMarkup(selected.contact)} · ` : ""}<a href="order.html?id=${selected.order.id}">${escapeHTML(selected.order.title)}</a></span></div>
    </header>
    <div class="chat-messages company-chat-messages" data-company-chat-messages>${thread.map(message => chatMessageMarkup(message, user)).join("")}</div>
    <div class="chat-file-name company-chat-file-name" data-company-chat-file-label>${tr("Прикрепить файл", "Attach file")}</div>
    <form class="chat-form company-chat-form" data-company-chat-form>
      <label class="chat-attach" title="${tr("Прикрепить файл", "Attach file")}"><input type="file" data-company-chat-file hidden><svg viewBox="0 0 24 24"><path d="m20 12.5-8.1 8.1a6 6 0 0 1-8.5-8.5l9-9a4 4 0 1 1 5.7 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/></svg></label>
      <textarea rows="1" data-company-chat-input placeholder="${tr("Ответить исполнителю…", "Reply to contributor…")}"></textarea>
      <button type="submit" aria-label="${tr("Отправить", "Send")}"><svg viewBox="0 0 24 24"><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg></button>
    </form>`;

  const messages = threadRoot.querySelector("[data-company-chat-messages]");
  bindSubmissionFileDownloads(messages);
  bindChatComposer({
    form: threadRoot.querySelector("[data-company-chat-form]"),
    input: threadRoot.querySelector("[data-company-chat-input]"),
    fileInput: threadRoot.querySelector("[data-company-chat-file]"),
    fileLabel: threadRoot.querySelector("[data-company-chat-file-label]"),
    messages,
    order: selected.order,
    participantId: selected.participantId,
    sender: user
  });
  requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
}

function performerChatConversations(user) {
  const byKey = new Map();
  for (const order of orders) {
    const ownSubmission = (order.submissions || []).find(sub => sub.userId === user.id);
    const key = chatKey(order.id, user.id);
    if (ownSubmission) appendSubmissionToChat(order, ownSubmission);
    if (!ownSubmission && !Array.isArray(chats[key])) continue;
    byKey.set(key, {
      key,
      order,
      participantId: user.id,
      participantName: order.company,
      contact: order.contact || "",
      counterpartRole: "company"
    });
  }
  return [...byKey.values()].sort((a,b)=>Number((chats[b.key]||[]).at(-1)?.id||0)-Number((chats[a.key]||[]).at(-1)?.id||0));
}

function supportThreadFor(user) {
  const key = `support:${user.id}`;
  if (!Array.isArray(chats[key])) {
    chats[key] = [{
      id: `support-welcome-${user.id}`,
      senderId: "crowdhub-support",
      senderRole: "support",
      text: tr("Привет! Это поддержка CrowdHub. Напиши сюда, если нужен человек из команды — история обращения останется в этом диалоге.", "Hi! This is CrowdHub support. Message us here if you need help from the team — the conversation stays in this thread."),
      time: chatClock()
    }];
    saveChats();
  }
  return { key, thread: chats[key] };
}

function messageCenterConversations(user) {
  const taskConversations = user.role === "company" ? companyChatConversations(user).map(item=>({...item,counterpartRole:"performer"})) : performerChatConversations(user);
  const support = supportThreadFor(user);
  return [{ key:support.key, type:"support", participantName:tr("Поддержка CrowdHub", "CrowdHub Support"), subtitle:tr("Системный диалог", "System conversation"), thread:support.thread }, ...taskConversations.map(item=>({...item,type:"task",thread:chats[item.key]||[]}))];
}

function initMessagesPage() {
  const root = document.getElementById("messagesRoot");
  if (!root) return;
  const user = getCurrentUser();
  if (!user) { navigateTo("login.html"); return; }

  const conversations = messageCenterConversations(user);
  const params = new URLSearchParams(location.search);
  const requestedSupport = params.get("support") === "1";
  const requestedOrder = params.get("order");
  const requestedUser = params.get("user");
  let selected = requestedSupport
    ? conversations[0]
    : conversations.find(item => item.type === "task" && String(item.order?.id) === String(requestedOrder) && (!requestedUser || item.participantId === requestedUser)) || conversations.find(item=>item.type==="task") || conversations[0];

  const conversationHref = item => item.type === "support" ? "messages.html?support=1" : `messages.html?order=${encodeURIComponent(item.order.id)}&user=${encodeURIComponent(item.participantId)}`;
  const lastText = item => {
    const last = (item.thread || []).at(-1);
    return last?.text || last?.fileName || (item.type === "support" ? tr("Поддержка платформы", "Platform support") : tr("Диалог по задаче", "Task conversation"));
  };

  root.innerHTML = `
    <div class="messages-page-head"><div><span class="section-caption">${tr("СООБЩЕНИЯ", "MESSAGES")}</span><h1>${tr("Чаты", "Chats")}</h1><p>${tr("Все рабочие диалоги и поддержка платформы — в одном месте.", "All task conversations and platform support in one place.")}</p></div></div>
    <div class="messages-workspace">
      <aside class="messages-sidebar">
        <div class="messages-sidebar-title"><strong>${tr("Диалоги", "Conversations")}</strong><span>${conversations.length}</span></div>
        ${conversations.map(item => `<a class="messages-person ${item.key===selected.key?"active":""} ${item.type==="support"?"support":""}" href="${conversationHref(item)}">
          <span class="messages-avatar ${item.type==="support"?"support-avatar":""}">${item.type==="support"?'<svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-7 7v5a3 3 0 0 0 3 3h1v-6H6v-2a6 6 0 0 1 12 0v2h-3v6h1a3 3 0 0 0 3-3v-5a7 7 0 0 0-7-7Z"/><path d="M15 19c-.8 1.3-1.8 2-3 2"/></svg>':escapeHTML((item.participantName||"?").charAt(0).toUpperCase())}</span>
          <span class="messages-person-copy"><strong>${escapeHTML(item.participantName)}</strong><small>${item.type==="support"?escapeHTML(item.subtitle):escapeHTML(item.order.title)}</small><em>${escapeHTML(lastText(item))}</em></span>
        </a>`).join("")}
      </aside>
      <section class="messages-thread" id="messagesThread"></section>
    </div>`;

  const threadRoot = document.getElementById("messagesThread");
  if (selected.type === "support") {
    const { thread } = supportThreadFor(user);
    threadRoot.innerHTML = `
      <header class="messages-thread-head"><span class="messages-avatar support-avatar"><svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-7 7v5a3 3 0 0 0 3 3h1v-6H6v-2a6 6 0 0 1 12 0v2h-3v6h1a3 3 0 0 0 3-3v-5a7 7 0 0 0-7-7Z"/><path d="M15 19c-.8 1.3-1.8 2-3 2"/></svg></span><div><strong>${tr("Поддержка CrowdHub", "CrowdHub Support")}</strong><span>${tr("Официальный системный диалог", "Official system conversation")}</span></div></header>
      <div class="chat-messages messages-chat-messages" data-support-messages>${thread.map(message=>chatMessageMarkup(message,user)).join("")}</div>
      <div class="chat-file-name" data-support-file-label>${tr("Прикрепить файл", "Attach file")}</div>
      <form class="chat-form messages-chat-form" data-support-form><label class="chat-attach"><input type="file" data-support-file hidden><svg viewBox="0 0 24 24"><path d="m20 12.5-8.1 8.1a6 6 0 0 1-8.5-8.5l9-9a4 4 0 1 1 5.7 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/></svg></label><textarea rows="1" data-support-input placeholder="${tr("Написать в поддержку…", "Message support…")}"></textarea><button type="submit"><svg viewBox="0 0 24 24"><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg></button></form>`;
    const form=threadRoot.querySelector('[data-support-form]'), input=threadRoot.querySelector('[data-support-input]'), fileInput=threadRoot.querySelector('[data-support-file]'), fileLabel=threadRoot.querySelector('[data-support-file-label]'), messages=threadRoot.querySelector('[data-support-messages]');
    fileInput.addEventListener('change',()=>{const f=fileInput.files?.[0];fileLabel.textContent=f?f.name:tr("Прикрепить файл","Attach file")});
    form.addEventListener('submit',async event=>{event.preventDefault();const text=input.value.trim();const file=fileInput.files?.[0];if(!text&&!file)return;let fileKey="";const id=Date.now();try{if(file)fileKey=await storeChatFile(file,"support",user.id,id);thread.push({id,senderId:user.id,senderRole:user.role,text,fileKey,fileName:file?.name||"",fileSize:file?.size||0,time:chatClock()});saveChats();input.value="";fileInput.value="";fileLabel.textContent=tr("Прикрепить файл","Attach file");messages.innerHTML=thread.map(message=>chatMessageMarkup(message,user)).join("");bindSubmissionFileDownloads(messages);messages.scrollTop=messages.scrollHeight;}catch(error){console.error("Support message failed",error);toast(tr("Не удалось отправить сообщение","Could not send message"));}});
    bindSubmissionFileDownloads(messages);
    requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight});
    return;
  }

  const item = selected;
  const { thread } = ensureChatThread(item.order, item.participantId, user.role === "company" ? item.participantName : user.name);
  const counterpartName = user.role === "company" ? item.participantName : item.order.company;
  threadRoot.innerHTML = `
    <header class="messages-thread-head"><span class="messages-avatar">${escapeHTML(counterpartName.charAt(0).toUpperCase())}</span><div><strong>${escapeHTML(counterpartName)}</strong><span><a href="order.html?id=${item.order.id}">${escapeHTML(item.order.title)}</a></span></div></header>
    <div class="chat-messages messages-chat-messages" data-message-center-messages>${thread.map(message=>chatMessageMarkup(message,user)).join("")}</div>
    <div class="chat-file-name" data-message-center-file-label>${tr("Прикрепить файл", "Attach file")}</div>
    <form class="chat-form messages-chat-form" data-message-center-form><label class="chat-attach"><input type="file" data-message-center-file hidden><svg viewBox="0 0 24 24"><path d="m20 12.5-8.1 8.1a6 6 0 0 1-8.5-8.5l9-9a4 4 0 1 1 5.7 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/></svg></label><textarea rows="1" data-message-center-input placeholder="${tr("Написать сообщение…", "Write a message…")}"></textarea><button type="submit"><svg viewBox="0 0 24 24"><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg></button></form>`;
  const messages=threadRoot.querySelector('[data-message-center-messages]');
  bindSubmissionFileDownloads(messages);
  bindChatComposer({form:threadRoot.querySelector('[data-message-center-form]'),input:threadRoot.querySelector('[data-message-center-input]'),fileInput:threadRoot.querySelector('[data-message-center-file]'),fileLabel:threadRoot.querySelector('[data-message-center-file-label]'),messages,order:item.order,participantId:item.participantId,sender:user});
  requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight});
}
