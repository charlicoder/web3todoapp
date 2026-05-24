import { network } from "hardhat";

async function main() {
    const { ethers } = await network.create();
    console.log("🚀 Starting TodoList deployment...");

    // Deploy the TodoList contract
    const todoList = await ethers.deployContract("TodoList");

    // Wait for the deployment to be completed and mined
    await todoList.waitForDeployment();

    const contractAddress = await todoList.getAddress();
    console.log(`✅ TodoList contract deployed successfully!`);
    console.log(`📌 Contract Address: ${contractAddress}`);
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});