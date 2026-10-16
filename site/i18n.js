// 避雷針 / Lightning Rod — language. The page says which one it is (<html lang>):
// / is 中文, /en/ is English. A saved choice sends you to the other one.
(function (root) {
  const KEY = 'blz.lang';
  const EN = document.documentElement.lang === 'en';
  const home = () => (EN ? '../' : 'en/');
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved !== (EN ? 'en' : 'zh')) location.replace(home());
  } catch { /* private mode */ }
  root.BLZ_I18N = {
    EN,
    /** Inline pair: L('今天', 'Today'). */
    L: (zh, en) => (EN ? en : zh),
    switchLang() {
      try { localStorage.setItem(KEY, EN ? 'zh' : 'en'); } catch { /* private mode */ }
      location.href = home();
    },
  };
})(window);
