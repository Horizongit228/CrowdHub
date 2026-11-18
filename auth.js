function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  function perform(email, password) {
    const user = users.find(item => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!user) {
      toast(tr("Неверный email или пароль", "Incorrect email or password"));
      return;
    }
    if (user.emailVerified === false) {
      user.verificationSentAt = Date.now();
      saveUsers();
      setPendingVerification(user.id);
      toast(tr("Сначала подтверди email", "Please verify your email first"));
      setTimeout(() => navigateTo("verify-email.html"), 280);
      return;
    }
    clearPendingVerification();
    setCurrentUser(user.id);
    toast(tr("Вход выполнен", "Signed in"));
    setTimeout(() => navigateTo(user.role === "company" ? "company.html" : "profile.html"), 350);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    perform(document.getElementById("loginEmail").value.trim(), document.getElementById("loginPassword").value);
  });

  document.querySelectorAll("[data-demo]").forEach(button => {
    button.addEventListener("click", () => {
      const employer = button.dataset.demo === "employer";
      document.getElementById("loginEmail").value = employer ? "employer@demo.test" : "student@demo.test";
      document.getElementById("loginPassword").value = "1234";
      perform(document.getElementById("loginEmail").value, "1234");
    });
  });
}

function renderRoleBenefits(role) {
  const root = document.getElementById("roleBenefitsContent");
  if (!root) return;
  root.innerHTML = role === "company"
    ? `<ul><li>${tr("Публикация реальных рабочих задач", "Publish real work tasks")}</li><li>${tr("Резерв бюджета и защита исполнителей", "Reserve budgets and protect contributors")}</li><li>${tr("Просмотр всех решений и выбор победителя", "Review all submissions and select a winner")}</li><li>${tr("История заказов и статистика", "Task history and statistics")}</li></ul>`
    : `<ul><li>${tr("Доступ к реальным задачам компаний", "Access real tasks from companies")}</li><li>${tr("Портфолио из отправленных решений", "Build a portfolio from submitted solutions")}</li><li>${tr("Навыки и профессиональное портфолио", "Skills and a professional portfolio")}</li><li>${tr("Возможность получить оплату за лучший результат", "Get paid when your solution is selected")}</li></ul>`;
}

function initRegister() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const steps = [...document.querySelectorAll("[data-register-step]")];
  const currentLabel = document.getElementById("registerStepCurrent");
  const totalLabel = document.getElementById("registerStepTotal");
  const progress = document.getElementById("registerProgressBar");
  const nextButton = document.getElementById("registerNext");
  const prevButton = document.getElementById("registerPrev");
  const selectedRoot = document.getElementById("registerSelectedSkills");
  const skillSelect = document.getElementById("registerSkillSelect");
  const customSkill = document.getElementById("registerCustomSkill");
  const selectedSkills = [];
  let stepIndex = 0;

  totalLabel.textContent = String(steps.length);
  renderRoleBenefits("performer");

  const role = () => document.querySelector('input[name="role"]:checked')?.value || "performer";

  function syncRolePanels() {
    const performer = role() === "performer";
    document.querySelectorAll("[data-performer-registration]").forEach(item => item.hidden = !performer);
    document.querySelectorAll("[data-company-registration]").forEach(item => item.hidden = performer);
    renderRoleBenefits(role());
  }

  function renderSkills() {
    selectedRoot.innerHTML = selectedSkills.length
      ? selectedSkills.map(skill => `<button type="button" class="selected-skill-chip" data-remove-register-skill="${escapeHTML(skill)}"><span>${escapeHTML(skill)}</span><b>×</b></button>`).join("")
      : `<span class="skill-picker-empty">${tr("Добавь хотя бы два навыка", "Add at least two skills")}</span>`;
    selectedRoot.querySelectorAll("[data-remove-register-skill]").forEach(button => {
      button.addEventListener("click", () => {
        const index = selectedSkills.indexOf(button.dataset.removeRegisterSkill);
        if (index >= 0) selectedSkills.splice(index, 1);
        renderSkills();
      });
    });
  }

  function addSkill(value) {
    const skill = String(value || "").trim();
    if (!skill || selectedSkills.includes(skill) || selectedSkills.length >= 12) return;
    selectedSkills.push(skill);
    renderSkills();
  }

  function showStep(index) {
    stepIndex = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach((step, i) => step.classList.toggle("active", i === stepIndex));
    currentLabel.textContent = String(stepIndex + 1);
    progress.style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
    prevButton.hidden = stepIndex === 0;
    nextButton.textContent = stepIndex === steps.length - 1
      ? tr("Перейти к подтверждению", "Continue to verification")
      : tr("Продолжить", "Continue");
    syncRolePanels();
  }

  function validateStep() {
    if (stepIndex === 1) {
      const required = ["registerName", "registerContact", "registerEmail", "registerPassword"];
      for (const id of required) {
        const input = document.getElementById(id);
        if (!input.reportValidity()) return false;
      }
      const contactInput = document.getElementById("registerContact");
      if (!isVkProfileLink(contactInput.value)) {
        contactInput.setCustomValidity(tr("Укажи ссылку на страницу ВК, например https://vk.com/id123456", "Enter a VK profile URL, for example https://vk.com/id123456"));
        contactInput.reportValidity();
        contactInput.setCustomValidity("");
        return false;
      }
    }
    if (stepIndex === 2 && role() === "performer" && selectedSkills.length < 2) {
      toast(tr("Добавь минимум 2 навыка", "Add at least 2 skills"));
      return false;
    }
    return true;
  }

  document.querySelectorAll('input[name="role"]').forEach(radio => radio.addEventListener("change", syncRolePanels));
  document.getElementById("registerAddSkill")?.addEventListener("click", () => { addSkill(skillSelect.value); skillSelect.value = ""; });
  document.getElementById("registerAddCustomSkill")?.addEventListener("click", () => { addSkill(customSkill.value); customSkill.value = ""; customSkill.focus(); });
  customSkill?.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); addSkill(customSkill.value); customSkill.value = ""; }
  });
  nextButton.addEventListener("click", () => {
    if (!validateStep()) return;
    if (stepIndex === steps.length - 1) {
      form.requestSubmit();
    } else {
      showStep(stepIndex + 1);
    }
  });
  prevButton.addEventListener("click", () => showStep(stepIndex - 1));

  form.addEventListener("submit", event => {
    event.preventDefault();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    if (users.some(user => user.email.toLowerCase() === email)) {
      toast(tr("Этот email уже зарегистрирован", "This email is already registered"));
      showStep(1);
      return;
    }

    const accountRole = role();
    const user = {
      id: "user-" + Date.now(),
      name: document.getElementById("registerName").value.trim(),
      contact: document.getElementById("registerContact").value.trim(),
      email,
      password: document.getElementById("registerPassword").value,
      role: accountRole,
      wallet: accountRole === "company" ? 30000 : 0,
      favorites: [],
      skills: accountRole === "performer" ? [...selectedSkills] : [],
      bio: accountRole === "performer" ? document.getElementById("registerBio").value.trim() : document.getElementById("registerCompanyBio").value.trim(),
      experience: accountRole === "performer" ? "student" : "",
      portfolio: accountRole === "performer" ? document.getElementById("registerPortfolio").value.trim() : "",
      industry: accountRole === "company" ? document.getElementById("registerIndustry").value : "",
      companySize: accountRole === "company" ? document.getElementById("registerCompanySize").value : "",
      website: accountRole === "company" ? document.getElementById("registerWebsite").value.trim() : "",
      emailVerified: false,
      verificationCode: null,
      verificationSentAt: Date.now()
    };

    users.push(user);
    saveUsers();
    setPendingVerification(user.id);
    addHistory(tr("Аккаунт создан — ожидает подтверждения email", "Account created — awaiting email verification"), user.id);
    navigateTo("verify-email.html");
  });

  renderSkills();
  showStep(0);
}




