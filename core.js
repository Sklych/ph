const telegramWA = window.Telegram && window.Telegram.WebApp;
if (telegramWA) {
  telegramWA.ready();
}

const localAppConfig = {
  enableLogs: true,
  base_url: "http://127.0.0.1:5001",
  hasRealTgWebApp: false,
  telegramWebApp: {
    initData: null,
    initDataUnsafe: {
      start_param: null
    }
  }
}

const debugAppConfig = {
  enableLogs: true,
  base_url: "https://myphrilldemo.pythonanywhere.com",
  hasRealTgWebApp: true,
  telegramWebApp: telegramWA
}

const prodAppConfig = {
  enableLogs: false,
  base_url: "http://127.0.0.1:5001",
  hasRealTgWebApp: true,
  telegramWebApp: telegramWA
}

const appConfig = debugAppConfig;

if (!appConfig.enableLogs) {
  console.log = function () { };
  console.error = function () { };
}

console.log(`core.js init. appConfig=${JSON.stringify(appConfig)}`)

function versionCompare(v1, v2) {
    if (typeof v1 !== 'string') v1 = '';
    if (typeof v2 !== 'string') v2 = '';
    v1 = v1.replace(/^\s+|\s+$/g, '').split('.');
    v2 = v2.replace(/^\s+|\s+$/g, '').split('.');
    var a = Math.max(v1.length, v2.length), i, p1, p2;
    for (i = 0; i < a; i++) {
      p1 = parseInt(v1[i]) || 0;
      p2 = parseInt(v2[i]) || 0;
      if (p1 == p2) continue;
      if (p1 > p2) return 1;
      return -1;
    }
    return 0;
  }
  
function versionAtLeast(webAppVersion, ver) {
    return versionCompare(webAppVersion, ver) >= 0;
  }
  
  function playHapticNavigation() {
    if (appConfig.hasRealTgWebApp && versionAtLeast(appConfig.telegramWebApp.version, '6.1')) {
      appConfig.telegramWebApp.HapticFeedback.impactOccurred('soft')
    }
  }
  
  function playHapticSuccess() {
    if (appConfig.hasRealTgWebApp && versionAtLeast(appConfig.telegramWebApp.version, '6.1')) {
      appConfig.telegramWebApp.HapticFeedback.notificationOccurred('success')
    }
  }

  function playHapticWarning() {
    if (appConfig.hasRealTgWebApp && versionAtLeast(appConfig.telegramWebApp.version, '6.1')) {
      appConfig.telegramWebApp.HapticFeedback.notificationOccurred('warning')
    }
  }
  
  function playHapticError() {
    if (appConfig.hasRealTgWebApp && versionAtLeast(appConfig.telegramWebApp.version, '6.1')) {
      appConfig.telegramWebApp.HapticFeedback.notificationOccurred('error')
    }
  }

let currentSnackbar = null;

function showSnackbar(message, iconSrc = null, duration = 3000) {
  if (currentSnackbar) {
    currentSnackbar.classList.remove('show');
    currentSnackbar.remove();
    currentSnackbar = null;
  }

  const snackbar = document.createElement('div');
  snackbar.className = 'snackbar';

  if (iconSrc) {
    const img = document.createElement('img');
    img.src = iconSrc;
    img.alt = 'icon';
    img.style.width = '24px';
    img.style.height = '24px';
    snackbar.appendChild(img);
  }

  const text = document.createElement('span');
  text.textContent = message;
  snackbar.appendChild(text);

  document.body.appendChild(snackbar);
  currentSnackbar = snackbar;

  requestAnimationFrame(() => {
    snackbar.classList.add('show');
  });

  setTimeout(() => {
    snackbar.classList.remove('show');
    setTimeout(() => {
      snackbar.remove();
      if (currentSnackbar === snackbar) currentSnackbar = null;
    }, 400);
  }, duration);
}

class User {
  constructor(data) {
    this.transactions = data.transactions || [];
    this.dailyProfitPercent = data.dailyProfitPercent || 1.03;
    this.payload = data.payload || ""
  }
}

async function getUserSnapshot(initData, ref = null) {
  const params = new URLSearchParams({ });
  if (initData) params.append('initData', initData);
  if (ref) params.append('ref', ref);

  try {
    const res = await fetch(`${appConfig.base_url}/snapshot?${params.toString()}`, {
      method: "GET",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Get snapshot failed: ${text}`);
      return null;
    }

    const data = await res.json();
    console.log("Snapshot data:", data);

    return new User(data);
  } catch (e) {
    console.error("getUserSnapshot fetch error:", e);
    return null;
  }
}

class Stake {
  constructor(transactions = [], isAvailable = true) {
    this.transactions = transactions;
    this.isAvailable = isAvailable;
  }
}

async function stake(initData, { tx_boc, payout_interval, wallet, staked_amount, returned_amount }) {
  try {
    const params = new URLSearchParams({ });
    if (initData) params.append('initData', initData);
    console.log("client send data ", JSON.stringify({
      tx_boc,
      payout_interval,
      wallet,
      staked_amount,
      returned_amount,
    }), payout_interval)
    const res = await fetch(`${appConfig.base_url}/stake?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tx_boc,
        payout_interval,
        wallet,
        staked_amount,
        returned_amount,
      }),
    });

    if (res.status === 200) {
      const data = await res.json();
      return new Stake(data.transactions ?? [], true);
    }

    if (res.status === 409) {
      return new Stake([], false);
    }

    throw new Error(`Stake request failed with status ${res.status}`);
  } catch (e) {
    console.error("stake fetch error:", e);
    throw e;
  }
}

async function isStakeAvailable(initData) {
  try {
    const params = new URLSearchParams({ });
    if (initData) params.append('initData', initData);
    const response = await fetch(`${appConfig.base_url}/checkStake?${params.toString()}`, {
      method: "GET",
    });

    if (response.status === 200) {
      return true;
    } else if (response.status === 409) {
      return false
    } else {
      const error = Error(`Error checking stake with status code=${response.status}`)
      console.error(error);
      throw error;
    }
  } catch (error) {
    console.error("Error checking isStakeAvailable", error);
    throw error
  }
}

window.showSnackbar = showSnackbar;
window.appConfig = appConfig;
window.versionAtLeast = versionAtLeast;
window.playHapticNavigation = playHapticNavigation;
window.playHapticSuccess = playHapticSuccess;
window.playHapticWarning = playHapticWarning;
window.playHapticError = playHapticError;

// network fcs
window.getUserSnapshot = getUserSnapshot;
window.stake = stake;
window.isStakeAvailable = isStakeAvailable;