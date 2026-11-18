function navigateTo(url) {
  if (!url) return;
  document.body.classList.add("page-leaving");
  setTimeout(() => { location.href = url; }, 180);
}

function bindSmoothNavigation() {
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    const raw = link.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (url.origin !== location.origin && location.protocol !== "file:") return;
    if (url.href === location.href) return;
    event.preventDefault();
    navigateTo(link.href);
  });
}

function islandSvg(name) {
  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.2v-6.2H9.2V21H4a1 1 0 0 1-1-1z"/><path d="M9.2 21h5.6"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>',
    updates: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    saved: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>'
  };
  return icons[name] || icons.home;
}

function islandPageIndex(page) {
  if (page === "order") return 1;
  if (page === "orders" || page === "company-tasks") return 1;
  if (page === "company-submissions") return 3;
  if (page === "company" || page === "company-chats" || page === "messages") return 4;
  if (page === "favorites") return 3;
  if (page === "profile" || page === "register") return 4;
  return 0;
}

function setIslandIndex(index, temporary = false) {
  const island = document.querySelector(".bottom-island");
  if (!island) return;
  island.style.setProperty("--island-index", String(index));
  island.querySelectorAll(".island-item").forEach((item, itemIndex) => item.classList.toggle("active", itemIndex === index));
  if (!temporary) island.dataset.baseIndex = String(index);
}

function restoreIslandIndex() {
  const island = document.querySelector(".bottom-island");
  if (!island) return;
  setIslandIndex(Number(island.dataset.baseIndex || 0), true);
}

function renderBottomIsland() {
  document.querySelector(".bottom-island")?.remove();
  const user = getCurrentUser();
  const page = document.body.dataset.page;
  if (page === "login" || page === "register" || page === "verify-email") return;
  const activeIndex = islandPageIndex(page);
  const profileHref = user ? (user.role === "company" ? "company.html" : "profile.html") : "login.html";
  const tasksHref = "orders.html";
  const island = document.createElement("nav");
  island.className = "bottom-island";
  island.dataset.baseIndex = String(activeIndex);
  island.style.setProperty("--island-index", String(activeIndex));
  island.setAttribute("aria-label", tr("Основная навигация", "Main navigation"));

  const linkItem = (href, label, iconName) => `<a href="${href}" class="island-item"><span class="island-icon">${islandSvg(iconName)}</span><small>${label}</small></a>`;
  const actionItem = label => `<button type="button" class="island-item" data-open-notifications aria-label="${label}"><span class="island-icon">${islandSvg("updates")}</span><small>${label}</small></button>`;

  island.innerHTML = `
    <span class="island-slider" aria-hidden="true"></span>
    ${linkItem("index.html", tr("Главная", "Home"), "home")}
    ${linkItem(tasksHref, tr("Каталог", "Catalog"), "catalog")}
    ${actionItem(tr("Уведомления", "Notifications"))}
    ${user?.role === "company" ? linkItem("company-submissions.html", tr("Решения", "Submissions"), "saved") : linkItem("favorites.html", tr("Избранное", "Saved"), "saved")}
    ${linkItem(profileHref, user?.role === "company" ? tr("Кабинет", "Workspace") : tr("Профиль", "Profile"), "profile")}
  `;

  document.body.appendChild(island);
  setIslandIndex(activeIndex);

  island.querySelectorAll(".island-item").forEach((item, index) => {
    item.addEventListener("pointerenter", () => island.style.setProperty("--hover-index", String(index)));
    item.addEventListener("pointerleave", () => island.style.removeProperty("--hover-index"));
    if (item.matches("a")) item.addEventListener("click", () => setIslandIndex(index, true));
  });

  island.querySelector("[data-open-notifications]")?.addEventListener("click", () => {
    setIslandIndex(2, true);
    if (document.getElementById("notificationModal")) {
      openNotificationModal();
      return;
    }
    navigateTo(user ? (user.role === "company" ? "company.html" : "profile.html?tab=overview") : "login.html");
  });
}

