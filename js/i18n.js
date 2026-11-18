function tr(ru, en) {
  return currentLang === "en" ? en : ru;
}

function setLanguage(lang) {
  localStorage.setItem(KEYS.LANG, lang === "en" ? "en" : "ru");
  location.reload();
}

const CATEGORY_EN = {
  "Разработка": "Development",
  "Дизайн": "Design",
  "Маркетинг": "Marketing",
  "Аналитика": "Analytics",
  "Контент": "Content"
};

function categoryLabel(value) {
  return currentLang === "en" ? (CATEGORY_EN[value] || value) : value;
}

const STATIC_TEXTS = new Map([
  ["РЕАЛЬНЫЕ ЗАДАЧИ · РЕАЛЬНЫЙ ОПЫТ", "REAL TASKS · REAL EXPERIENCE"],
  ["Получай опыт", "Build experience"],
  ["на реальных задачах.", "on real-world tasks."],
  ["Работодатели публикуют настоящие рабочие задачи и назначают вознаграждение. Студенты и начинающие специалисты предлагают свои решения, получают опыт, портфолио и возможность заработать.", "Employers publish real work tasks and set a reward. Students and early-career specialists submit solutions, build experience and portfolios, and can earn money."],
  ["Смотреть задачи", "Browse tasks"],
  ["Начать работу", "Get started"],
  ["активных задач", "active tasks"],
  ["решений", "solutions"],
  ["прозрачные правила", "transparent rules"],
  ["ТВОЙ УРОВЕНЬ", "YOUR LEVEL"],
  ["Твой уровень растёт вместе с опытом", "Your level grows with your experience"],
  ["КАТЕГОРИИ", "CATEGORIES"],
  ["Что хочешь попробовать?", "What do you want to try?"],
  ["Все задачи →", "All tasks →"],
  ["Разработка", "Development"],
  ["Дизайн", "Design"],
  ["Маркетинг", "Marketing"],
  ["Аналитика", "Analytics"],
  ["Контент", "Content"],
  ["ПЛАТФОРМА", "MARKETPLACE"],
  ["Популярные задачи", "Popular tasks"],
  ["Открыть каталог →", "Open catalog →"],
  ["КАК ЭТО РАБОТАЕТ", "HOW IT WORKS"],
  ["От задачи до результата", "From task to result"],
  ["Работодатель создаёт задачу", "Employer creates a task"],
  ["Описывает реальные требования и резервирует вознаграждение.", "Defines real requirements and reserves the reward."],
  ["Исполнители пробуют", "Contributors give it a try"],
  ["Можно связаться с заказчиком и отправить собственное решение.", "You can contact the employer and submit your own solution."],
  ["Выбирается лучший результат", "The best result is selected"],
  ["Работодатель выбирает победителя, которому уходит вознаграждение.", "The employer selects a winner who receives the reward."],
  ["Защита исполнителя", "Contributor protection"],
  ["После того как хотя бы один человек отправил результат, работодатель больше не может отменить заказ.", "Once at least one person submits a result, the employer can no longer cancel the task."],
  ["Расти, решая реальные задачи.", "Grow by solving real problems."],
  ["КАТАЛОГ ЗАДАЧ", "TASK MARKETPLACE"],
  ["Каталог задач", "Task catalog"],
  ["Выбери реальную рабочую задачу и попробуй решить её.", "Choose a real work task and try to solve it."],
  ["+ Разместить задачу", "+ Create task"],
  ["Все категории", "All categories"],
  ["Все статусы", "All statuses"],
  ["Открытые", "Open"],
  ["Есть решения", "Reviewing"],
  ["Завершённые", "Completed"],
  ["Сначала новые", "Newest first"],
  ["Цена: выше", "Price: high to low"],
  ["Цена: ниже", "Price: low to high"],
  ["Популярные", "Popular"],
  ["БЫСТРЫЙ ПОИСК", "QUICK SEARCH"],
  ["Популярные навыки", "Popular skills"],
  ["Сбросить", "Reset"],
  ["Найдено:", "Found:"],
  ["Ничего не найдено", "Nothing found"],
  ["Попробуй изменить фильтры.", "Try changing the filters."],
  ["НОВАЯ ЗАДАЧА", "NEW TASK"],
  ["Разместить задачу", "Create a task"],
  ["Средства резервируются сразу после публикации.", "Funds are reserved immediately after publishing."],
  ["Название", "Title"],
  ["Категория", "Category"],
  ["Вознаграждение", "Reward"],
  ["Описание задачи", "Task description"],
  ["Навыки", "Skills"],
  ["Правило отмены", "Cancellation rule"],
  ["Ты сможешь отменить задачу и вернуть средства только пока ни один исполнитель не отправил результат.", "You can cancel the task and recover the funds only while no contributor has submitted a result."],
  ["Оплатить и опубликовать", "Pay and publish"],
  ["ПРЕДПРОСМОТР", "LIVE PREVIEW"],
  ["Предпросмотр карточки", "Card preview"],
  ["Рекомендуемый бюджет", "Recommended budget"],
  ["Баланс: —", "Balance: —"],
  ["СОХРАНЁННЫЕ ЗАДАЧИ", "SAVED TASKS"],
  ["Избранное", "Saved"],
  ["Сохраняй интересные задачи, чтобы вернуться к ним позже.", "Save interesting tasks so you can return to them later."],
  ["Найти ещё задачи", "Find more tasks"],
  ["ТВОЯ ПОДБОРКА", "YOUR COLLECTION"],
  ["0 сохранённых задач", "0 saved tasks"],
  ["Избранное хранится в профиле этого браузера и синхронизируется с карточками задач.", "Saved tasks are stored in this browser profile and stay in sync with task cards."],
  ["Избранное пока пустое", "No saved tasks yet"],
  ["Открой каталог и нажми ♡ у понравившейся задачи.", "Open the catalog and press ♡ on a task you like."],
  ["Перейти к задачам", "Browse tasks"],
  ["← Вернуться к задачам", "← Back to tasks"],
  ["ОТПРАВКА РЕШЕНИЯ", "SUBMIT SOLUTION"],
  ["Отправить решение", "Submit solution"],
  ["После первой отправки результата заказ больше нельзя отменить.", "After the first submission, the task can no longer be cancelled."],
  ["Ссылка на результат", "Result link"],
  ["Описание решения", "Solution description"],
  ["Отправить результат", "Submit result"],
  ["СВЯЗЬ С ЗАКАЗЧИКО", "CONTACT EMPLOYER"],
  ["Связаться с заказчиком", "Contact employer"],
  ["Контакт будет показан после входа.", "Contact details will be shown after sign-in."],
  ["Сообщение", "Message"],
  ["Отправить сообщение", "Send message"],
  ["С ВОЗВРАЩЕНИЕМ", "WELCOME BACK"],
  ["Вход", "Sign in"],
  ["Вернись к своим задачам и результатам.", "Return to your tasks and submissions."],
  ["Пароль", "Password"],
  ["Запомнить вход на этом устройстве", "Remember me on this device"],
  ["Войти", "Sign in"],
  ["БЫСТРЫЙ ДЕМО-ВХОД", "QUICK DEMO LOGIN"],
  ["💼 Войти работодателем", "💼 Sign in as employer"],
  ["🎓 Войти исполнителем", "🎓 Sign in as contributor"],
  ["Нет аккаунта?", "No account?"],
  ["Зарегистрироваться", "Register"],
  ["СОЗДАНИЕ АККАУНТА", "CREATE ACCOUNT"],
  ["Создай профиль", "Create your profile"],
  ["Выбери роль и начни работать с реальными задачами.", "Choose a role and start working with real tasks."],
  ["🎓 Исполнитель", "🎓 Contributor"],
  ["Решай задачи, получай опыт и зарабатывай", "Solve tasks, build experience and earn"],
  ["💼 Компания", "💼 Company"],
  ["Публикуй реальные рабочие задачи", "Publish real work tasks"],
  ["ЧТО ТЫ ПОЛУЧИШЬ", "WHAT YOU GET"],
  ["Имя / компания", "Name / company"],
  ["Контакт", "Contact"],
  ["Ссылка ВК", "VK profile link"],
  ["ВКонтакте ↗", "VK ↗"],
  ["Уже зарегистрирован?", "Already registered?"],
  ["Профиль", "Profile"],
  ["Кем ты будешь на CrowdHub?", "How will you use CrowdHub?"],
  ["Роль определяет кабинет и сценарии работы. Её можно будет изменить через поддержку.", "Your role determines your workspace and flows. It can later be changed through support."],
  ["Исполнитель", "Contributor"],
  ["Решай задачи, собирай портфолио, рейтинг и опыт.", "Solve tasks, build a portfolio, rating and experience."],
  ["Компания", "Company"],
  ["Публикуй задачи, принимай решения и формируй команду.", "Publish tasks, review solutions and build your team."],
  ["Основные данные", "Basic details"],
  ["Эти данные будут видны в профиле и в твоих откликах.", "These details will be visible in your profile and submissions."],
  ["Навыки", "Skills"],
  ["Выбери минимум 2 навыка. По ним CrowdHub сможет лучше подбирать задачи.", "Choose at least 2 skills so CrowdHub can match you with better tasks."],
  ["Добавить из списка", "Add from list"],
  ["Добавить", "Add"],
  ["Добавить свой", "Add custom"],
  ["О компании", "About the company"],
  ["Эта информация помогает исполнителям понимать, с кем они работают.", "This helps contributors understand who they are working with."],
  ["Сфера", "Industry"],
  ["Размер команды", "Team size"],
  ["Сайт компании", "Company website"],
  ["Последние штрихи", "Final touches"],
  ["Это поможет заказчикам узнать о твоих навыках и специализации.", "This helps employers learn about your skills and specialty."],
  ["Коротко о себе", "About you"],
  ["Уровень", "Level"],
  ["Портфолио", "Portfolio"],
  ["Профиль работодателя готов", "Employer profile is ready"],
  ["После регистрации ты попадёшь в кабинет компании и сможешь создать первую задачу.", "After registration you will enter the company workspace and can create your first task."],
  ["Описание компании", "Company description"],
  ["Назад", "Back"],
  ["Продолжить", "Continue"],
  ["Ссылка на GitHub / результат", "GitHub / result link"],
  ["или", "or"],
  ["Прикрепить ZIP-архив", "Attach ZIP archive"],
  ["Описание решения", "Solution description"],
  ["Отправить результат", "Submit result"],
  ["Студент / начинающий", "Student / beginner"],
  ["Прикрепить ZIP-архив", "Attach ZIP archive"],
  ["до 25 МБ · исходники, макеты или готовый проект", "up to 25 MB · source files, layouts or a finished project"],
  ["Нужно добавить ссылку или ZIP-архив. ZIP сохраняется локально в браузере частями и доступен для скачивания на этом устройстве.", "Add a link or ZIP archive. ZIP files are stored locally in browser chunks and can be downloaded on this device."],
  ["Рейтинг продавца", "Seller rating"],
  ["ПОДТВЕРЖДЕНИЕ ПОЧТЫ", "EMAIL VERIFICATION"],
  ["Проверь почту", "Check your email"],
  ["сейчас", "now"],
  ["Мы отправили шестизначный код на", "We sent a six-digit code to"],
  ["Введи этот код, чтобы активировать аккаунт.", "Enter this code to activate your account."],
  ["Код из письма", "Code from email"],
  ["Подтвердить email", "Verify email"],
  ["Отправить код ещё раз", "Send code again"],
  ["Вернуться ко входу", "Back to sign in"],
  ["Нет ожидающего аккаунта", "No pending account"],
  ["Вернись к регистрации или войди в уже созданный аккаунт.", "Return to registration or sign in to an existing account."],
]);

