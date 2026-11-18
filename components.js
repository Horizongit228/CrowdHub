function headerPrimaryAction(user) {
  if (user?.role === "company") return `<a href="company-tasks.html" class="header-create">${tr("Мои задачи", "My tasks")}</a>`;
  if (user) return `<a href="profile.html?tab=submissions" class="header-create">${tr("Мои отклики", "My submissions")}</a>`;
  return `<a href="orders.html" class="header-create">${tr("Каталог", "Browse tasks")}</a>`;
}

function taskCoverIcon(category) {
  const icons = {
    "Разработка": '<svg viewBox="0 0 24 24"><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 4-4 16"/></svg>',
    "Дизайн": '<svg viewBox="0 0 24 24"><path d="M12 3 4 11l8 8 8-8-8-8Z"/><path d="M8 15h8"/></svg>',
    "Маркетинг": '<svg viewBox="0 0 24 24"><path d="M4 17 10 11l4 4 6-8"/><path d="M15 7h5v5"/></svg>',
    "Аналитика": '<svg viewBox="0 0 24 24"><path d="M5 19V9M10 19V5M15 19v-7M20 19V3"/></svg>',
    "Контент": '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>'
  };
  return icons[category] || icons["Разработка"];
}

function taskCover(order, large = false) {
  const slug = ({"Разработка":"dev","Дизайн":"design","Маркетинг":"marketing","Аналитика":"analytics","Контент":"content"})[order.category] || "dev";
  const initials = String(order.company || "CH").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return `<div class="task-cover task-cover-${slug} ${large ? "task-cover-large" : ""}" aria-hidden="true">
    <span class="task-cover-noise"></span><span class="task-cover-orb one"></span><span class="task-cover-orb two"></span>
    <span class="task-cover-brand">${escapeHTML(initials)}</span>
    <span class="task-cover-icon">${taskCoverIcon(order.category)}</span>
    <span class="task-cover-label">${escapeHTML(categoryLabel(order.category))}</span>
  </div>`;
}

