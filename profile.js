function levelData(user, myOrders, completed) {
  const xp = (completed * 180) + (myOrders.length * 55) + (user.favorites?.length || 0) * 8;
  const level = Math.max(1, Math.floor(xp / 300) + 1);
  const current = xp % 300;
  return { xp, level, progress: Math.round(current / 300 * 100) };
}

function submissionRowsFor(user) {
  const result = [];
  orders.forEach(order => order.submissions.forEach(submission => {
    if (submission.userId === user.id) result.push({ order, sub: submission });
  }));
  return result;
}

function cropAvatarData(source, zoom = 1, offsetX = 0, offsetY = 0) {
  return new Promise((resolve, reject) => {
    if (!source) return resolve(null);
    const image = new Image();
    image.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const baseScale = Math.max(size / image.width, size / image.height);
      const scale = baseScale * zoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (size - width) / 2 + (offsetX / 100) * size * 0.32;
      const y = (size - height) / 2 + (offsetY / 100) * size * 0.32;
      ctx.fillStyle = "#eef5f1";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, x, y, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    image.onerror = reject;
    image.src = source;
  });
}

function openProfileEditor(user) {
  document.getElementById("profileEditModal")?.remove();
  const modal = document.createElement("div");
  modal.className = "modal-overlay profile-edit-overlay";
  modal.id = "profileEditModal";
  const skillOptions = ["HTML","CSS","JavaScript","TypeScript","React","Vue","Node.js","Python","Java","SQL","Figma","UI","UX","Research","Analytics","Marketing","Copywriting","Telegram Bot"];
  let editSkills = [...(user.skills || [])];
  let avatarSource = user.avatarData || null;
  let removeAvatar = false;

  modal.innerHTML = `<div class="glass modal-card profile-edit-card">
    <button class="modal-close" type="button" data-profile-edit-close>×</button>
    <span class="section-caption">${tr("РЕДАКТИРОВАНИЕ ПРОФИЛЯ", "EDIT PROFILE")}</span>
    <h2>${tr("Настрой профиль под себя", "Make your profile yours")}</h2>
    <form id="profileEditForm">
      <div class="profile-edit-grid">
        <section class="avatar-editor-panel">
          <div class="avatar-mask-wrap"><div class="avatar-crop-frame" id="avatarCropFrame">${avatarSource ? `<img src="${avatarSource}" alt="">` : `<span>${escapeHTML(user.name.charAt(0).toUpperCase())}</span>`}<i></i></div></div>
          <label class="avatar-upload-button">${tr("Загрузить фото", "Upload photo")}<input id="profileAvatarFile" type="file" accept="image/png,image/jpeg,image/webp" hidden></label>
          <button class="text-button avatar-remove-button" id="profileAvatarRemove" type="button">${tr("Удалить фото", "Remove photo")}</button>
          <div class="avatar-crop-controls" id="avatarCropControls" ${avatarSource ? "" : "hidden"}>
            <label><span>${tr("Масштаб", "Zoom")}</span><input id="avatarZoom" type="range" min="1" max="2.8" value="1" step="0.01"></label>
            <label><span>${tr("По горизонтали", "Horizontal")}</span><input id="avatarOffsetX" type="range" min="-100" max="100" value="0" step="1"></label>
            <label><span>${tr("По вертикали", "Vertical")}</span><input id="avatarOffsetY" type="range" min="-100" max="100" value="0" step="1"></label>
          </div>
          <p class="avatar-mask-note">${tr("Круг — это маска будущего аватара. Масштабируй и двигай фото, пока в круг не попадёт нужная область.", "The circle is your avatar mask. Zoom and move the image until the right area fits inside.")}</p>
        </section>
        <section class="profile-edit-fields">
          <div class="two-fields"><label class="form-field"><span>${tr("Имя", "Name")}</span><input id="editProfileName" value="${escapeHTML(user.name)}" required></label><label class="form-field"><span>${tr("Ссылка ВК", "VK profile link")}</span><input id="editProfileContact" type="url" placeholder="https://vk.com/id123456" value="${isVkProfileLink(user.contact) ? escapeHTML(user.contact) : ""}"></label></div>
          <label class="form-field"><span>${tr("О себе", "Bio")}</span><textarea id="editProfileBio" placeholder="${tr("Коротко расскажи о специализации", "Tell people about your specialty")}">${escapeHTML(user.bio || "")}</textarea></label>
          <label class="form-field"><span>${tr("Портфолио", "Portfolio")}</span><input id="editProfilePortfolio" type="url" value="${escapeHTML(user.portfolio || "")}" placeholder="https://github.com/..."></label>
          <div class="profile-skill-editor"><span>${tr("Навыки", "Skills")}</span><div class="skill-picker compact"><select id="editSkillSelect"><option value="">${tr("Добавить навык…", "Add a skill…")}</option>${skillOptions.map(skill => `<option>${skill}</option>`).join("")}</select><button class="btn btn-secondary" id="editAddSkill" type="button">${tr("Добавить", "Add")}</button></div><div class="selected-skills" id="editSelectedSkills"></div></div>
        </section>
      </div>
      <div class="profile-edit-actions"><button class="btn btn-secondary" type="button" data-profile-edit-close>${tr("Отмена", "Cancel")}</button><button class="btn btn-primary" type="submit">${tr("Сохранить изменения", "Save changes")}</button></div>
    </form>
  </div>`;
  document.body.appendChild(modal);
  openModalElement(modal);

  const frame = modal.querySelector("#avatarCropFrame");
  const controls = modal.querySelector("#avatarCropControls");
  const zoom = modal.querySelector("#avatarZoom");
  const offsetX = modal.querySelector("#avatarOffsetX");
  const offsetY = modal.querySelector("#avatarOffsetY");
  const selected = modal.querySelector("#editSelectedSkills");

  function updatePreview() {
    const img = frame.querySelector("img");
    if (!img) return;
    const x = Number(offsetX.value) * 0.55;
    const y = Number(offsetY.value) * 0.55;
    img.style.transform = `translate(${x}px, ${y}px) scale(${Number(zoom.value)})`;
  }

  function renderEditSkills() {
    selected.innerHTML = editSkills.length ? editSkills.map(skill => `<button type="button" class="selected-skill-chip" data-edit-remove-skill="${escapeHTML(skill)}"><span>${escapeHTML(skill)}</span><b>×</b></button>`).join("") : `<span class="skill-picker-empty">${tr("Добавь навыки в профиль", "Add skills to your profile")}</span>`;
    selected.querySelectorAll("[data-edit-remove-skill]").forEach(button => button.addEventListener("click", () => {
      editSkills = editSkills.filter(skill => skill !== button.dataset.editRemoveSkill);
      renderEditSkills();
    }));
  }

  modal.querySelectorAll("[data-profile-edit-close]").forEach(button => button.addEventListener("click", () => closeModalElement(modal)));
  modal.addEventListener("click", event => { if (event.target === modal) closeModalElement(modal); });
  [zoom, offsetX, offsetY].forEach(input => input.addEventListener("input", updatePreview));

  modal.querySelector("#profileAvatarFile").addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) { toast(tr("Фото слишком большое. Максимум 6 МБ", "Image is too large. Maximum 6 MB")); return; }
    const reader = new FileReader();
    reader.onload = () => {
      avatarSource = reader.result;
      removeAvatar = false;
      frame.innerHTML = `<img src="${avatarSource}" alt=""><i></i>`;
      zoom.value = "1"; offsetX.value = "0"; offsetY.value = "0";
      controls.hidden = false;
      updatePreview();
    };
    reader.readAsDataURL(file);
  });

  modal.querySelector("#profileAvatarRemove").addEventListener("click", () => {
    avatarSource = null;
    removeAvatar = true;
    controls.hidden = true;
    frame.innerHTML = `<span>${escapeHTML((modal.querySelector("#editProfileName").value || user.name).charAt(0).toUpperCase())}</span><i></i>`;
  });

  modal.querySelector("#editAddSkill").addEventListener("click", () => {
    const select = modal.querySelector("#editSkillSelect");
    if (select.value && !editSkills.includes(select.value) && editSkills.length < 12) editSkills.push(select.value);
    select.value = "";
    renderEditSkills();
  });

  modal.querySelector("#profileEditForm").addEventListener("submit", async event => {
    event.preventDefault();
    const saveButton = event.submitter;
    const vkInput = modal.querySelector("#editProfileContact");
    if (vkInput.value.trim() && !isVkProfileLink(vkInput.value)) {
      vkInput.setCustomValidity(tr("Введи корректную ссылку ВК", "Enter a valid VK profile link"));
      vkInput.reportValidity();
      vkInput.setCustomValidity("");
      return;
    }
    if (saveButton) saveButton.disabled = true;
    user.name = modal.querySelector("#editProfileName").value.trim();
    user.contact = vkInput.value.trim();
    user.bio = modal.querySelector("#editProfileBio").value.trim();
    user.portfolio = modal.querySelector("#editProfilePortfolio").value.trim();
    user.skills = [...editSkills];
    if (removeAvatar) user.avatarData = null;
    else if (avatarSource) user.avatarData = await cropAvatarData(avatarSource, Number(zoom.value), Number(offsetX.value), Number(offsetY.value));
    saveUsers();
    addHistory(tr("Профиль обновлён", "Profile updated"), user.id);
    closeModalElement(modal);
    toast(tr("Профиль сохранён", "Profile saved"));
    renderHeader();
    initProfile();
  });

  renderEditSkills();
  updatePreview();
}

