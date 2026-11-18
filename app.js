document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');
  applyStaticTranslations();
  renderHeader();
  renderStandaloneLanguageSwitch();
  renderBottomIsland();
  bindSmoothNavigation();
  bindModals();
  enhanceForms();
  enableButtonFeedback();

  const page = document.body.dataset.page;
  if (page === 'home') initHome();
  if (page === 'orders') initOrdersPage();
  if (page === 'order') initOrderPage();
  if (page === 'login') initLogin();
  if (page === 'register') initRegister();
  if (page === 'verify-email') initVerifyEmail();
  if (page === 'create-order') initCreateOrder();
  if (page === 'profile') initProfile();
  if (page === 'company') initCompanyDashboard();
  if (page === 'company-tasks') initCompanyTasks();
  if (page === 'company-submissions') initCompanySubmissions();
  if (page === 'company-chats') initCompanyChats();
  if (page === 'messages') initMessagesPage();
  if (page === 'favorites') initFavoritesPage();
});