function renderHeader() {
  const target = document.getElementById("siteHeader");
  if (!target) return;

  const user = getCurrentUser();
  const currentHref = user ? (user.role === "company" ? "company.html" : "profile.html") : "login.html";
  const initial = user ? avatarInner(user) : "?";
  const reviewing = orders.filter(order => order.status === "in_review").length;
  const open = orders.filter(order => order.status === "open").length;
  const notificationCount = user ? Math.min(9, Math.max(1, reviewing)) : 1;

  target.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="header-shell">
          <a href="index.html" class="brand" aria-label="${tr("CrowdHub — главная", "CrowdHub — home")}">
            <span class="brand-icon brand-logo-image"><img src="logo.png" alt="CrowdHub"></span>
            <strong>CrowdHub</strong>
          </a>

          <form class="header-search" id="headerSearchForm" role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"></path></svg>
            <input id="headerSearchInput" placeholder="${tr("Поиск задач, навыков, компаний…", "Search tasks, skills, companies…")}" autocomplete="off">
            <kbd>/</kbd>
          </form>

          <div class="header-actions">
            ${user ? `<a class="header-balance" href="${currentHref}" title="${tr("Баланс CrowdTokens", "CrowdTokens balance")}">${formatPrice(user.wallet)}</a>` : ""}
            ${headerPrimaryAction(user)}
            ${renderLanguageSwitchButton()}
            <a class="header-icon-button header-chat-button" href="${user ? "messages.html" : "login.html"}" aria-label="${tr("Чаты", "Chats")}">
              <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 10h8M8 14h5"/></svg>
              ${user ? `<span class="chat-unread-dot"></span>` : ""}
            </a>
            <button class="header-icon-button" id="notificationButton" aria-label="${tr("Уведомления", "Notifications")}">
              <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>
              <span class="notification-count">${notificationCount}</span>
            </button>
            <a href="${currentHref}" class="header-avatar" aria-label="${user ? escapeHTML(user.name) : tr("Войти", "Sign in")}">${initial}</a>
          </div>
        </div>
      </div>
    </header>`;

  renderNotificationModal(user, reviewing, open);
  bindLanguageSwitchers();

  document.getElementById("headerSearchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const query = document.getElementById("headerSearchInput").value.trim();
    navigateTo(`orders.html?q=${encodeURIComponent(query)}`);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
      event.preventDefault();
      document.getElementById("headerSearchInput")?.focus();
    }
  }, { once: false });

  document.getElementById("notificationButton")?.addEventListener("click", openNotificationModal);
}

function orderCard(order) {
  const user = getCurrentUser();
  const favorite = user?.favorites?.includes(order.id);

  return `<article class="surface-card order-card">
    <a href="order.html?id=${order.id}" class="order-cover-link">${taskCover(order)}</a>
    <div class="order-card-body">
      <div class="order-card-head">
        <div class="order-title-wrap">
          <div class="order-company">${escapeHTML(order.company)} / ${escapeHTML(categoryLabel(order.category))}</div>
          <h3><a href="order.html?id=${order.id}">${escapeHTML(order.title)}</a></h3>
        </div>
        <span class="order-status status-${order.status}"><i></i>${getStatusText(order.status)}</span>
      </div>
      <p class="order-description">${escapeHTML(order.description)}</p>
      <div class="tag-list">${order.skills.slice(0, 4).map(skill => `<span class="skill-tag">${escapeHTML(skill)}</span>`).join("")}</div>
      <div class="order-meta">
        <div class="repo-meta order-reward">${formatPrice(order.price)}</div>
        <div class="repo-meta">◉ ${order.submissions.length} ${tr("решений", "submissions")}</div>
        <div class="repo-meta">♡ ${order.favorites || 0}</div>
      </div>
      <div class="order-actions">
        <a class="btn btn-secondary" href="order.html?id=${order.id}">${tr("Открыть задачу", "Open task")}</a>
        ${user ? `<button class="icon-action favorite-button" data-order="${order.id}" aria-label="${tr("Избранное", "Saved")}">${favorite ? "♥" : "♡"}</button>` : ""}
      </div>
    </div>
  </article>`;
}

function featuredOrderCard(order) {
  return `<a class="featured-offer" href="order.html?id=${order.id}">
    ${taskCover(order, true)}
    <div class="featured-offer-copy"><span>${escapeHTML(order.company)}</span><strong>${escapeHTML(order.title)}</strong><div>${formatPrice(order.price)}<small>${order.submissions.length} ${tr("решений", "submissions")}</small></div></div>
  </a>`;
}

function toggleFavorite(id) {
  const user = getCurrentUser();
  if (!user) {
    navigateTo("login.html");
    return false;
  }

  user.favorites ||= [];
  const order = orders.find(item => item.id === id);
  const index = user.favorites.indexOf(id);

  if (index >= 0) {
    user.favorites.splice(index, 1);
    if (order) order.favorites = Math.max(0, (order.favorites || 0) - 1);
  } else {
    user.favorites.push(id);
    if (order) order.favorites = (order.favorites || 0) + 1;
  }

  saveUsers();
  saveOrders();
  return user.favorites.includes(id);
}

function bindFavoriteButtons() {
  document.querySelectorAll(".favorite-button").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      const state = toggleFavorite(Number(button.dataset.order));
      if (document.body.dataset.page === "favorites") {
        initFavoritesPage();
        return;
      }
      button.textContent = button.closest(".order-card")
        ? (state ? "♥" : "♡")
        : (state ? tr("♥ В избранном", "♥ Saved") : tr("♡ В избранное", "♡ Save"));
      toast(state ? tr("Добавлено в избранное", "Saved") : tr("Удалено из избранного", "Removed from saved"));
    });
  });
}


// Only valid VK profile URLs are rendered as external contact links.
function vkContactMarkup(value) {
  if (!isVkProfileLink(value)) return "";
  return `<a class="vk-contact-link" href="${escapeHTML(String(value).trim())}" target="_blank" rel="noopener noreferrer">${tr("ВКонтакте ↗", "VK ↗")}</a>`;
}
