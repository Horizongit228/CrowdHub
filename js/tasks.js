function populateCompanyFilter(select) {
  if (!select) return;
  const current = select.value || "all";
  const companies = [...new Set(orders.map(order => order.company).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ru"));
  select.innerHTML = `<option value="all">${tr("Все компании", "All companies")}</option>${companies.map(company => `<option value="${escapeHTML(company)}">${escapeHTML(company)}</option>`).join("")}`;
  if (["all", ...companies].includes(current)) select.value = current;
}

function filterOrders({ search, category, company, status, sort, activeSkill = "" }) {
  let result = [...orders];
  const query = (search?.value || "").trim().toLowerCase();
  if (query) result = result.filter(order => order.title.toLowerCase().includes(query) || order.company.toLowerCase().includes(query) || order.skills.join(" ").toLowerCase().includes(query));
  if (category?.value && category.value !== "all") result = result.filter(order => order.category === category.value);
  if (company?.value && company.value !== "all") result = result.filter(order => order.company === company.value);
  if (status?.value && status.value !== "all") result = result.filter(order => order.status === status.value);
  if (activeSkill) result = result.filter(order => order.skills.some(skill => skill.toLowerCase().includes(activeSkill.toLowerCase())));
  const sortValue = sort?.value || "newest";
  if (sortValue === "newest") result.sort((a,b)=>b.createdAt-a.createdAt);
  if (sortValue === "price_desc") result.sort((a,b)=>b.price-a.price);
  if (sortValue === "price_asc") result.sort((a,b)=>a.price-b.price);
  if (sortValue === "popular") result.sort((a,b)=>((b.favorites||0) + b.submissions.length*6)-((a.favorites||0) + a.submissions.length*6));
  return result;
}

function popularCompanyData() {
  const map = new Map();
  orders.forEach(order => {
    if (!map.has(order.company)) map.set(order.company, { name: order.company, tasks: 0, active: 0, favorites: 0, submissions: 0, reward: 0, categories: {} });
    const item = map.get(order.company);
    item.tasks += 1;
    item.active += ["open","in_review"].includes(order.status) ? 1 : 0;
    item.favorites += order.favorites || 0;
    item.submissions += order.submissions.length;
    item.reward += order.price || 0;
    item.categories[order.category] = (item.categories[order.category] || 0) + 1;
  });
  return [...map.values()].map(item => {
    item.topCategory = Object.entries(item.categories).sort((a,b)=>b[1]-a[1])[0]?.[0] || "Разработка";
    item.score = item.favorites + item.submissions * 7 + item.active * 4;
    return item;
  }).sort((a,b)=>b.score-a.score || b.reward-a.reward);
}

function companyCarouselCard(company) {
  const initials = company.name.split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
  const slug = ({"Разработка":"dev","Дизайн":"design","Маркетинг":"marketing","Аналитика":"analytics","Контент":"content"})[company.topCategory] || "dev";
  return `<a class="popular-company-card company-card-${slug}" href="orders.html?company=${encodeURIComponent(company.name)}">
    <span class="company-card-glow"></span>
    <div class="popular-company-top"><span class="popular-company-logo">${escapeHTML(initials)}</span><span class="popular-company-arrow">↗</span></div>
    <div class="popular-company-copy"><span>${escapeHTML(categoryLabel(company.topCategory))}</span><strong>${escapeHTML(company.name)}</strong><p>${tr("Задачи для студентов и начинающих специалистов", "Tasks for students and early-career specialists")}</p></div>
    <div class="popular-company-stats"><span><b>${company.active}</b>${tr("активных", "active")}</span><span><b>${company.tasks}</b>${tr("задач", "tasks")}</span><span><b>♡ ${company.favorites}</b>${tr("интерес", "interest")}</span></div>
  </a>`;
}

function initCompanyCarousel() {
  const track = document.getElementById("popularCompanies");
  if (!track) return;
  track.innerHTML = popularCompanyData().map(companyCarouselCard).join("");
  const step = () => Math.max(280, Math.min(track.clientWidth * .72, 720));
  document.getElementById("companiesPrev")?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  document.getElementById("companiesNext")?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
}

function initHome() {
  const grid = document.getElementById("homeCatalogGrid");
  if (!grid) return;
  initCompanyCarousel();

  const search = document.getElementById("homeOrdersSearch");
  const category = document.getElementById("homeOrdersCategory");
  const company = document.getElementById("homeOrdersCompany");
  const status = document.getElementById("homeOrdersStatus");
  const sort = document.getElementById("homeOrdersSort");
  const count = document.getElementById("homeOrdersCount");
  const empty = document.getElementById("homeOrdersEmpty");
  populateCompanyFilter(company);
  const render = () => {
    const result = filterOrders({search,category,company,status,sort});
    count.textContent = result.length;
    grid.innerHTML = result.slice(0,9).map(orderCard).join("");
    empty.classList.toggle("show", !result.length);
    bindFavoriteButtons();
  };
  [search,category,company,status,sort].forEach(el=>{el?.addEventListener("input",render);el?.addEventListener("change",render)});
  render();
}

function initOrdersPage() {
  const grid = document.getElementById("ordersGrid");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const search = document.getElementById("ordersSearch");
  const category = document.getElementById("ordersCategory");
  const company = document.getElementById("ordersCompany");
  const status = document.getElementById("ordersStatus");
  const sort = document.getElementById("ordersSort");
  const skillLabel = document.getElementById("activeSkillLabel");
  let activeSkill = "";
  let view = localStorage.getItem("crowdhub_catalog_view") === "list" ? "list" : "grid";
  populateCompanyFilter(company);
  search.value = params.get("q") || "";
  if (params.get("category")) category.value = params.get("category");
  if (params.get("company") && [...company.options].some(option => option.value === params.get("company"))) company.value = params.get("company");
  if (params.get("status")) status.value = params.get("status");

  function applyView() {
    grid.classList.toggle("orders-list-view", view === "list");
    document.querySelectorAll("[data-catalog-view]").forEach(button=>button.classList.toggle("active",button.dataset.catalogView===view));
  }
  function render() {
    const result = filterOrders({search,category,company,status,sort,activeSkill});
    document.getElementById("ordersCount").textContent = result.length;
    const filters = [];
    if (company.value !== "all") filters.push(company.value);
    if (activeSkill) filters.push(tr(`навык: ${activeSkill}`, `skill: ${activeSkill}`));
    skillLabel.textContent = filters.length ? `· ${filters.join(" · ")}` : "";
    const empty = document.getElementById("ordersEmpty");
    grid.innerHTML = result.map(orderCard).join("");
    empty.classList.toggle("show", !result.length);
    bindFavoriteButtons();
    applyView();
  }
  [search,category,company,status,sort].forEach(element=>{element.addEventListener("input",render);element.addEventListener("change",render)});
  document.querySelectorAll("#quickSkills [data-skill]").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll("#quickSkills button").forEach(item=>item.classList.remove("active"));
    activeSkill = activeSkill === button.dataset.skill ? "" : button.dataset.skill;
    if(activeSkill) button.classList.add("active");
    render();
  }));
  document.getElementById("clearQuickSkill")?.addEventListener("click",()=>{activeSkill="";document.querySelectorAll("#quickSkills button").forEach(x=>x.classList.remove("active"));render()});
  document.querySelectorAll("[data-catalog-view]").forEach(button=>button.addEventListener("click",()=>{view=button.dataset.catalogView;localStorage.setItem("crowdhub_catalog_view",view);applyView()}));
  render();
}

