// ====== Config (replace with your real values) ======
// صفحه‌بندی
function showSection(id) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

// بقیه کدهای اتصال ولت، فاست و قرارداد همون قبلی هست

const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const FAUCET_URL = "https://faucet.zenchain.io/";
const contractAbi = [
  {
    "inputs": [],
    "name": "cooldown",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "count", "type": "uint256"}, {"internalType": "uint256", "name": "offset", "type": "uint256"}],
    "name": "getRecentGMs",
    "outputs": [
      {
        "components": [
          {"internalType": "address","name": "sender","type": "address"},
          {"internalType": "uint256","name": "timestamp","type": "uint256"},
          {"internalType": "string","name": "message","type": "string"}
        ],
        "internalType": "struct GM.GMRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalGMs",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "","type": "address"}],
    "name": "lastSent",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string","name": "message","type": "string"}],
    "name": "sendGM",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "message", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "GMSent",
    "type": "event"
  }
];

// ====================================================
let provider;
let signer;
let contract;
let userAddress = null;
const connectBtn = document.getElementById("connectBtn");
const accountDisplay = document.getElementById("accountDisplay");
const faucetBtn = document.getElementById("faucetBtn");
const sendGmBtn = document.getElementById("sendGmBtn");
const totalGmsDiv = document.getElementById("totalGms");
const recentList = document.getElementById("recentList");
const logArea = document.getElementById("logArea");
const cooldownInfo = document.getElementById("cooldownInfo");
const timerDiv = document.getElementById("timer");

function log(...args){
  console.log(...args);
  logArea.textContent += args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ") + "\n";
  logArea.scrollTop = logArea.scrollHeight;
}

function hasMetaMask(){
  return typeof window.ethereum !== 'undefined';
}

async function connectWallet(){
  if(!hasMetaMask()){
    alert("MetaMask not detected. Please install MetaMask.");
    return;
  }
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    accountDisplay.textContent = userAddress;
    connectBtn.textContent = "Disconnect";
    contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
    log("Connected:", userAddress);
    await refreshAll();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
  } catch (err) {
    console.error(err);
    log("Error connecting wallet:", err.message || err);
  }
}

function disconnectWallet(){
  userAddress = null;
  signer = null;
  provider = null;
  contract = null;
  accountDisplay.textContent = "Not connected";
  connectBtn.textContent = "Connect Wallet";
  log("Disconnected.");
  stopTimer();
}

connectBtn.addEventListener("click", async () => {
  if(userAddress){
    disconnectWallet();
  } else {
    await connectWallet();
  }
});

faucetBtn.addEventListener("click", () => {
  window.open(FAUCET_URL, "_blank");
});

sendGmBtn.addEventListener("click", async () => {
  if(!userAddress) { alert("Please connect your wallet first."); return; }
  try {
    sendGmBtn.disabled = true;
    sendGmBtn.textContent = "Sending...";
    const tx = await contract.sendGM("GM");
    log("Transaction sent:", tx.hash);
    await tx.wait();
    log("Transaction confirmed:", tx.hash);
    await refreshAll();
  } catch (err){
    console.error(err);
    log("Error sending GM:", err.message || err);
    if(err && err.error && err.error.message) {
      alert(err.error.message);
    }
  } finally {
    sendGmBtn.textContent = 'Send "GM"';
  }
});

function handleAccountsChanged(accounts){
  if(accounts.length === 0){
    disconnectWallet();
  } else {
    userAddress = accounts[0];
    accountDisplay.textContent = userAddress;
    log("Account changed:", userAddress);
    connectBtn.textContent = "Disconnect";
    refreshAll();
  }
}

function handleChainChanged(chainId){
  log("Chain changed:", chainId);
  refreshAll();
}

async function refreshAll(){
  try {
    const readProvider = provider || (hasMetaMask() ? new ethers.providers.Web3Provider(window.ethereum) : null);
    if(!readProvider){
      log("No provider available");
      return;
    }
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, readProvider);
    const total = await readContract.getTotalGMs();
    totalGmsDiv.textContent = total.toString();
    const recent = await readContract.getRecentGMs(20, 0);
    renderRecent(recent);

    if(userAddress){
      const last = await readContract.lastSent(userAddress);
      const cooldown = await readContract.cooldown();
      const lastTs = last.toNumber ? last.toNumber() : Number(last);
      const cd = cooldown.toNumber ? cooldown.toNumber() : Number(cooldown);
      const now = Math.floor(Date.now() / 1000);
      const diff = now - lastTs;
      if(lastTs === 0 || diff >= cd){
        setReady();
      } else {
        setCooldown(cd - diff);
      }
    } else {
      setReady();
    }

  } catch (err) {
    console.error(err);
    log("Error refreshing:", err.message || err);
  }
}

function renderRecent(arr){
  recentList.innerHTML = "";
  if(!arr || arr.length === 0){
    recentList.innerHTML = "<li class='muted'>No GM records yet.</li>";
    return;
  }
  arr.forEach(item => {
    const addr = item.sender;
    const ts = Number(item.timestamp);
    const when = new Date(ts * 1000).toLocaleString();
    const li = document.createElement("li");
    li.textContent = `${addr} — ${when} — "${item.message}"`;
    recentList.appendChild(li);
  });
}

// ====== cooldown ======
let countdownInterval = null;

function setReady(){
  cooldownInfo.textContent = "Status: Ready";
  sendGmBtn.disabled = false;
  timerDiv.textContent = "";
  stopTimer();
}

function setCooldown(seconds){
  cooldownInfo.textContent = "Status: Cooldown active";
  sendGmBtn.disabled = true;
  startTimer(seconds);
}

function startTimer(seconds){
  stopTimer();
  updateTimer(seconds);
  countdownInterval = setInterval(() => {
    seconds--;
    if(seconds <= 0){
      setReady();
      refreshAll();
    } else {
      updateTimer(seconds);
    }
  }, 1000);
}

function stopTimer(){
  if(countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function updateTimer(seconds){
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  timerDiv.textContent = `Time until re-activation: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

window.addEventListener("load", async () => {
  log("Page loaded");
  if(hasMetaMask()){
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  }
  try {
    if(CONTRACT_ADDRESS && contractAbi.length > 0){
      const readProvider = provider || (hasMetaMask() ? new ethers.providers.Web3Provider(window.ethereum) : null);
      if(readProvider){
        const readContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, readProvider);
        const total = await readContract.getTotalGMs();
        totalGmsDiv.textContent = total.toString();
        const recent = await readContract.getRecentGMs(10, 0);
        renderRecent(recent);
      }
    } else {
      log("Warning: CONTRACT_ADDRESS or ABI not set.");
      totalGmsDiv.textContent = "Not set";
      recentList.innerHTML = "<li class='muted'>Set CONTRACT_ADDRESS & ABI in script.js</li>";
    }
  } catch (err){
    console.error(err);
    log("Init read error:", err.message || err);
  }
});


