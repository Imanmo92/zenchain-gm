// --- Config ---
const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const FAUCET_URL = "https://faucet.zenchain.io"; // Change to real faucet if needed

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
    "inputs": [{"internalType": "string","name": "message","type": "string"}],
    "name": "sendGM",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// --- Global Variables ---
let provider, signer, contract;
let userAddress = null;

// --- Page Navigation ---
function showSection(id) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

// --- Wallet Connection ---
async function connectWallet() {
  if (!window.ethereum) return alert("Please install MetaMask!");
  provider = new ethers.providers.Web3Provider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = accounts[0];
  contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
  document.getElementById("connectButton").innerText = "Disconnect Wallet";
}

function disconnectWallet() {
  provider = null;
  signer = null;
  userAddress = null;
  document.getElementById("connectButton").innerText = "Connect Wallet";
}

// --- Event Listeners ---
document.getElementById("connectButton").addEventListener("click", () => {
  if (userAddress) disconnectWallet();
  else connectWallet();
});

document.getElementById("faucetButton").addEventListener("click", () => {
  window.open(FAUCET_URL, "_blank");
});

document.getElementById("gmButton").addEventListener("click", async () => {
  if (!contract) return alert("Please connect your wallet first!");
  try {
    const tx = await contract.sendGM("GM");
    await tx.wait();
    alert("GM sent!");
    loadTotalGMs();
  } catch (err) {
    console.error(err);
    alert("Transaction failed!");
  }
});

// --- Load Data ---
async function loadTotalGMs() {
  if (!contract) return;
  const total = await contract.getTotalGMs();
  document.getElementById("totalGMs").innerText = total.toString();
}
