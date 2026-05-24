# Web3 TodoList App

A decentralized todo list application built with [Next.js](https://nextjs.org) and Solidity smart contracts. This project demonstrates a complete Web3 DApp (Decentralized Application) with a modern frontend and blockchain backend, deployable on both local networks and Sepolia testnet.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
  - [Local Deployment](#local-deployment)
  - [Sepolia Testnet Deployment](#sepolia-testnet-deployment)
- [Running the Application](#running-the-application)
- [Environment Configuration](#environment-configuration)
- [Testing](#testing)
- [Smart Contract Auditing](#smart-contract-auditing)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## 🎯 Project Overview

**Web3 TodoList** is a decentralized application that allows users to:
- Create, read, update, and delete todos (CRUD operations)
- Manage todos stored on-chain using smart contracts
- Connect MetaMask wallet for blockchain interactions
- View and manage tasks in a modern, responsive UI

**Tech Stack:**
- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Blockchain:** Solidity, Hardhat, Ethers.js
- **Deployment:** Hardhat Ignition
- **Networks:** Local Hardhat Network, Sepolia Testnet, Ethereum Mainnet

## 📋 Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **MetaMask Browser Extension** - [Install](https://metamask.io/download/)

### System Requirements
- macOS, Linux, or Windows (WSL recommended for Windows)
- At least 2GB of free disk space
- Internet connection for testnet deployment

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd web3todoapp
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js and React
- Hardhat and smart contract dependencies
- Ethers.js for blockchain interaction

### 3. Setup Environment Variables

Create a `.env.local` file in the project root:

```bash
cp env.example .env.local
```

Configure your environment variables (see [Environment Configuration](#environment-configuration) section).

## 📁 Project Structure

```
web3todoapp/
├── src/
│   ├── app/
│   │   ├── layout.js              # Root layout with providers
│   │   ├── page.js                # Home page
│   │   ├── globals.css            # Global styles
│   │   ├── context/               # React Context for state management
│   │   │   ├── TodoListContext.js
│   │   │   ├── TodoListProvider.js
│   │   │   ├── SettingsContext.js
│   │   │   └── SettingsProvider.js
│   │   └── todos/
│   │       └── page.js            # Todos page
│   └── constant.js                # App constants
├── contracts/
│   ├── TodoList.sol               # Main smart contract
│   └── TodoList.t.sol             # Test contracts
├── ignition/
│   ├── modules/
│   │   └── TodoListModule.ts      # Hardhat Ignition deployment module
│   └── deployments/               # Deployment records
├── test/
│   └── TodoList.ts                # Smart contract tests
├── hardhat.config.ts              # Hardhat configuration
├── next.config.mjs                # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.mjs             # PostCSS configuration
└── package.json                   # Project dependencies and scripts
```

## 🛠️ Development Setup

### 1. Start the Hardhat Local Network

In a new terminal, start a local blockchain network:

```bash
npx hardhat node
```

This will:
- Start a local Hardhat network on `http://127.0.0.1:8545`
- Generate 20 test accounts with 10,000 test ETH each
- Display accounts and private keys for testing

**Save the accounts and private keys for testing purposes.**

### 2. Deploy Smart Contracts to Local Network

In another terminal (keep the Hardhat node running), deploy the TodoList contract:

```bash
npm run deploy:local
```

This will:
- Deploy the TodoList contract to the local network
- Display the contract address
- Save deployment data to `ignition/deployments/chain-31337/`

**Note:** Chain ID 31337 is the default for Hardhat's local network.

### 3. Configure MetaMask for Local Network

1. Open MetaMask extension
2. Click the network selector (top-left)
3. Select "Add a network" → "Add a network manually"
4. Fill in the following:
   - **Network name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** `ETH`
5. Click "Save"

### 4. Import Test Account to MetaMask

1. Copy a private key from the Hardhat node output
2. In MetaMask, click account icon → "Import Account"
3. Paste the private key and click "Import"
4. Switch to the account you just imported

### 5. Update Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_TODOLIST_ADDRESS=<contract-address-from-deployment>
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_NETWORK=localhost
```

Replace `<contract-address-from-deployment>` with the address from step 2.

### 6. Start the Development Server

In a third terminal, start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Smart Contract Deployment

### Local Deployment

**Command:**
```bash
npm run deploy:local
```

**Steps:**
1. Ensure Hardhat node is running (`npx hardhat node`)
2. Run the deployment command
3. Contract will be deployed to local network (Chain ID: 31337)
4. Deployment records saved to `ignition/deployments/chain-31337/deployed_addresses.json`

**Expected Output:**
```
Deploying [TodoListModule]
✓ Sent deployment transaction
✓ Waiting for confirmations
Deployment successful!
Contract deployed at: 0x...
```

### Sepolia Testnet Deployment

**Prerequisites:**
- Sepolia test ETH in your wallet
- Private key with funds
- RPC endpoint (Infura, Alchemy, or similar)

**Step 1: Get Sepolia Test ETH**

1. Visit [Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
2. Connect your wallet or enter your address
3. Request test ETH (may take a few minutes to receive)

**Step 2: Configure Environment Variables**

Update `.env.local`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_TODOLIST_ADDRESS=
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_NETWORK=sepolia
```

**Step 3: Deploy to Sepolia**

```bash
npm run deploy:sepolia
```

**Step 4: Configure MetaMask for Sepolia**

1. Open MetaMask
2. Click network selector
3. Select "Sepolia test network"
4. (If not available, enable "Show test networks" in settings)

**Step 5: Update Frontend Configuration**

Once deployment succeeds, update `.env.local`:

```env
NEXT_PUBLIC_TODOLIST_ADDRESS=<address-from-deployment-output>
```

Then restart the development server (`npm run dev`).

**Verify Deployment:**

```bash
npm run verify:sepolia
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

- Access the app at [http://localhost:3000](http://localhost:3000)
- Hot reload enabled - changes reflect instantly
- Next.js dev tools available

### Production Build

```bash
npm run build
npm start
```

- Optimized production build
- Access the app at [http://localhost:3000](http://localhost:3000)

### Linting

Check code quality:

```bash
npm run lint
```

## 🔐 Environment Configuration

Create `.env.local` file in the project root:

```env
# Frontend Configuration
NEXT_PUBLIC_TODOLIST_ADDRESS=0x...              # Deployed contract address
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545      # RPC endpoint
NEXT_PUBLIC_NETWORK=localhost                   # Network name (localhost/sepolia/mainnet)

# Sepolia Network (for testnet deployment)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here       # DO NOT COMMIT THIS FILE

# Mainnet (optional, for production)
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
MAINNET_PRIVATE_KEY=your_mainnet_private_key    # DO NOT COMMIT THIS FILE
```

**⚠️ Security Note:** Never commit `.env.local` to version control. Add it to `.gitignore`.

## 🧪 Testing

### Run Smart Contract Tests

```bash
npx hardhat test
```

Tests are located in `test/TodoList.ts` and verify:
- Contract deployment
- Todo creation and retrieval
- Status updates
- Authorization checks

### Run Specific Test Suite

```bash
npx hardhat test test/TodoList.ts
```

### Generate Test Coverage Report

```bash
npx hardhat coverage
```

## � Smart Contract Auditing

Slither is a powerful static analysis tool for Solidity smart contracts that helps identify security vulnerabilities, code smells, and potential issues before deployment.

### Prerequisites for Auditing

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **pip** - Comes with Python

### Setup Slither

#### Step 1: Create a Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

#### Step 2: Install Slither-Analyzer

```bash
# Install slither-analyzer in the virtual environment
pip install slither-analyzer
```

Verify the installation:

```bash
slither --version
```

### Run Security Audit

#### Basic Audit

```bash
npm run audit
```

This command runs:
```bash
slither ./contracts
```

And will analyze all Solidity files in the `contracts/` directory.

#### Detailed Audit Report

For a more comprehensive analysis with JSON output:

```bash
slither ./contracts --json report.json
```

This generates a detailed JSON report in `report.json` that can be reviewed programmatically.

#### Audit Specific Contract

To audit only the TodoList contract:

```bash
slither ./contracts/TodoList.sol
```

### Understanding Slither Output

Slither reports vulnerabilities and issues with severity levels:

- **High** - Critical security issues that must be fixed
- **Medium** - Issues that should be addressed
- **Low** - Code quality and best practice recommendations
- **Informational** - Additional information and observations

### Common Issues Found and How to Fix

**Example Output:**
```
TodoList.sol:15:5: [reentrancy] Reentrancy vulnerability detected
TodoList.sol:42:5: [unused-return] Return value not used
TodoList.sol:89:3: [naming-convention] Function name doesn't follow conventions
```

### Audit Checklist Before Deployment

- [ ] Run `npm run test` - All tests pass
- [ ] Run `npm run audit` - No high/critical issues
- [ ] Review Slither report for medium-severity issues
- [ ] Check for reentrancy vulnerabilities
- [ ] Verify access controls
- [ ] Ensure input validation
- [ ] Check for overflow/underflow issues

### Deactivate Virtual Environment

When finished with auditing, deactivate the virtual environment:

```bash
deactivate
```

### Troubleshooting Slither

**Issue: `slither: command not found`**

**Solution:**
- Ensure virtual environment is activated: `source venv/bin/activate`
- Verify installation: `pip list | grep slither`
- Reinstall if necessary: `pip install --upgrade slither-analyzer`

**Issue: Python version error**

**Solution:**
- Check Python version: `python3 --version`
- Ensure Python 3.8 or higher is installed
- Create new virtual environment with correct Python version: `python3.11 -m venv venv`

**Issue: Permission denied**

**Solution (macOS/Linux):**
```bash
chmod +x venv/bin/activate
source venv/bin/activate
```

## �🔧 Troubleshooting

### Issue: MetaMask Not Detecting Contract

**Solution:**
- Verify contract address in `.env.local`
- Ensure MetaMask is connected to correct network
- Refresh the page (Cmd+R / Ctrl+R)
- Check browser console for errors (F12)

### Issue: "Insufficient Funds" Error

**Solution (Local):**
- Use a different account from Hardhat node
- All accounts have 10,000 test ETH by default

**Solution (Sepolia):**
- Request more test ETH from [Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- Wait 15-30 minutes for transaction to confirm

### Issue: RPC URL Connection Failed

**Solution:**
- Verify RPC endpoint is correct
- Check internet connection
- Try a different RPC provider (Infura, Alchemy, QuickNode)
- Ensure Hardhat node is running (for localhost)

### Issue: "Network not detected" in MetaMask

**Solution:**
- Verify network configuration in MetaMask:
  - **Localhost:** Chain ID must be `31337`, RPC: `http://127.0.0.1:8545`
  - **Sepolia:** Chain ID must be `11155111`
- Remove and re-add the network
- Restart MetaMask

### Issue: Contract Not Deploying

**Solution:**
- Check that Hardhat node is running for local deployment
- Verify private key has sufficient funds (Sepolia)
- Review error message in terminal for details
- Run `npm run clean` to clear previous builds

### Issue: Hot Reload Not Working

**Solution:**
- Restart development server: `npm run dev`
- Clear Next.js cache: `rm -rf .next`
- Clear browser cache (F12 → Network → Disable cache, refresh)

## 📚 Additional Resources

### Official Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Hardhat Ignition Guide](https://hardhat.org/ignition)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)

### Testnet Resources
- [Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Sepolia Block Explorer](https://sepolia.etherscan.io/)
- [MetaMask Support](https://support.metamask.io/)

### Web3 Learning
- [Ethereum Development Documentation](https://ethereum.org/developers)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Buildspace Web3 Tutorials](https://buildspace.so/)

## 📄 License

This project is open source and available under the MIT License.

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or review the project issues on GitHub.
