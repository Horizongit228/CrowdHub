function notificationItemsMarkup(user, reviewing, open) {
  if (!user) {
    return `
      <a href="login.html" class="notification-modal-item">
        <span class="notification-modal-icon">${islandSvg("profile")}</span>
        <div><strong>${tr("Войди, чтобы получать уведомления", "Sign in to receive notifications")}</strong><small>${tr("Сохраняй задачи и получай уведомления о новых событиях.", "Save tasks and receive notifications about new activity.")}</small></div>
        <span class="notification-modal-arrow">→</span>
      </a>`;
  }

  return `
    <a href="orders.html?status=in_review" class="notification-modal-item">
      <span class="notification-modal-icon accent">${islandSvg("updates")}</span>
      <div><strong>${tr(`${reviewing} задач проверяют решения`, `${reviewing} tasks are reviewing solutions`)}</strong><small>${tr("Проверь поступившие решения по задачам.", "Review incoming task submissions.")}</small></div>
      <span class="notification-modal-arrow">→</span>
    </a>
    <a href="orders.html" class="notification-modal-item">
      <span class="notification-modal-icon green">${islandSvg("tasks")}</span>
      <div><strong>${tr(`${open} открытых задач доступно`, `${open} open tasks available`)}</strong><small>${tr("Найди новую реальную задачу для практики.", "Find a new real-world task to practice on.")}</small></div>
      <span class="notification-modal-arrow">→</span>
    </a>
    <a href="${user?.role === "company" ? "company.html" : "profile.html?tab=overview"}" class="notification-modal-item">
      <span class="notification-modal-icon muted">${islandSvg("profile")}</span>
      <div><strong>${tr("Твой профиль", "Your profile")}</strong><small>${tr("Проверь навыки, портфолио и данные аккаунта.", "Review your skills, portfolio and account details.")}</small></div>
      <span class="notification-modal-arrow">→</span>
    </a>`;
}

function renderNotificationModal(user, reviewing, open) {
  document.getElementById("notificationModal")?.remove();
  const modal = document.createElement("div");
  modal.className = "modal-overlay notification-modal";
  modal.id = "notificationModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "notificationModalTitle");
  modal.innerHTML = `
    <section class="notification-modal-card" role="document">
      <div class="notification-modal-head">
        <div>
          <span class="section-caption">${tr("СОБЫТИЯ", "ACTIVITY")}</span>
          <h2 id="notificationModalTitle">${tr("Уведомления", "Notifications")}</h2>
          <p>${tr("Последние события и изменения в CrowdHub.", "Latest events and changes in CrowdHub.")}</p>
        </div>
        <button type="button" class="modal-close notification-modal-close" data-modal-close aria-label="${tr("Закрыть", "Close")}">×</button>
      </div>
      <div class="notification-modal-list">
        ${notificationItemsMarkup(user, reviewing, open)}
      </div>
    </section>`;
  document.body.appendChild(modal);
}

function syncModalBackdropState() {
  const hasOpenModal = Boolean(document.querySelector(".modal-overlay.show"));
  document.body.classList.toggle("modal-open", hasOpenModal);
}

function openModalElement(modal) {
  if (!modal) return;
  modal.classList.add("show");
  syncModalBackdropState();
}

function openNotificationModal() {
  const modal = document.getElementById("notificationModal");
  if (!modal) return;
  openModalElement(modal);
  requestAnimationFrame(() => modal.querySelector("[data-modal-close]")?.focus());
}

function closeModalElement(modal) {
  if (!modal) return;
  modal.classList.remove("show");
  requestAnimationFrame(syncModalBackdropState);
  if (modal.id === "notificationModal") restoreIslandIndex();
}

