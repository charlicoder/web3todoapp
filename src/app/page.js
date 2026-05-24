"use client";

import { useContext, useState, useEffect } from "react";
import TodoListContext from "./context/TodoListContext";
import SettingsContext from "./context/SettingsContext";

const truncateAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}···${addr.slice(-4)}`;
};

// ── Tab IDs ───────────────────────────────────────────────
const TAB_MY = "my";
const TAB_ALL = "all";

// ══════════════════════════════════════════════════════════
//  Main Page Component
// ═══════════════════════════════════════════════════════

export default function Home() {
    const {
        currentAccount,
        isConnected,
        loading,
        error,
        todos,
        contractAddress,
        connectWallet,
        disconnectWallet,
        createTodo,
        updateStatus,
        deleteTodo,
        fetchMyTodos,
        fetchAllTodos,
    } = useContext(TodoListContext);

    const {
        theme,
        language,
        toggleTheme,
        setLanguage,
        t,
        currentLanguageConfig,
        languages
    } = useContext(SettingsContext);

    // ── Local state ───────────────────────────────────────
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState(TAB_MY);
    const [allTodos, setAllTodos] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // Close dropdown on click outside
    useEffect(() => {
        if (!showLangDropdown) return;
        const closeDropdown = () => setShowLangDropdown(false);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, [showLangDropdown]);

    // ── Status helpers ────────────────────────────────────────
    const STATUS_CONFIG = {
        0: { label: t("statusPending"), badge: "badge-pending", icon: "⏳" },
        1: { label: t("statusProgress"), badge: "badge-progress", icon: "🔄" },
        2: { label: t("statusCompleted"), badge: "badge-completed", icon: "✅" },
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "—";
        try {
            return new Date(timestamp * 1000).toLocaleDateString(language, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            return new Date(timestamp * 1000).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    };

    // ── Fetch all todos when tab switches ─────────────────
    useEffect(() => {
        if (activeTab === TAB_ALL && isConnected) {
            (async () => {
                setLoadingAll(true);
                const result = await fetchAllTodos();
                setAllTodos(result || []);
                setLoadingAll(false);
            })();
        }
    }, [activeTab, isConnected]);

    // ── Handlers ──────────────────────────────────────────
    const handleCreateTodo = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            setIsCreating(true);
            await createTodo(title.trim(), description.trim());
            setTitle("");
            setDescription("");
            setShowForm(false);
            // Refresh local todos lists
            if (activeTab === TAB_ALL) {
                const result = await fetchAllTodos();
                setAllTodos(result || []);
            }
        } catch (err) {
            console.error("Failed to create todo:", err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await updateStatus(id, newStatus);
            if (activeTab === TAB_ALL) {
                const result = await fetchAllTodos();
                setAllTodos(result || []);
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const handleDeleteTodo = async (id) => {
        try {
            await deleteTodo(id);
            if (activeTab === TAB_ALL) {
                const result = await fetchAllTodos();
                setAllTodos(result || []);
            }
        } catch (err) {
            console.error("Failed to delete todo:", err);
        }
    };

    const handleRefreshAll = async () => {
        setLoadingAll(true);
        const result = await fetchAllTodos();
        setAllTodos(result || []);
        setLoadingAll(false);
    };

    // ── Which list to display based on tab ────────────────
    const displayTodos = activeTab === TAB_MY ? todos : allTodos;
    const isLoadingList = activeTab === TAB_MY ? (loading && todos.length === 0) : loadingAll;

    // ── Universal Header Actions component ────────────────
    const renderHeaderActions = () => (
        <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="btn-theme"
                title={theme === "dark" ? t("themeLight") : t("themeDark")}
            >
                {theme === "dark" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
            </button>

            {/* Language Selector */}
            <div className="lang-selector-container">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowLangDropdown(!showLangDropdown);
                    }}
                    className="btn-lang"
                    title={t("languageSelect")}
                >
                    <span>{currentLanguageConfig.flag}</span>
                    <span className="hidden sm:inline">{currentLanguageConfig.label}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
                {showLangDropdown && (
                    <div className="lang-dropdown">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setShowLangDropdown(false);
                                }}
                                className={`lang-option ${language === lang.code ? "active" : ""}`}
                            >
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Wallet Info & Disconnect (only when connected) */}
            {isConnected && (
                <>
                    <div className="wallet-chip">
                        <span className="dot" />
                        {truncateAddress(currentAccount)}
                    </div>
                    <button
                        id="disconnect-wallet-btn"
                        onClick={disconnectWallet}
                        className="btn-disconnect"
                        title={t("disconnectWalletTitle")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );

    // ══════════════════════════════════════════════════════
    //  Render: Not Connected
    // ══════════════════════════════════════════════════════
    if (!isConnected) {
        return (
            <div className="min-h-screen flex flex-col justify-between relative overflow-hidden">
                {/* Animated background */}
                <div className="bg-mesh" />

                {/* Top header bar - full width */}
                <header className="navbar-header">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                                style={{ background: "var(--accent-gradient)" }}
                            >
                                ✦
                            </div>
                            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                                {t("title")}
                            </h1>
                        </div>

                        {renderHeaderActions()}
                    </div>
                </header>

                {/* Main Centered Content */}
                <div className="relative z-10 flex-1 flex items-center justify-center text-center max-w-lg mx-auto px-6 py-12">
                    <div className="animate-fade-in w-full">
                        {/* Logo / Icon */}
                        <div
                            className="mx-auto mb-8 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                            style={{ background: "var(--accent-gradient)" }}
                        >
                            ✦
                        </div>

                        <h1 className="text-5xl font-bold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
                            {t("title")}
                        </h1>
                        <p className="text-lg mb-10" style={{ color: "var(--text-secondary)" }}>
                            {t("subtitle1")}
                            <br />
                            {t("subtitle2")}
                        </p>

                        <button
                            id="connect-wallet-btn"
                            onClick={connectWallet}
                            disabled={loading}
                            className="btn-gradient text-lg px-10 py-4 shadow-xl"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    {t("connecting")}
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                                        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                                        <circle cx="18" cy="16" r="2" />
                                    </svg>
                                    {t("connectWallet")}
                                </>
                            )}
                        </button>

                        <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
                            {t("requiresWallet")}
                        </p>
                    </div>

                    {error && (
                        <div className="error-banner mt-8 justify-center">
                            <span>⚠</span>
                            <span>{error.message}</span>
                        </div>
                    )}
                </div>

                {/* Empty footer for spacer */}
                <footer className="py-6" />
            </div>
        );
    }

    // ══════════════════════════════════════════════════════
    //  Render: Connected — Dashboard
    // ══════════════════════════════════════════════════════
    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
            {/* Animated background */}
            <div className="bg-mesh" />

            {/* Top header bar - full width */}
            <header className="navbar-header animate-fade-in">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                            style={{ background: "var(--accent-gradient)" }}
                        >
                            ✦
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                            {t("title")}
                        </h1>
                    </div>

                    {renderHeaderActions()}
                </div>
            </header>

            {/* Dashboard Content */}
            <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-6 py-10">
                {/* ── Error Banner ──────────────────────────── */}
                {error && (
                    <div className="error-banner mb-6">
                        <span>⚠</span>
                        <span>{error.message}</span>
                    </div>
                )}

                {/* ── Stats Bar ─────────────────────────────── */}
                <div className="glass-card p-5 mb-8 animate-fade-in-delay-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                                {t("yourTodos")}
                            </p>
                            <p className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                                {todos.length}
                            </p>
                        </div>
                        <div className="flex gap-4 text-center">
                            <div>
                                <p className="text-xl font-bold" style={{ color: "#fbbf24" }}>
                                    {todos.filter((t) => t.status === 0).length}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {t("statusPending")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-bold" style={{ color: "#60a5fa" }}>
                                    {todos.filter((t) => t.status === 1).length}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {t("statusProgress")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xl font-bold" style={{ color: "#34d399" }}>
                                    {todos.filter((t) => t.status === 2).length}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {t("statusDone")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Create Todo Section ───────────────────── */}
                <div className="mb-8 animate-fade-in-delay-2">
                    {!showForm ? (
                        <button
                            id="toggle-create-form"
                            onClick={() => setShowForm(true)}
                            className="btn-gradient w-full py-4 text-base"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {t("createNewTodo")}
                        </button>
                    ) : (
                        <form
                            onSubmit={handleCreateTodo}
                            className="glass-card p-6"
                            id="create-todo-form"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                                    {t("newTodo")}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn-ghost px-3 py-2"
                                    id="close-create-form"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label
                                        htmlFor="todo-title"
                                        className="block text-sm font-medium mb-2"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {t("todoTitleLabel")} <span style={{ color: "var(--danger)" }}>*</span>
                                    </label>
                                    <input
                                        id="todo-title"
                                        type="text"
                                        className="glass-input"
                                        placeholder={t("todoTitlePlaceholder")}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        autoFocus
                                        disabled={isCreating}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="todo-description"
                                        className="block text-sm font-medium mb-2"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {t("todoDescLabel")}
                                    </label>
                                    <textarea
                                        id="todo-description"
                                        className="glass-input"
                                        style={{ minHeight: "80px", resize: "vertical" }}
                                        placeholder={t("todoDescPlaceholder")}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isCreating}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        id="submit-create-todo"
                                        className="btn-gradient flex-1"
                                        disabled={isCreating || !title.trim()}
                                    >
                                        {isCreating ? (
                                            <>
                                                <span className="spinner spinner-sm" />
                                                {t("creatingOnChain")}
                                            </>
                                        ) : (
                                            t("createTodoBtn")
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setTitle("");
                                            setDescription("");
                                        }}
                                        className="btn-ghost"
                                        disabled={isCreating}
                                        id="cancel-create-todo"
                                    >
                                        {t("cancelBtn")}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* ── Tab Navigation ───────────────────────── */}
                <div className="tab-bar mb-6">
                    <button
                        id="tab-my-todos"
                        className={`tab-btn ${activeTab === TAB_MY ? "tab-active" : ""}`}
                        onClick={() => setActiveTab(TAB_MY)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        {t("tabMyTodos")}
                        <span className="tab-count">{todos.length}</span>
                    </button>
                    <button
                        id="tab-all-todos"
                        className={`tab-btn ${activeTab === TAB_ALL ? "tab-active" : ""}`}
                        onClick={() => setActiveTab(TAB_ALL)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {t("tabAllTodos")}
                        {allTodos.length > 0 && <span className="tab-count">{allTodos.length}</span>}
                    </button>
                </div>

                {/* ── All Todos refresh button ──────────────── */}
                {activeTab === TAB_ALL && (
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            {t("allTodosSubtitle")}
                        </p>
                        <button
                            id="refresh-all-todos"
                            onClick={handleRefreshAll}
                            className="btn-ghost text-xs px-3 py-1.5"
                            disabled={loadingAll}
                        >
                            {loadingAll ? (
                                <span className="spinner spinner-sm" />
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" />
                                        <polyline points="1 20 1 14 7 14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                                        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                                    </svg>
                                    {t("refreshBtn")}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* ── Todo List ─────────────────────────────── */}
                <section>
                    {isLoadingList ? (
                        <div className="text-center py-16">
                            <span className="spinner mx-auto mb-4" style={{ width: 32, height: 32, borderTopColor: "#8b5cf6" }} />
                            <p style={{ color: "var(--text-muted)" }}>
                                {activeTab === TAB_MY ? t("loadingMyTodos") : t("loadingAllTodos")}
                            </p>
                        </div>
                    ) : displayTodos.length === 0 ? (
                        <div className="glass-card text-center py-16 px-8">
                            <div className="text-5xl mb-4 opacity-40">
                                {activeTab === TAB_MY ? "📋" : "🌐"}
                            </div>
                            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                                {activeTab === TAB_MY ? t("noMyTodosTitle") : t("noAllTodosTitle")}
                            </h3>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                {activeTab === TAB_MY
                                    ? t("noMyTodosSubtitle")
                                    : t("noAllTodosSubtitle")}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {displayTodos.map((todo) => {
                                const config = STATUS_CONFIG[todo.status] || STATUS_CONFIG[0];
                                const isOwner = todo.owner?.toLowerCase() === currentAccount?.toLowerCase();
                                return (
                                    <div
                                        key={`${activeTab}-${todo.id}`}
                                        className="todo-item"
                                        id={`todo-item-${activeTab}-${todo.id}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                    <h3
                                                        className="text-base font-semibold truncate"
                                                        style={{
                                                            color: "var(--text-primary)",
                                                            textDecoration: todo.status === 2 ? "line-through" : "none",
                                                            opacity: todo.status === 2 ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {todo.title}
                                                    </h3>
                                                    <span className={`badge ${config.badge}`}>
                                                        {config.icon} {config.label}
                                                    </span>
                                                    {activeTab === TAB_ALL && isOwner && (
                                                        <span className="badge badge-owner">{t("badgeYou")}</span>
                                                    )}
                                                </div>

                                                {todo.description && (
                                                    <p
                                                        className="text-sm mt-1 leading-relaxed"
                                                        style={{ color: "var(--text-muted)" }}
                                                    >
                                                        {todo.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                    {activeTab === TAB_ALL && (
                                                        <span
                                                            className="text-xs font-mono"
                                                            style={{ color: "var(--text-muted)", opacity: 0.7 }}
                                                            title={todo.owner}
                                                        >
                                                            👤 {truncateAddress(todo.owner)}
                                                        </span>
                                                    )}
                                                    <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                                                        {t("todoCreated")} {formatDate(todo.createdAt)}
                                                        {todo.updatedAt !== todo.createdAt && (
                                                            <> · {t("todoUpdated")} {formatDate(todo.updatedAt)}</>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions — only show for owned todos */}
                                            {(activeTab === TAB_MY || isOwner) && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {todo.status === 0 && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(todo.id, 1)}
                                                            className="btn-ghost text-xs px-3 py-1.5"
                                                            disabled={loading}
                                                            id={`start-todo-${todo.id}`}
                                                            title={t("actionStart")}
                                                        >
                                                            ▶ {t("actionStart")}
                                                        </button>
                                                    )}
                                                    {todo.status === 1 && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(todo.id, 2)}
                                                            className="btn-ghost text-xs px-3 py-1.5"
                                                            disabled={loading}
                                                            id={`complete-todo-${todo.id}`}
                                                            title={t("actionComplete")}
                                                        >
                                                            ✓ {t("statusDone")}
                                                        </button>
                                                    )}
                                                    {todo.status === 2 && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(todo.id, 0)}
                                                            className="btn-ghost text-xs px-3 py-1.5"
                                                            disabled={loading}
                                                            id={`reopen-todo-${todo.id}`}
                                                            title={t("actionReopen")}
                                                        >
                                                            ↩ {t("actionReopen")}
                                                        </button>
                                                    )}

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDeleteTodo(todo.id)}
                                                        className="btn-ghost text-xs px-3 py-1.5"
                                                        style={{ color: "var(--danger)" }}
                                                        disabled={loading}
                                                        id={`delete-todo-${todo.id}`}
                                                        title={t("actionDelete")}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── Footer ───────────────────────────────── */}
                <footer className="mt-16 pt-8 text-center" style={{ borderTop: "1px solid var(--border-glass)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("contractLabel")}&nbsp;
                        <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                            {truncateAddress(contractAddress)}
                        </span>
                    </p>
                </footer>
            </main>
        </div>
    );
}
