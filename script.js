// Highlight active page in sidebar + show content
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  // Remove highlight from all sidebar buttons
  document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));

  // Show selected page
  document.getElementById(pageId).classList.add('active');

  // Highlight clicked button
  const activeButton = Array.from(document.querySelectorAll('.sidebar button'))
    .find(btn => btn.textContent.toLowerCase().includes(pageId));
  if (activeButton) activeButton.classList.add('active');
}

// Wallet connect (MetaMask placeholder)
document.getElementById('connectWalletBtn').addEventListener('click', async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      alert(`Wallet connected: ${accounts[0]}`);
    } catch (err) {
      alert("Connection rejected.");
    }
  } else {
    alert("MetaMask not found. Please install MetaMask.");
  }
});

// GM counter + 24h cooldown
let gmCount = localStorage.getItem('gmCount') ? parseInt(localStorage.getItem('gmCount')) : 0;
document.getElementById('gmCount').textContent = `GM Count: ${gmCount}`;

const gmButton = document.getElementById('sendGmBtn');
const lastGmTime = localStorage.getItem('lastGmTime');
const now = Date.now();

// Disable if within 24h
if (lastGmTime && now - parseInt(lastGmTime) < 24 * 60 * 60 * 1000) {
  gmButton.disabled = true;
  startCooldownTimer(parseInt(lastGmTime));
}

gmButton.addEventListener('click', () => {
  gmCount++;
  localStorage.setItem('gmCount', gmCount);
  localStorage.setItem('lastGmTime', Date.now());
  document.getElementById('gmCount').textContent = `GM Count: ${gmCount}`;
  gmButton.disabled = true;
  startCooldownTimer(Date.now());
  alert("GM sent!");
});

function startCooldownTimer(startTime) {
  const cooldownInterval = setInterval(() => {
    const remaining = 24 * 60 * 60 * 1000 - (Date.now() - startTime);
    if (remaining <= 0) {
      gmButton.disabled = false;
      clearInterval(cooldownInterval);
    }
  }, 1000);
}