function timelineMarkup(order) {
  const hasSolutions = order.submissions.length > 0;
  const paid = order.status === "paid";

  return `<section class="task-timeline">
    <span class="section-caption">${tr("ХРОНОЛОГИЯ ЗАДАЧИ", "TASK TIMELINE")}</span>
    <h2>${tr("Ход задачи", "Task progress")}</h2>
    <div class="timeline-list">
      <div class="timeline-item"><span class="timeline-dot"></span><div><strong>${tr("Задача опубликована", "Task published")}</strong><span>${tr("Работодатель зарезервировал бюджет", "Employer reserved the budget")}</span></div></div>
      <div class="timeline-item ${hasSolutions ? "" : "pending"}"><span class="timeline-dot"></span><div><strong>${tr("Получен первый результат", "First submission received")}</strong><span>${hasSolutions ? tr(`Всего решений: ${order.submissions.length}`, `Total submissions: ${order.submissions.length}`) : tr("Ожидается первое решение", "Waiting for the first submission")}</span></div></div>
      <div class="timeline-item ${paid ? "" : "pending"}"><span class="timeline-dot"></span><div><strong>${tr("Выбран победитель", "Winner selected")}</strong><span>${paid ? tr("Вознаграждение выплачено", "Reward paid") : tr("Ещё не завершено", "Not completed yet")}</span></div></div>
    </div>
  </section>`;
}

