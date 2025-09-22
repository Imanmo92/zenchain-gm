function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

// Wallet connect (demo)
document.getElementById('connectWalletBtn').addEventListener('click', () => {
  alert("Wallet connected (demo)");
});

// GM Counter
let gmCount = 0;
document.getElementById('sendGmBtn').addEventListener('click', () => {
  gmCount++;
  document.getElementById('gmCount').textContent = `GM Count: ${gmCount}`;
  alert("GM sent!");
});