function initProfile() {
  const root = document.getElementById("profileRoot");
  if (!root) return;

  const user = getCurrentUser();
  if (!user) {
    navigateTo("login.html");
    return;
  }
  if (user.role === "company") {
    navigateTo("company.html");
    return;
  }

  const myOrders = user.role === "company"
    ? orders.filter(order => order.ownerId === user.id)
    : orders.filter(order => order.submissions.some(submission => submission.userId === user.id));

  const completed = user.role === "company"
    ? myOrders.filter(order => order.status === "paid").length
    : myOrders.filter(order => order.submissions.some(submission => submission.userId === user.id && submission.winner)).length;

  const favorites = orders.filter(order => user.favorites?.includes(order.id));
  const submissions = submissionRowsFor(user);
  const allSkills = [...new Set((user.role === "company" ? orders.filter(order => order.ownerId === user.id) : myOrders).flatMap(order => order.skills || []))];
  const skills = ((user.skills && user.skills.length ? user.skills : allSkills.length ? allSkills : ["HTML", "CSS", "JavaScript", "Figma"])).slice(0, 12);
  const rating = Math.min(5, 4.6 + completed * 0.07 + Math.min(myOrders.length, 5) * 0.03).toFixed(1);
  const bio = user.bio || (user.role === "company"
    ? tr("Команда, публикующая реальные задачи для практики и найма.", "A team publishing real tasks for practice and hiring.")
    : tr("Решаю реальные задачи, собираю портфолио и прокачиваю прикладные навыки.", "I solve real tasks, build a portfolio and improve practical skills."));
  const level = levelData(user, myOrders, completed);
  const employerTaskCounts = user.role === "company" ? {
    all: myOrders.length,
    open: myOrders.filter(order => order.status === "open").length,
    in_review: myOrders.filter(order => order.status === "in_review").length,
    paid: myOrders.filter(order => order.status === "paid").length,
    cancelled: myOrders.filter(order => order.status === "cancelled").length
  } : null;

  root.innerHTML = `<div class="dev-profile-layout">
    <aside class="dev-profile-sidebar">
      <div class="dev-avatar">${avatarInner(user)}</div>
      <h1>${escapeHTML(user.name)}</h1>
      <p class="dev-bio">${bio}</p>
      <button class="btn btn-secondary btn-full" id="editProfileButton">${tr("Редактировать профиль", "Edit profile")}</button>
      <div class="dev-rating"><span>${tr("Рейтинг", "Rating")}</span><strong>★ ${rating}</strong></div>
      <div class="dev-sidebar-section"><strong>${tr("Навыки", "Skills")}</strong><div class="dev-skill-list">${skills.map(skill => `<span>${escapeHTML(skill)}</span>`).join("")}</div></div>
      <div class="dev-sidebar-meta"><span>${tr("Уровень", "Level")} <strong>${level.level}</strong></span><span>${level.xp} XP</span><div class="mini-progress"><i style="width:${level.progress}%"></i></div></div>
      <div class="dev-wallet"><span>${tr("Кошелёк", "Wallet")}</span><strong>${formatPrice(user.wallet)}</strong><button class="text-button" id="addMoneyButton">+ ${formatPrice(10000)} ${tr("демо", "demo")}</button></div>
      <button type="button" class="profile-logout-button" id="profileLogoutButton">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"></path></svg>
        <span>${tr("Выйти из аккаунта", "Sign out")}</span>
      </button>
    </aside>

    <section class="dev-profile-main">
      <nav class="profile-tabs" aria-label="${tr("Разделы профиля", "Profile sections")}">
        <button class="profile-tab active" data-profile-tab="overview">${tr("Обзор", "Overview")}</button>
        <button class="profile-tab" data-profile-tab="tasks">${tr("Задачи", "Tasks")} <span>${myOrders.length}</span></button>
        <button class="profile-tab" data-profile-tab="submissions">${tr("Решения", "Submissions")} <span>${submissions.length}</span></button>
        <button class="profile-tab" data-profile-tab="saved">${tr("Избранное", "Saved")} <span>${favorites.length}</span></button>
        <button class="profile-tab" data-profile-tab="groups">${tr("Группы", "Groups")}</button>
      </nav>

      <div class="profile-panel active" data-profile-panel="overview">
        <div class="profile-overview-stats">
          <div><strong>${myOrders.length}</strong><span>${user.role === "company" ? tr("опубликовано задач", "tasks published") : tr("участий в задачах", "tasks joined")}</span></div>
          <div><strong>${completed}</strong><span>${user.role === "company" ? tr("завершено", "completed") : tr("побед", "wins")}</span></div>
          <div><strong>${favorites.length}</strong><span>${tr("сохранено", "saved")}</span></div>
          <div><strong>${rating}</strong><span>${tr("рейтинг", "rating")}</span></div>
        </div>
        <section class="profile-box profile-chat-hint"><div class="profile-box-head"><h2>${tr("Сообщения", "Messages")}</h2><span>CrowdHub</span></div><p class="empty-copy">${tr("Чаты с заказчиками и поддержкой теперь находятся в общем центре сообщений.", "Employer chats and support now live in the unified message center.")}</p><a class="btn btn-secondary btn-compact" href="messages.html">${tr("Открыть сообщения", "Open messages")}</a></section>
      </div>

      <div class="profile-panel" data-profile-panel="tasks">
        ${user.role === "company" ? `
          <div class="employer-tasks-shell">
            <div class="employer-tasks-head">
              <div>
                <span class="section-caption">${tr("РАБОЧИЙ КАБИНЕТ", "EMPLOYER WORKSPACE")}</span>
                <h2>${tr("Мои задачи", "My tasks")}</h2>
                <p>${tr("Управляй публикациями, следи за решениями и закрывай задачи в одном месте.", "Manage publications, review submissions and complete tasks in one place.")}</p>
              </div>
              <a href="create-order.html" class="btn btn-primary btn-compact">${tr("Новая задача", "New task")}</a>
            </div>

            <div class="employer-task-metrics">
              <div><span>${tr("Всего", "Total")}</span><strong>${employerTaskCounts.all}</strong></div>
              <div><span>${tr("Открытые", "Open")}</span><strong>${employerTaskCounts.open}</strong></div>
              <div><span>${tr("На проверке", "Reviewing")}</span><strong>${employerTaskCounts.in_review}</strong></div>
              <div><span>${tr("Завершённые", "Completed")}</span><strong>${employerTaskCounts.paid}</strong></div>
            </div>

            <div class="employer-task-tabs" role="tablist" aria-label="${tr("Фильтры задач", "Task filters")}">
              <button class="employer-task-tab active" data-task-filter="all">${tr("Все", "All")} <span>${employerTaskCounts.all}</span></button>
              <button class="employer-task-tab" data-task-filter="open">${tr("Открытые", "Open")} <span>${employerTaskCounts.open}</span></button>
              <button class="employer-task-tab" data-task-filter="in_review">${tr("На проверке", "Reviewing")} <span>${employerTaskCounts.in_review}</span></button>
              <button class="employer-task-tab" data-task-filter="paid">${tr("Завершённые", "Completed")} <span>${employerTaskCounts.paid}</span></button>
              <button class="employer-task-tab" data-task-filter="cancelled">${tr("Отменённые", "Cancelled")} <span>${employerTaskCounts.cancelled}</span></button>
            </div>

            <div class="employer-task-list" id="employerTaskList">
              ${myOrders.length ? myOrders.map(order => `<div class="employer-task-wrap" data-employer-task-status="${order.status}">${orderCard(order)}</div>`).join("") : `<div class="employer-task-empty">${tr("Задач пока нет. Создай первую публикацию.", "No tasks yet. Create your first task.")}</div>`}
            </div>
          </div>
        ` : `<div class="profile-box"><div class="profile-box-head"><h2>${tr("Задачи", "Tasks")}</h2></div>${myOrders.length ? `<div class="orders-grid profile-orders-grid">${myOrders.map(orderCard).join("")}</div>` : `<p class="empty-copy">${tr("Задач пока нет.", "No tasks yet.")}</p>`}</div>`}
      </div>

      <div class="profile-panel" data-profile-panel="submissions"><div class="profile-box"><div class="profile-box-head"><h2>${tr("Решения", "Submissions")}</h2><span>${tr(`${submissions.length} всего`, `${submissions.length} total`)}</span></div><div class="submission-profile-list">${submissions.length ? submissions.map(({ order, sub }) => `<a href="order.html?id=${order.id}" class="submission-profile-row"><div><strong>${escapeHTML(order.title)}</strong><span>${escapeHTML(order.company)} · ${escapeHTML(sub.comment)}</span></div>${sub.winner ? `<span class="winner-pill"><i></i>${tr("Победитель", "Winner")}</span>` : `<span class="order-status status-${order.status}"><i></i>${getStatusText(order.status)}</span>`}</a>`).join("") : `<p class="empty-copy">${tr("Решений пока нет.", "No submissions yet.")}</p>`}</div></div></div>

      <div class="profile-panel" data-profile-panel="saved"><div class="profile-box"><div class="profile-box-head"><h2>${tr("Сохранённые задачи", "Saved tasks")}</h2><span>${favorites.length}</span></div>${favorites.length ? `<div class="orders-grid profile-orders-grid">${favorites.map(orderCard).join("")}</div>` : `<p class="empty-copy">${tr("Пока ничего не сохранено.", "Nothing saved yet.")}</p>`}</div></div>

      <div class="profile-panel" data-profile-panel="groups"><div class="profile-box"><div class="profile-box-head"><h2>${tr("Группы", "Groups")}</h2><span>${tr("Работайте вместе", "Work together")}</span></div><form id="groupForm" class="group-inline-form"><label class="form-field"><span>${tr("Название", "Name")}</span><input id="groupName" placeholder="Frontend Team" required></label><label class="form-field"><span>${tr("Участники", "Members")}</span><input id="groupMembers" placeholder="Аня, Илья, Максим" required></label><button class="btn btn-primary">${tr("Создать группу", "Create group")}</button></form><div class="groups-list" id="groupsList"></div></div></div>
    </section>
  </div>`;

  bindFavoriteButtons();

  const setProfileTab = name => {
    const safeName = name || "overview";
    document.querySelectorAll("[data-profile-tab]").forEach(item => item.classList.toggle("active", item.dataset.profileTab === safeName));
    document.querySelectorAll("[data-profile-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.profilePanel === safeName));
  };

  document.querySelectorAll("[data-profile-tab]").forEach(tab => {
    tab.addEventListener("click", () => setProfileTab(tab.dataset.profileTab));
  });

  const initialTab = new URLSearchParams(location.search).get("tab");
  const allowedTabs = ["overview", "tasks", "submissions", "saved", "groups"];
  setProfileTab(allowedTabs.includes(initialTab) ? initialTab : "overview");

  const employerTaskTabs = document.querySelectorAll("[data-task-filter]");
  employerTaskTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const filter = tab.dataset.taskFilter;
      employerTaskTabs.forEach(item => item.classList.toggle("active", item === tab));
      document.querySelectorAll("[data-employer-task-status]").forEach(item => {
        item.hidden = filter !== "all" && item.dataset.employerTaskStatus !== filter;
      });
    });
  });

  document.getElementById("editProfileButton")?.addEventListener("click", () => openProfileEditor(user));
  document.getElementById("addMoneyButton")?.addEventListener("click", () => {
    user.wallet += 10000;
    saveUsers();
    addHistory(tr("Кошелёк пополнен на 10 000 CT", "Wallet topped up by 10,000 CT"), user.id);
    toast(tr("Баланс пополнен", "Balance topped up"));
    initProfile();
  });
  document.getElementById("profileLogoutButton")?.addEventListener("click", logout);

  document.getElementById("groupForm")?.addEventListener("submit", event => {
    event.preventDefault();
    groups.push({
      id: Date.now(),
      ownerId: user.id,
      name: document.getElementById("groupName").value,
      members: document.getElementById("groupMembers").value.split(",").map(item => item.trim()).filter(Boolean)
    });
    saveGroups();
    addHistory(tr("Создана рабочая группа", "Work group created"), user.id);
    toast(tr("Группа создана", "Group created"));
    initProfile();
  });

  renderGroups(user);
}

function renderGroups(user) {
  const root = document.getElementById("groupsList");
  if (!root) return;
  const list = groups.filter(group => group.ownerId === user.id);
  root.innerHTML = list.length
    ? list.map(group => `<div class="group-item"><strong>${escapeHTML(group.name)}</strong><span>${group.members.map(escapeHTML).join(", ")}</span></div>`).join("")
    : `<span class="order-page-description">${tr("Групп пока нет.", "No groups yet.")}</span>`;
}

