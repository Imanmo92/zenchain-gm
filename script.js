// Page Switcher
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show the selected page
  document.getElementById(pageId).classList.add('active');
}

// Wallet Connect Demo
document.getElementById('connectWalletBtn').addEventListener('click', () => {
  alert('🔗 Wallet connected! (Demo)');
});

// GM Button Counter
let gmCount = 0;
document.getElementById('sendGmBtn').addEventListener('click', () => {
  gmCount++;
  document.getElementById('totalGms').textContent = gmCount;
  alert('🌅 GM sent to ZenChain!');
});
