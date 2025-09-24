// Import ethers.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.0/dist/ethers.min.js";

const zenChainConfig = {
  chainId: "8408 (0x20d8)", // <-- Replace with actual ZenChain testnet chainId
  chainName: "ZenChain Testnet",
  rpcUrls: ["https://zenchain-testnet.api.onfinality.io/public"], // <-- Replace with correct RPC
  nativeCurrency: {
    name: "ZENT",
    symbol: "ZENT",
    decimals: 18,
  },
  blockExplorerUrls: ["https://explorer.zenchain.io"],
};

const contractAddress = "0xF8aD5140d8B21D68366755DeF1fEFA2e2665060C"; // <-- Replace
const contractABI = [ /* paste your ABI here */ ];

// Page switching
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  // highlight active button
  document.querySelectorAll(".sidebar button").forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-page="${pageId}"]`).classList.add("active");
}

// Wallet connect button
const connectWalletBtn = document.getElementById("connectWalletBtn");
connectWalletBtn.addEventListener("click", async () => {
  if (!window.ethereum) {
    alert("MetaMask not detected!");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    connectWalletBtn.innerText = `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
  } catch (err) {
    console.error(err);
    alert("Failed to connect wallet");
  }
});

// GM logic
const gmBtn = document.getElementById("sendGmBtn");
const gmTimer = document.getElementById("gmTimer");
const gmCounter = document.getElementById("gmCounter");

let gmCooldown = 24 * 60 * 60 * 1000; // 24h
let lastGmTimestamp = localStorage.getItem("lastGmTimestamp");
let gmCount = parseInt(localStorage.getItem("gmCount") || "0");
gmCounter.innerText = gmCount;

function startTimer(ms) {
  let remaining = ms;
  const interval = setInterval(() => {
    remaining -= 1000;
    if (remaining <= 0) {
      clearInterval(interval);
      gmBtn.disabled = false;
      gmTimer.innerText = "";
    } else {
      const h = Math.floor(remaining / (1000 * 60 * 60));
      const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      gmTimer.innerText = `Available in ${h}h ${m}m`;
    }
  }, 1000);
}

function checkGmCooldown() {
  if (!lastGmTimestamp) return;
  const now = Date.now();
  const diff = now - parseInt(lastGmTimestamp);
  if (diff < gmCooldown) {
    gmBtn.disabled = true;
    startTimer(gmCooldown - diff);
  } else {
    gmBtn.disabled = false;
    gmTimer.innerText = "";
  }
}

async function switchToZenChain() {
  if (!window.ethereum) {
    alert("MetaMask not detected!");
    return false;
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: zenChainConfig.chainId }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [zenChainConfig],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add ZenChain:", addError);
        return false;
      }
    }
    console.error("Failed to switch network:", switchError);
    return false;
  }
}

gmBtn.addEventListener("click", async () => {
  const switched = await switchToZenChain();
  if (!switched) return;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const gmContract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    const tx = await gmContract.sendGM(); // <-- Replace with your contract's function name
    await tx.wait();

    gmCount++;
    gmCounter.innerText = gmCount;
    localStorage.setItem("gmCount", gmCount);

    lastGmTimestamp = Date.now();
    localStorage.setItem("lastGmTimestamp", lastGmTimestamp);

    gmBtn.disabled = true;
    startTimer(gmCooldown);

    alert("✅ GM sent on ZenChain!");
  } catch (error) {
    console.error("GM transaction failed:", error);
    alert("❌ Failed to send GM");
  }
});

checkGmCooldown();