function initOrderPage() {
  const root = document.getElementById("orderPageRoot");
  if (!root) return;

  const id = Number(new URLSearchParams(location.search).get("id"));
  const order = orders.find(item => item.id === id);

  if (!order) {
    root.innerHTML = `<div class="glass empty-state show"><strong>${tr("Задача не найдена", "Task not found")}</strong><a href="orders.html">${tr("Вернуться в каталог", "Back to catalog")}</a></div>`;
    return;
  }

  function render() {
    const user = getCurrentUser();
    const isOwner = user && order.ownerId === user.id;
    const favorite = user?.favorites?.includes(order.id);
    const canSubmit = user?.role === "performer" && order.status !== "paid" && order.status !== "cancelled";
    const canCancel = isOwner && order.status !== "paid" && order.status !== "cancelled" && order.submissions.length === 0;

    root.innerHTML = `<div class="order-layout">
      <article class="glass order-main">
        ${taskCover(order, true)}
        <div class="order-page-company">${escapeHTML(order.company)} · ${escapeHTML(categoryLabel(order.category))}</div>
        <h1 class="order-page-title">${escapeHTML(order.title)}</h1>
        <span class="order-status status-${order.status}"><i></i>${getStatusText(order.status)}</span>
        <p class="order-page-description">${escapeHTML(order.description)}</p>
        <div class="tag-list big-tags">${order.skills.map(skill => `<span class="skill-tag">${escapeHTML(skill)}</span>`).join("")}</div>
        <div class="order-info-grid">
          <div class="info-box"><span>${tr("Категория", "Category")}</span><strong>${escapeHTML(categoryLabel(order.category))}</strong></div>
          <div class="info-box"><span>${tr("Получено решений", "Submissions")}</span><strong>${order.submissions.length}</strong></div>
          <div class="info-box"><span>${tr("В избранном", "Saved by")}</span><strong>${order.favorites}</strong></div>
        </div>
        ${timelineMarkup(order)}
        <section class="submissions-section">
          <h2>${tr("Результаты исполнителей", "Contributor submissions")}</h2>
          ${order.submissions.length ? order.submissions.map(solution => `
            <article class="submission-card">
              <div class="submission-header">
                <div><strong>${escapeHTML(solution.author)}</strong><div class="submission-link">${vkContactMarkup(solution.contact) || tr("Ссылка ВК не указана", "VK link not provided")}</div></div>
                ${solution.winner ? `<span class="winner-pill"><i></i>${tr("Победитель", "Winner")}</span>` : (isOwner && order.status !== "paid" ? `<button class="btn btn-glass choose-winner" data-solution="${solution.id}">${tr("Выбрать", "Select")}</button>` : "")}
              </div>
              <p>${escapeHTML(solution.comment)}</p>
              <div class="submission-deliverables">
                ${solution.link ? `<a class="submission-link" href="${escapeHTML(solution.link)}" target="_blank" rel="noopener">${tr("Открыть GitHub / ссылку →", "Open GitHub / link →")}</a>` : ""}
                ${solution.fileName ? (solution.fileKey ? `<button type="button" class="zip-attachment zip-download" data-download-file="${escapeHTML(solution.fileKey)}" data-file-name="${escapeHTML(solution.fileName)}" title="${tr("Скачать ZIP", "Download ZIP")}"><b>ZIP</b><span>${escapeHTML(solution.fileName)}</span><small>${solution.fileSize ? `${Math.max(1, Math.round(solution.fileSize / 1024))} КБ` : ""}</small><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></button>` : `<span class="zip-attachment zip-unavailable" title="${tr("Файл был добавлен в старой версии прототипа и не сохранён локально", "This file came from an older prototype version and is not stored locally")}"><b>ZIP</b><span>${escapeHTML(solution.fileName)}</span><small>${solution.fileSize ? `${Math.max(1, Math.round(solution.fileSize / 1024))} КБ` : ""}</small></span>`) : ""}
              </div>
            </article>`).join("") : `<p class="order-page-description">${tr("Пока никто не отправил решение. Ты можешь стать первым.", "No one has submitted a solution yet. You can be the first.")}</p>`}
        </section>
      </article>

      <aside>
        <div class="glass order-sidebar-card">
          <div class="reward-box"><span>${tr("Вознаграждение", "Reward")}</span><strong>${formatPrice(order.price)}</strong></div>
          <div class="employer-box"><span>${tr("Заказчик", "Employer")}</span><strong>${escapeHTML(order.company)}</strong></div>
          <div class="employer-box seller-rating-box"><span>${tr("Рейтинг продавца", "Seller rating")}</span><div class="seller-rating-line"><strong>★ ${employerRating(order).value}</strong><small>${tr(`${employerRating(order).count} отзывов`, `${employerRating(order).count} reviews`)}</small></div></div>
          <div class="sidebar-actions">
            ${canSubmit ? `<button class="btn btn-primary" id="openSubmission">${tr("Отправить результат", "Submit result")}</button>` : ""}
            ${user ? `<button class="btn btn-glass favorite-button" data-order="${order.id}">${favorite ? tr("♥ В избранном", "♥ Saved") : tr("♡ В избранное", "♡ Save")}</button>` : `<a class="btn btn-primary" href="login.html">${tr("Войти", "Sign in")}</a>`}
            ${canCancel ? `<button class="btn danger-button" id="cancelOrderButton">${tr("Отменить задачу", "Cancel task")}</button>` : ""}
          </div>
          ${order.submissions.length ? `<div class="security-banner"><div class="security-icon">✓</div><div><strong>${tr("Отмена заблокирована", "Cancellation locked")}</strong><p>${tr("Уже получено хотя бы одно решение.", "At least one submission has already been received.")}</p></div></div>` : ""}
        </div>
      </aside>
    </div>`;

    bindFavoriteButtons();
    bindSubmissionFileDownloads(root);
    renderEmployerChat(order);

    document.getElementById("openSubmission")?.addEventListener("click", () => openModalElement(document.getElementById("submissionModal")));

    document.getElementById("cancelOrderButton")?.addEventListener("click", () => {
      if (order.submissions.length) {
        toast(tr("Отмена уже заблокирована", "Cancellation is already locked"));
        return;
      }
      const owner = users.find(item => item.id === order.ownerId);
      if (owner) {
        owner.wallet += order.price;
        saveUsers();
      }
      order.status = "cancelled";
      saveOrders();
      addHistory(tr(`Отменена задача «${order.title}»`, `Task “${order.title}” was cancelled`));
      toast(tr("Задача отменена. Средства возвращены.", "Task cancelled. Funds returned."));
      setTimeout(() => navigateTo("orders.html"), 800);
    });

    document.querySelectorAll(".choose-winner").forEach(button => {
      button.addEventListener("click", () => {
        const solution = order.submissions.find(item => item.id === Number(button.dataset.solution));
        if (!solution) return;
        order.submissions.forEach(item => item.winner = item.id === solution.id);
        order.status = "paid";
        const winner = users.find(item => item.id === solution.userId);
        if (winner) {
          winner.wallet += order.price;
          saveUsers();
        }
        saveOrders();
        addHistory(tr(`В задаче «${order.title}» выбран победитель: ${solution.author}`, `Winner selected for “${order.title}”: ${solution.author}`));
        toast(tr("Победитель выбран", "Winner selected"));
        render();
      });
    });
  }

  const solutionZipInput = document.getElementById("solutionZip");
  solutionZipInput?.addEventListener("change", () => {
    const file = solutionZipInput.files?.[0];
    const label = document.getElementById("solutionZipName");
    if (label) label.textContent = file ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} КБ` : tr("до 25 МБ · исходники, макеты или готовый проект", "up to 25 MB · source files, layouts or a finished project");
  });

  document.getElementById("submissionForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = document.getElementById("submissionSubmitButton") || form.querySelector('button[type="submit"]');
    const status = document.getElementById("submissionSubmitStatus");
    const originalButtonText = submitButton?.textContent || tr("Отправить результат", "Submit result");
    const setBusy = (busy, text = "") => {
      if (submitButton) {
        submitButton.disabled = busy;
        submitButton.classList.toggle("is-loading", busy);
        submitButton.textContent = busy ? text : originalButtonText;
      }
    };
    const setStatus = text => { if (status) status.textContent = text; };

    const user = getCurrentUser();
    if (!user) {
      navigateTo("login.html");
      return;
    }
    if (order.submissions.some(solution => solution.userId === user.id)) {
      toast(tr("Ты уже отправлял решение", "You already submitted a solution"));
      return;
    }

    const solutionLink = document.getElementById("solutionLink").value.trim();
    const zipFile = document.getElementById("solutionZip")?.files?.[0] || null;
    if (!solutionLink && !zipFile) {
      toast(tr("Добавь ссылку или ZIP-архив", "Add a link or ZIP archive"));
      return;
    }
    if (zipFile && !zipFile.name.toLowerCase().endsWith(".zip")) {
      toast(tr("Можно прикрепить только ZIP-архив", "Only ZIP archives can be attached"));
      return;
    }
    if (zipFile && zipFile.size > 25 * 1024 * 1024) {
      toast(tr("ZIP слишком большой. Максимум 25 МБ", "ZIP is too large. Maximum 25 MB"));
      return;
    }

    const submissionId = Date.now();
    let fileKey = "";
    setBusy(true, zipFile ? tr("Сохраняем ZIP…", "Saving ZIP…") : tr("Отправляем…", "Submitting…"));
    setStatus(zipFile ? tr("Архив сохраняется локально. Не закрывай окно.", "Saving the archive locally. Keep this window open.") : "");

    try {
      if (zipFile) {
        fileKey = await storeSubmissionFile(zipFile, order.id, submissionId);
      }

      const submission = {
        id: submissionId,
        userId: user.id,
        author: user.name,
        contact: user.contact,
        link: solutionLink,
        fileName: zipFile?.name || "",
        fileSize: zipFile?.size || 0,
        fileKey,
        comment: document.getElementById("solutionComment").value.trim(),
        winner: false
      };

      order.submissions.push(submission);
      if (order.status === "open") order.status = "in_review";
      try {
        saveOrders();
        appendSubmissionToChat(order, submission);
        addHistory(tr(`Отправлено решение на задачу «${order.title}»`, `Submitted a solution for “${order.title}”`), user.id);
      } catch (error) {
        // Roll the in-memory change back if localStorage could not be updated.
        order.submissions = order.submissions.filter(item => item.id !== submissionId);
        if (!order.submissions.length && order.status === "in_review") order.status = "open";
        if (fileKey) {
          try { await deleteStoredFile(fileKey); } catch {}
        }
        throw error;
      }

      closeModalElement(document.getElementById("submissionModal"));
      form.reset();
      const zipName = document.getElementById("solutionZipName");
      if (zipName) zipName.textContent = tr("до 25 МБ · исходники, макеты или готовый проект", "up to 25 MB · source files, layouts or a finished project");
      setStatus("");
      toast(tr("Результат отправлен. Отмена задачи теперь заблокирована.", "Result submitted. Task cancellation is now locked."));
      render();
    } catch (error) {
      console.error("Submission failed", error);
      if (error?.code === "quota" || error?.name === "QuotaExceededError") {
        toast(tr("Браузеру не хватает места для этого ZIP. Выбери архив поменьше или добавь ссылку на GitHub.", "There is not enough browser storage for this ZIP. Choose a smaller archive or add a GitHub link."));
      } else if (error?.code === "blocked") {
        toast(tr("Хранилище файлов занято другой вкладкой CrowdHub. Закрой её и попробуй снова.", "File storage is busy in another CrowdHub tab. Close it and try again."));
      } else {
        toast(tr("Не удалось отправить решение. Попробуй ещё раз.", "Could not submit the solution. Please try again."));
      }
      setStatus(tr("Решение не отправлено — можно попробовать ещё раз.", "The solution was not submitted — you can try again."));
    } finally {
      setBusy(false);
    }
  });

  render();
}

function bindModals() {
  document.querySelectorAll("[data-modal-close]").forEach(button => {
    button.addEventListener("click", () => closeModalElement(button.closest(".modal-overlay")));
  });
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModalElement(modal);
    });
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const opened = document.querySelector(".modal-overlay.show");
    if (opened) closeModalElement(opened);
  });
}

function previewMarkup() {
  const title = document.getElementById("newOrderTitle")?.value.trim() || tr("Название будущей задачи", "Future task title");
  const category = document.getElementById("newOrderCategory")?.value || "Разработка";
  const price = Number(document.getElementById("newOrderPrice")?.value) || 0;
  const description = document.getElementById("newOrderDescription")?.value.trim() || tr("Описание появится здесь по мере заполнения формы.", "The description will appear here as you fill in the form.");
  const skills = (document.getElementById("newOrderSkills")?.value || "").split(",").map(item => item.trim()).filter(Boolean);

  return `<div class="preview-placeholder">
    <div class="preview-company">${escapeHTML(getCurrentUser()?.name || tr("Компания", "Company"))} · ${escapeHTML(categoryLabel(category))}</div>
    <h3>${escapeHTML(title)}</h3>
    <p>${escapeHTML(description)}</p>
    <div class="tag-list">${skills.slice(0, 4).map(skill => `<span class="skill-tag">${escapeHTML(skill)}</span>`).join("")}</div>
    <div class="preview-price">${formatPrice(price)}</div>
  </div>`;
}

function initCreateOrder() {
  const form = document.getElementById("createOrderForm");
  if (!form) return;

  const user = getCurrentUser();
  if (!user || user.role !== "company") {
    document.getElementById("createOrderRoot").innerHTML = `<div class="empty-state show"><strong>${tr("Только для работодателей", "Employers only")}</strong><span>${tr("Войди под аккаунтом компании.", "Sign in with a company account.")}</span><a href="login.html" class="btn btn-primary">${tr("Войти", "Sign in")}</a></div>`;
    document.querySelector(".live-preview-card")?.remove();
    return;
  }

  const preview = document.getElementById("orderLivePreview");
  const walletPreview = document.getElementById("walletPreview");
  const budgetAdvice = document.getElementById("budgetAdvice");

  function updatePreview() {
    preview.innerHTML = previewMarkup();
    walletPreview.innerHTML = `${tr("Баланс", "Balance")}: ${formatPrice(user.wallet)}`;
    const category = document.getElementById("newOrderCategory").value;
    budgetAdvice.innerHTML = ({
      Разработка: formatPriceRange(10000,25000),
      Дизайн: formatPriceRange(6000,15000),
      Маркетинг: formatPriceRange(5000,12000),
      Аналитика: formatPriceRange(7000,18000),
      Контент: formatPriceRange(3000,9000)
    })[category];
  }

  ["newOrderTitle", "newOrderCategory", "newOrderPrice", "newOrderDescription", "newOrderSkills"].forEach(id => {
    const element = document.getElementById(id);
    element?.addEventListener("input", updatePreview);
    element?.addEventListener("change", updatePreview);
  });

  updatePreview();

  form.addEventListener("submit", event => {
    event.preventDefault();
    const price = Number(document.getElementById("newOrderPrice").value);
    if (user.wallet < price) {
      toast(tr("Недостаточно средств в кошельке", "Not enough funds in your wallet"));
      return;
    }

    const order = {
      id: Date.now(),
      ownerId: user.id,
      company: user.name,
      contact: user.contact,
      title: document.getElementById("newOrderTitle").value.trim(),
      category: document.getElementById("newOrderCategory").value,
      description: document.getElementById("newOrderDescription").value.trim(),
      skills: document.getElementById("newOrderSkills").value.split(",").map(skill => skill.trim()).filter(Boolean),
      price,
      status: "open",
      favorites: 0,
      createdAt: Date.now(),
      submissions: [],
      reviews: []
    };

    user.wallet -= price;
    orders.unshift(order);
    saveUsers();
    saveOrders();
    addHistory(tr(`Создана задача «${order.title}»`, `Created task “${order.title}”`), user.id);
    navigateTo(`order.html?id=${order.id}`);
  });
}

