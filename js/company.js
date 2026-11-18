function requireCompany(root) {
  const user = getCurrentUser();
  if (!user) { navigateTo("login.html"); return null; }
  if (user.role !== "company") {
    root.innerHTML = `<div class="empty-state show"><strong>${tr("Этот раздел только для работодателей", "This area is for employers only")}</strong><span>${tr("Для исполнителя доступен отдельный профиль и история решений.", "Contributors have a separate profile and submission history.")}</span><a class="btn btn-primary" href="profile.html">${tr("Открыть профиль исполнителя", "Open contributor profile")}</a></div>`;
    return null;
  }
  return user;
}

function companyTaskCard(order) {
  return `<article class="glass company-task-card">
    ${taskCover(order)}
    <div class="company-task-card-head"><div><span class="order-company">${escapeHTML(categoryLabel(order.category))}</span><h3><a href="order.html?id=${order.id}">${escapeHTML(order.title)}</a></h3></div><span class="order-status status-${order.status}"><i></i>${getStatusText(order.status)}</span></div>
    <p>${escapeHTML(order.description)}</p>
    <div class="company-task-row"><span><strong>${formatPrice(order.price)}</strong><small>${tr("бюджет", "budget")}</small></span><span><strong>${order.submissions.length}</strong><small>${tr("решений", "submissions")}</small></span><span><strong>♡ ${order.favorites}</strong><small>${tr("сохранений", "saves")}</small></span></div>
    <div class="company-task-actions"><a class="btn btn-secondary btn-compact" href="order.html?id=${order.id}">${tr("Открыть", "Open")}</a>${order.status === "in_review" ? `<a class="btn btn-primary btn-compact" href="company-submissions.html?task=${order.id}">${tr("Проверить решения", "Review submissions")}</a>` : ""}</div>
  </article>`;
}

function initCompanyDashboard() {
  const root = document.getElementById("companyDashboardRoot"); if (!root) return;
  const user = requireCompany(root); if (!user) return;
  const mine = orders.filter(order => order.ownerId === user.id);
  const open = mine.filter(order => order.status === "open");
  const review = mine.filter(order => order.status === "in_review");
  const completed = mine.filter(order => order.status === "paid");
  const incoming = mine.flatMap(order => order.submissions.map(sub => ({order, sub}))).filter(item => !item.sub.winner);
  const reserved = mine.filter(order => order.status !== "cancelled" && order.status !== "paid").reduce((sum, order) => sum + order.price, 0);
  root.innerHTML = `<div class="company-hero">
      <div><span class="section-caption">${tr("КАБИНЕТ РАБОТОДАТЕЛЯ", "EMPLOYER WORKSPACE")}</span><h1>${escapeHTML(user.name)}</h1><p>${tr("Следи за задачами, решениями и бюджетом. Сначала проверь то, что требует твоего действия.", "Track tasks, submissions and budget. Start with anything that needs your action.")}</p></div>
      <div class="company-hero-actions"><a class="btn btn-primary" href="create-order.html">${tr("Создать задачу", "Create task")}</a><button class="btn btn-secondary" id="companyLogoutButton">${tr("Выйти", "Sign out")}</button></div>
    </div>
    <nav class="company-workspace-nav"><a class="active" href="company.html">${tr("Обзор", "Overview")}</a><a href="company-tasks.html">${tr("Мои задачи", "My tasks")}</a><a href="company-submissions.html">${tr("Входящие решения", "Incoming submissions")}</a><a href="messages.html">${tr("Чаты", "Chats")}</a></nav>
    <div class="company-metrics"><div><strong>${mine.length}</strong><span>${tr("всего задач", "total tasks")}</span></div><div><strong>${review.length}</strong><span>${tr("на проверке", "in review")}</span></div><div><strong>${incoming.length}</strong><span>${tr("новых решений", "new submissions")}</span></div><div><strong>${formatPrice(reserved)}</strong><span>${tr("зарезервировано", "reserved")}</span></div></div>
    <div class="company-dashboard-grid"><section class="profile-box"><div class="profile-box-head"><h2>${tr("На что обратить внимание", "What to focus on")}</h2><a href="company-submissions.html">${tr("Все решения", "All submissions")} →</a></div>
      <div class="company-review-list">${review.length ? review.slice(0,4).map(order => `<a href="company-submissions.html?task=${order.id}" class="company-review-row"><div><strong>${escapeHTML(order.title)}</strong><span>${order.submissions.length} ${tr("решений ждут проверки", "submissions waiting")}</span></div><span class="order-status status-in_review"><i></i>${getStatusText("in_review")}</span></a>`).join("") : `<p class="empty-copy">${tr("Срочных действий нет. Новые решения появятся здесь.", "Nothing urgent right now. New submissions will appear here.")}</p>`}</div></section>
      <section class="profile-box"><div class="profile-box-head"><h2>${tr("Бюджет", "Budget")}</h2><span>CrowdHub</span></div><div class="company-wallet"><strong>${formatPrice(user.wallet)}</strong><span>${tr("доступно на новые задачи", "available for new tasks")}</span><div class="company-wallet-reserved"><span>${tr("В резерве", "Reserved")}</span><b>${formatPrice(reserved)}</b></div></div></section></div>
    <section class="profile-box company-recent"><div class="profile-box-head"><h2>${tr("Последние задачи", "Recent tasks")}</h2><a href="company-tasks.html">${tr("Управлять", "Manage")} →</a></div><div class="company-task-grid">${mine.length ? mine.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,4).map(companyTaskCard).join("") : `<p class="empty-copy">${tr("Создай первую задачу, чтобы она появилась здесь.", "Create your first task to see it here.")}</p>`}</div></section>`;
  document.getElementById("companyLogoutButton")?.addEventListener("click", logout);
}