function maskVerificationEmail(email) {
  const [local = "", domain = ""] = String(email || "").split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  const hidden = "•".repeat(Math.max(2, Math.min(5, local.length - visible.length)));
  return `${visible}${hidden}@${domain}`;
}

function initVerifyEmail() {
  const form = document.getElementById("verifyEmailForm");
  if (!form) return;

  let user = getPendingVerificationUser();
  const emailLabel = document.getElementById("verificationEmail");
  const codeInput = document.getElementById("verificationCode");
  const resendButton = document.getElementById("resendVerification");
  const continueButton = document.getElementById("verifyEmailSubmit");

  function renderState() {
    user = getPendingVerificationUser();
    if (!user) {
      document.getElementById("verificationReady")?.setAttribute("hidden", "");
      document.getElementById("verificationMissing")?.removeAttribute("hidden");
      return false;
    }
    if (user.emailVerified) {
      clearPendingVerification();
      setCurrentUser(user.id);
      navigateTo(user.role === "company" ? "company.html" : "profile.html");
      return false;
    }
    emailLabel.textContent = maskVerificationEmail(user.email);
    return true;
  }

  if (!renderState()) return;

  codeInput?.addEventListener("input", () => {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
    continueButton.disabled = codeInput.value.length !== 6;
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!user) return;
    if (!/^\d{6}$/.test(codeInput.value)) {
      codeInput.setCustomValidity(tr("Введи любые шесть цифр", "Enter any six digits"));
      codeInput.reportValidity();
      setTimeout(() => codeInput.setCustomValidity(""), 0);
      return;
    }

    user.emailVerified = true;
    user.emailVerifiedAt = Date.now();
    user.verificationCode = null;
    saveUsers();
    clearPendingVerification();
    setCurrentUser(user.id);
    addHistory(tr("Email подтверждён", "Email verified"), user.id);
    toast(tr("Почта подтверждена", "Email verified"));
    continueButton.disabled = true;
    continueButton.textContent = tr("Готово ✓", "Done ✓");
    setTimeout(() => navigateTo(user.role === "company" ? "company.html" : "profile.html"), 420);
  });

  resendButton?.addEventListener("click", () => {
    if (!user) return;
    user.verificationCode = null;
    user.verificationSentAt = Date.now();
    saveUsers();
    codeInput.value = "";
    continueButton.disabled = true;
    toast(tr("Новое письмо отправлено", "A new email was sent"));
  });
}
