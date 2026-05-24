import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @module TodoListModule
 * @description Hardhat Ignition deployment module for the TodoList contract.
 *
 * Usage:
 *   npx hardhat ignition deploy ignition/modules/TodoListModule.ts --network <network>
 *
 * With a specific deployment ID (idempotent re-runs):
 *   npx hardhat ignition deploy ignition/modules/TodoListModule.ts \
 *     --network <network> \
 *     --deployment-id todolist-v1
 *
 * Verify on Etherscan after deployment:
 *   npx hardhat ignition verify --network <network> --deployment-id todolist-v1
 */
const TodoListModule = buildModule("TodoListModule", (m) => {

  // ─────────────────────────────────────────────
  //  Parameters (overridable at deploy time)
  // ─────────────────────────────────────────────

  /**
   * The account that pays for deployment gas.
   * Defaults to the first configured Hardhat account.
   *
   * Override via parameters file:
   *   npx hardhat ignition deploy ... --parameters ignition/parameters.json
   *
   * parameters.json example:
   *   { "TodoListModule": { "deployer": "0xYourAddress" } }
   */
  const deployer = m.getAccount(0);

  // ─────────────────────────────────────────────
  //  Contract Deployment
  // ─────────────────────────────────────────────

  const todoList = m.contract(
    "TodoList",   // must match the contract name in src/TodoList.sol
    [],           // constructor args (TodoList has none)
    {
      from: deployer,
      // Optional: uncomment to attach a human-readable label in Ignition's UI
      // id: "TodoList_v1",
    }
  );

  // ─────────────────────────────────────────────
  //  Exports
  // ─────────────────────────────────────────────

  /**
   * Returning the contract future lets other modules (e.g. a proxy module
   * or a front-end seed module) import and use this deployment:
   *
   *   import TodoListModule from "./TodoListModule";
   *   const { todoList } = m.useModule(TodoListModule);
   */
  return { todoList };
});

export default TodoListModule;