const PLACEHOLDER_TEXTS = new Map([
  ["Например: разработать лендинг", "For example: build a landing page"],
  ["Что нужно сделать? Каким должен быть результат?", "What needs to be done? What should the result look like?"],
  ["Поиск по задачам...", "Search tasks..."],
  ["Расскажи, что ты сделал...", "Tell us what you built..."],
  ["Здравствуйте! Есть вопрос по задаче...", "Hi! I have a question about the task..."],
  ["Выбрать навык…", "Choose a skill…"],
  ["Или введи свой навык", "Or enter a custom skill"],
  ["Frontend-разработчик, люблю интерфейсы и реальные продуктовые задачи.", "Frontend developer, interested in interfaces and real product work."],
  ["GitHub / Behance / сайт", "GitHub / Behance / website"],
  ["Чем занимается команда и какие специалисты вам интересны?", "What does your team do and what specialists are you looking for?"]
]);

const PAGE_TITLES = {
  home: ["CrowdHub — реальные рабочие задачи", "CrowdHub — real work tasks"],
  orders: ["Задачи — CrowdHub", "Tasks — CrowdHub"],
  order: ["Задача — CrowdHub", "Task — CrowdHub"],
  favorites: ["Избранное — CrowdHub", "Saved — CrowdHub"],
  "create-order": ["Создать задачу — CrowdHub", "Create task — CrowdHub"],
  profile: ["Профиль — CrowdHub", "Profile — CrowdHub"],
  login: ["Вход — CrowdHub", "Sign in — CrowdHub"],
  register: ["Регистрация — CrowdHub", "Register — CrowdHub"],
  "verify-email": ["Подтверждение почты — CrowdHub", "Verify email — CrowdHub"]
};

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  const page = document.body.dataset.page;
  if (PAGE_TITLES[page]) document.title = currentLang === "en" ? PAGE_TITLES[page][1] : PAGE_TITLES[page][0];
  if (currentLang !== "en") return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (["SCRIPT", "STYLE"].includes(node.parentElement?.tagName)) return;
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    const translated = STATIC_TEXTS.get(trimmed);
    if (!translated) return;
    const leading = raw.match(/^\s*/)?.[0] || "";
    const trailing = raw.match(/\s*$/)?.[0] || "";
    node.nodeValue = leading + translated + trailing;
  });

  document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(element => {
    const translated = PLACEHOLDER_TEXTS.get(element.getAttribute("placeholder"));
    if (translated) element.setAttribute("placeholder", translated);
  });
}

function renderLanguageSwitchButton(className = "lang-switch") {
  return `<button type="button" class="${className}" data-language-toggle aria-label="${tr("Переключить интерфейс на английский", "Switch interface to Russian")}" title="${tr("English", "Русский")}">${currentLang === "ru" ? "EN" : "RU"}</button>`;
}

function bindLanguageSwitchers() {
  document.querySelectorAll("[data-language-toggle]").forEach(button => {
    button.addEventListener("click", () => setLanguage(currentLang === "ru" ? "en" : "ru"));
  });
}

function renderStandaloneLanguageSwitch() {
  if (document.getElementById("siteHeader")) return;
  if (document.querySelector(".auth-lang-switch")) return;
  const wrap = document.createElement("div");
  wrap.className = "auth-lang-switch";
  wrap.innerHTML = renderLanguageSwitchButton("lang-switch lang-switch-auth");
  document.body.appendChild(wrap);
  bindLanguageSwitchers();
}

