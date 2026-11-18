function savedCountText(count) {
  if (currentLang === "en") return `${count} saved ${count === 1 ? "task" : "tasks"}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "сохранённая задача" : (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? "сохранённые задачи" : "сохранённых задач");
  return `${count} ${word}`;
}

function initFavoritesPage() {
  const grid = document.getElementById("favoritesGrid");
  if (!grid) return;

  const user = getCurrentUser();
  const empty = document.getElementById("favoritesEmpty");
  const count = document.getElementById("favoritesCount");

  if (!user) {
    count.textContent = tr("Войди, чтобы сохранять задачи", "Sign in to save tasks");
    grid.innerHTML = "";
    empty.classList.add("show");
    empty.innerHTML = `<strong>${tr("Нужен аккаунт", "Account required")}</strong><span>${tr("Войди, чтобы пользоваться избранным.", "Sign in to use saved tasks.")}</span><a class="btn btn-primary" href="login.html">${tr("Войти", "Sign in")}</a>`;
    return;
  }

  const list = orders.filter(order => user.favorites?.includes(order.id));
  count.textContent = savedCountText(list.length);
  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.add("show");
    return;
  }

  empty.classList.remove("show");
  grid.innerHTML = list.map(orderCard).join("");
  bindFavoriteButtons();
}

