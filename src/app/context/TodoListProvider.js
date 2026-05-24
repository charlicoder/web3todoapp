"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import TodoListContext from "./TodoListContext";
import { TODO_LIST_ABI, TODO_LIST_ADDRESS } from "../../constant";

// ── Status enum mirror (matches Solidity: 0=Pending, 1=InProgress, 2=Completed)
const StatusLabels = ["Pending", "InProgress", "Completed"];

/**
 * Parse a raw Todo struct returned by ethers into a plain JS object.
 */
const parseTodo = (raw) => ({
    id: Number(raw.id),
    owner: raw.owner,
    title: raw.title,
    description: raw.description,
    status: Number(raw.status),
    statusLabel: StatusLabels[Number(raw.status)] ?? "Unknown",
    createdAt: Number(raw.createdAt),
    updatedAt: Number(raw.updatedAt),
    exists: raw.exists,
});

const TodoListContextProvider = ({ children }) => {
    // ── Wallet state ──────────────────────────────────────────────
    const [currentAccount, setCurrentAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // ── UI state ──────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── Todo state ────────────────────────────────────────────────
    const [todos, setTodos] = useState([]);

    // ── Helpers ───────────────────────────────────────────────────

    /** Get an ethers v6 BrowserProvider (read-only). */
    const getProvider = () => {
        if (!window.ethereum) throw new Error("MetaMask not found");
        return new ethers.BrowserProvider(window.ethereum);
    };

    /** Get a signer (needed for write txns). */
    const getSigner = async () => {
        const provider = getProvider();
        return provider.getSigner();
    };

    /** Get a read-only contract instance. */
    const getReadContract = () => {
        const provider = getProvider();
        return new ethers.Contract(TODO_LIST_ADDRESS, TODO_LIST_ABI, provider);
    };

    /** Get a contract instance connected to the signer (for writes). */
    const getWriteContract = async () => {
        const signer = await getSigner();
        return new ethers.Contract(TODO_LIST_ADDRESS, TODO_LIST_ABI, signer);
    };

    // ═════════════════════════════════════════════════════════════
    //  Wallet Connection
    // ═════════════════════════════════════════════════════════════

    const checkIfWalletIsConnected = async () => {
        try {
            setLoading(true);
            const { ethereum } = window;

            if (!ethereum) {
                console.log("Make sure you have MetaMask installed!");
                setError(new Error("MetaMask not found"));
                return;
            } else {
                console.log("✓ MetaMask detected:", ethereum.isMetaMask);
            }

            const accounts = await ethereum.request({ method: "eth_accounts" });

            if (accounts.length > 0) {
                const account = accounts[0];
                console.log("✓ Found authorized account:", account);
                setCurrentAccount(account);
                setIsConnected(true);
                setError(null);
            } else {
                console.log("No authorized accounts found");
                setIsConnected(false);
            }
        } catch (err) {
            console.error("❌ Error checking wallet connection:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const connectWallet = async () => {
        try {
            setLoading(true);
            const { ethereum } = window;

            if (!ethereum) throw new Error("MetaMask not found");

            // Force MetaMask to show the account chooser popup every time
            await ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }],
            });

            // After the user picks an account, fetch the selected one
            const accounts = await ethereum.request({
                method: "eth_accounts",
            });

            if (accounts.length > 0) {
                const account = accounts[0];
                console.log("✓ Wallet connected:", account);
                setCurrentAccount(account);
                setIsConnected(true);
                setError(null);
            }
        } catch (err) {
            console.error("❌ Error connecting wallet:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Disconnect the wallet (app-level only — MetaMask stays connected).
     * Clears local state so the UI returns to the connect screen.
     */
    const disconnectWallet = () => {
        setCurrentAccount(null);
        setIsConnected(false);
        setTodos([]);
        setError(null);
        console.log("✓ Wallet disconnected (app-level)");
    };

    // ═════════════════════════════════════════════════════════════
    //  Write Functions (require signer / MetaMask approval)
    // ═════════════════════════════════════════════════════════════

    /**
     * Create a new todo on-chain.
     * @param {string} title       - Short title (required, non-empty).
     * @param {string} description - Optional longer description.
     * @returns {number} The newly assigned todo ID.
     */
    const createTodo = async (title, description = "") => {
        try {
            setLoading(true);
            setError(null);
            const contract = await getWriteContract();
            const tx = await contract.createTodo(title, description);
            const receipt = await tx.wait();

            // Parse the TodoCreated event to get the new ID
            const event = receipt.logs
                .map((log) => {
                    try { return contract.interface.parseLog(log); }
                    catch { return null; }
                })
                .find((e) => e?.name === "TodoCreated");

            const newId = event ? Number(event.args.id) : null;
            console.log("✓ Todo created, id:", newId);

            // Refresh the user's todo list
            await fetchMyTodos();
            return newId;
        } catch (err) {
            console.error("❌ Error creating todo:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update the status of one of the caller's todos.
     * @param {number} id        - The todo ID.
     * @param {number} newStatus - 0 = Pending, 1 = InProgress, 2 = Completed.
     */
    const updateStatus = async (id, newStatus) => {
        try {
            setLoading(true);
            setError(null);
            const contract = await getWriteContract();
            const tx = await contract.updateStatus(id, newStatus);
            await tx.wait();
            console.log(`✓ Todo #${id} status updated to ${StatusLabels[newStatus]}`);

            // Refresh the user's todo list
            await fetchMyTodos();
        } catch (err) {
            console.error("❌ Error updating status:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Permanently delete one of the caller's todos (soft-delete on-chain).
     * @param {number} id - The todo ID to delete.
     */
    const deleteTodo = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const contract = await getWriteContract();
            const tx = await contract.deleteTodo(id);
            await tx.wait();
            console.log(`✓ Todo #${id} deleted`);

            // Refresh the user's todo list
            await fetchMyTodos();
        } catch (err) {
            console.error("❌ Error deleting todo:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ═════════════════════════════════════════════════════════════
    //  Read Functions (provider only — no MetaMask popup)
    // ═════════════════════════════════════════════════════════════

    /**
     * Fetch all active todos belonging to the connected wallet.
     * Also updates the `todos` state.
     * @returns {Array} Parsed todo objects.
     */
    const fetchMyTodos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const contract = await getWriteContract(); // needs signer for msg.sender
            const rawTodos = await contract.getMyTodos();
            const parsed = rawTodos.map(parseTodo);
            setTodos(parsed);
            console.log(`✓ Fetched ${parsed.length} of your todos`);
            return parsed;
        } catch (err) {
            console.error("❌ Error fetching my todos:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch a single todo by ID (must be the owner).
     * @param {number} id - The todo ID.
     * @returns {object} Parsed todo object.
     */
    const fetchMyTodo = async (id) => {
        try {
            setError(null);
            const contract = await getWriteContract(); // needs signer for msg.sender
            const raw = await contract.getMyTodo(id);
            return parseTodo(raw);
        } catch (err) {
            console.error(`❌ Error fetching my todo #${id}:`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    /**
     * Fetch ALL active todos across every user.
     * @returns {Array} Parsed todo objects.
     */
    const fetchAllTodos = async () => {
        try {
            setLoading(true);
            setError(null);
            const contract = getReadContract();
            const rawTodos = await contract.getAllTodos();
            const parsed = rawTodos.map(parseTodo);
            console.log(`✓ Fetched ${parsed.length} total todos`);
            return parsed;
        } catch (err) {
            console.error("❌ Error fetching all todos:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch todos with pagination.
     * @param {number} offset - Start index.
     * @param {number} limit  - Max results.
     * @returns {{ todos: Array, total: number }}
     */
    const fetchAllTodosPaginated = async (offset, limit) => {
        try {
            setLoading(true);
            setError(null);
            const contract = getReadContract();
            const [rawTodos, total] = await contract.getAllTodosPaginated(offset, limit);
            const parsed = rawTodos.map(parseTodo);
            console.log(`✓ Fetched page: ${parsed.length} todos (total raw: ${Number(total)})`);
            return { todos: parsed, total: Number(total) };
        } catch (err) {
            console.error("❌ Error fetching paginated todos:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            return { todos: [], total: 0 };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch all active todos for a specific user address.
     * @param {string} userAddress - The wallet address to query.
     * @returns {Array} Parsed todo objects.
     */
    const fetchTodosOf = async (userAddress) => {
        try {
            setLoading(true);
            setError(null);
            const contract = getReadContract();
            const rawTodos = await contract.getTodosOf(userAddress);
            const parsed = rawTodos.map(parseTodo);
            console.log(`✓ Fetched ${parsed.length} todos for ${userAddress}`);
            return parsed;
        } catch (err) {
            console.error(`❌ Error fetching todos of ${userAddress}:`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch a single todo by ID (public read, any user).
     * @param {number} id - The todo ID.
     * @returns {object} Parsed todo object.
     */
    const fetchTodoById = async (id) => {
        try {
            setError(null);
            const contract = getReadContract();
            const raw = await contract.getTodoById(id);
            return parseTodo(raw);
        } catch (err) {
            console.error(`❌ Error fetching todo #${id}:`, err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
    };

    /**
     * Get the total number of todos ever created (including deleted).
     * @returns {number}
     */
    const fetchTotalTodos = async () => {
        try {
            setError(null);
            const contract = getReadContract();
            const total = await contract.totalTodos();
            return Number(total);
        } catch (err) {
            console.error("❌ Error fetching total todos:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            return 0;
        }
    };

    // ═════════════════════════════════════════════════════════════
    //  Effects
    // ═════════════════════════════════════════════════════════════

    // Check wallet connection on mount and setup event listeners
    useEffect(() => {
        if (typeof window !== "undefined") {
            checkIfWalletIsConnected();

            const { ethereum } = window;
            if (ethereum) {
                const handleAccountsChanged = (accounts) => {
                    if (accounts.length > 0) {
                        console.log("Account changed to:", accounts[0]);
                        setCurrentAccount(accounts[0]);
                        setIsConnected(true);
                    } else {
                        console.log("Wallet disconnected");
                        setCurrentAccount(null);
                        setIsConnected(false);
                        setTodos([]);
                    }
                };

                const handleChainChanged = () => {
                    console.log("Chain changed, reconnecting...");
                    checkIfWalletIsConnected();
                };

                ethereum.on("accountsChanged", handleAccountsChanged);
                ethereum.on("chainChanged", handleChainChanged);

                // Cleanup listeners on unmount
                return () => {
                    ethereum.removeListener("accountsChanged", handleAccountsChanged);
                    ethereum.removeListener("chainChanged", handleChainChanged);
                };
            }
        }
    }, []);

    // Auto-fetch the user's todos when they connect
    useEffect(() => {
        if (isConnected && currentAccount) {
            fetchMyTodos();
        }
    }, [isConnected, currentAccount, fetchMyTodos]);

    // ═════════════════════════════════════════════════════════════
    //  Provider Value
    // ═════════════════════════════════════════════════════════════

    return (
        <TodoListContext.Provider
            value={{
                // ── State ─────────────────────────────────────
                currentAccount,
                isConnected,
                loading,
                error,
                todos,
                contractAddress: TODO_LIST_ADDRESS,

                // ── Wallet ────────────────────────────────────
                checkIfWalletIsConnected,
                connectWallet,
                disconnectWallet,

                // ── Write (tx) ────────────────────────────────
                createTodo,
                updateStatus,
                deleteTodo,

                // ── Read ──────────────────────────────────────
                fetchMyTodos,
                fetchMyTodo,
                fetchAllTodos,
                fetchAllTodosPaginated,
                fetchTodosOf,
                fetchTodoById,
                fetchTotalTodos,
            }}
        >
            {children}
        </TodoListContext.Provider>
    );
};

export default TodoListContextProvider;