function initCompanyTasks() {
  const root = document.getElementById("companyTasksRoot"); if (!root) return;
  const user = requireCompany(root); if (!user) return;
  const mine = orders.filter(order => order.ownerId === user.id);
  root.innerHTML = `<div class="company-page-head"><div><span class="section-caption">${tr("УПРАВЛЕНИЕ ЗАДАЧАМИ", "TASK MANAGEMENT")}</span><h1>${tr("Мои задачи", "My tasks")}</h1><p>${tr("Все задачи компании в одном месте: отслеживай статусы, интерес исполнителей и новые решения.", "All company tasks in one place: track statuses, contributor interest and new submissions.")}</p></div><a class="btn btn-primary" href="create-order.html">${tr("Создать задачу", "Create task")}</a></div>
    <nav class="company-workspace-nav"><a href="company.html">${tr("Обзор", "Overview")}</a><a class="active" href="company-tasks.html">${tr("Мои задачи", "My tasks")}</a><a href="company-submissions.html">${tr("Входящие решения", "Incoming submissions")}</a><a href="messages.html">${tr("Чаты", "Chats")}</a></nav>
    <div class="employer-task-filterbar" id="companyTaskFilters">
      <button class="active" data-company-filter="all">${tr("Все", "All")} <span>${mine.length}</span></button>
      <button data-company-filter="open">${tr("Открытые", "Open")} <span>${mine.filter(o=>o.status==='open').length}</span></button>
      <button data-company-filter="in_review">${tr("На проверке", "Reviewing")} <span>${mine.filter(o=>o.status==='in_review').length}</span></button>
      <button data-company-filter="paid">${tr("Завершённые", "Completed")} <span>${mine.filter(o=>o.status==='paid').length}</span></button>
      <button data-company-filter="cancelled">${tr("Отменённые", "Cancelled")} <span>${mine.filter(o=>o.status==='cancelled').length}</span></button>
    </div><div class="company-task-grid" id="companyTaskGrid"></div>`;
  const grid = document.getElementById("companyTaskGrid");
  const render = status => { const list = status === 'all' ? mine : mine.filter(o=>o.status===status); grid.innerHTML = list.length ? list.map(companyTaskCard).join('') : `<div class="empty-state show"><strong>${tr("Здесь пока пусто", "Nothing here yet")}</strong><span>${tr("Попробуй другой статус или создай новую задачу.", "Try another status or create a new task.")}</span></div>`; };
  document.querySelectorAll('[data-company-filter]').forEach(button => button.addEventListener('click',()=>{document.querySelectorAll('[data-company-filter]').forEach(x=>x.classList.toggle('active',x===button));render(button.dataset.companyFilter)}));
  render('all');
}

function initCompanySubmissions() {
  const root = document.getElementById("companySubmissionsRoot");
  if (!root) return;
  const user = requireCompany(root);
  if (!user) return;

  const mine = orders.filter(order => order.ownerId === user.id);
  const taskId = Number(new URLSearchParams(location.search).get("task")) || null;
  let incoming = mine.flatMap(order => order.submissions.map(sub => ({ order, sub })));
  if (taskId) incoming = incoming.filter(item => item.order.id === taskId);

  root.innerHTML = `
    <div class="company-page-head">
      <div>
        <span class="section-caption">${tr("РЕШЕНИЯ ИСПОЛНИТЕЛЕЙ", "CONTRIBUTOR SUBMISSIONS")}</span>
        <h1>${tr("Входящие решения", "Incoming submissions")}</h1>
        <p>${tr("Сравни работы, уточни детали в чате и выбери решение, которое лучше всего подходит задаче.", "Compare work, clarify details in chat and choose the submission that best fits the task.")}</p>
      </div>
    </div>

    <nav class="company-workspace-nav">
      <a href="company.html">${tr("Обзор", "Overview")}</a>
      <a href="company-tasks.html">${tr("Мои задачи", "My tasks")}</a>
      <a class="active" href="company-submissions.html">${tr("Входящие решения", "Incoming submissions")}</a>
      <a href="messages.html">${tr("Чаты", "Chats")}</a>
    </nav>

    <div class="company-submission-list">
      ${incoming.length ? incoming.map(({ order, sub }) => `
        <article class="company-submission-card">
          <div class="company-submission-avatar">${escapeHTML(sub.author.charAt(0).toUpperCase())}</div>
          <div class="company-submission-copy">
            <div class="company-submission-title">
              <strong>${escapeHTML(sub.author)}</strong>
              <span>→</span>
              <a href="order.html?id=${order.id}">${escapeHTML(order.title)}</a>
            </div>
            <p>${escapeHTML(sub.comment)}</p>
            <div class="company-submission-meta">
              <span>${vkContactMarkup(sub.contact) || tr("Ссылка ВК не указана", "VK link not provided")}</span>
              <div class="company-submission-files">
                ${sub.link ? `<a href="${escapeHTML(sub.link)}" target="_blank" rel="noopener">${tr("Открыть ссылку", "Open link")} ↗</a>` : ""}
                ${sub.fileName ? (sub.fileKey
                  ? `<button type="button" class="zip-attachment zip-download" data-download-file="${escapeHTML(sub.fileKey)}" data-file-name="${escapeHTML(sub.fileName)}" title="${tr("Скачать ZIP", "Download ZIP")}"><b>ZIP</b><span>${escapeHTML(sub.fileName)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></button>`
                  : `<span class="zip-attachment zip-unavailable"><b>ZIP</b><span>${escapeHTML(sub.fileName)}</span></span>`)
                : ""}
              </div>
            </div>
          </div>
          <div class="company-submission-actions">
            <a class="btn btn-secondary btn-compact" href="messages.html?order=${encodeURIComponent(order.id)}&user=${encodeURIComponent(sub.userId)}">${tr("Открыть чат", "Open chat")}</a>
            ${sub.winner
              ? `<span class="winner-pill"><i></i>${tr("Победитель", "Winner")}</span>`
              : `<a class="btn btn-primary btn-compact" href="order.html?id=${order.id}">${tr("Проверить", "Review")}</a>`}
          </div>
        </article>`).join("") : `
        <div class="empty-state show">
          <strong>${tr("Новых решений нет", "No new submissions")}</strong>
          <span>${tr("Новые решения появятся здесь после отправки работ исполнителями.", "New submissions will appear here after contributors send their work.")}</span>
        </div>`}
    </div>`;

  bindSubmissionFileDownloads(root);
}
