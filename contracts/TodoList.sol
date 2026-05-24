// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TodoList
 * @dev A decentralized todo list where each user manages their own tasks.
 *      Anyone can read all todos across all users (public ledger).
 */
contract TodoList {

    // ─────────────────────────────────────────────
    //  Data Structures
    // ─────────────────────────────────────────────

    enum Status { Pending, InProgress, Completed }

    struct Todo {
        uint256 id;
        address owner;
        string  title;
        string  description;
        Status  status;
        uint256 createdAt;
        uint256 updatedAt;
        bool    exists;      // soft-delete guard
    }

    // ─────────────────────────────────────────────
    //  Storage
    // ─────────────────────────────────────────────

    /// @dev Global auto-increment ID counter
    uint256 private _nextId;

    /// @dev All todos ever created, keyed by global ID
    mapping(uint256 => Todo) private _todos;

    /// @dev Per-user list of their todo IDs
    mapping(address => uint256[]) private _userTodoIds;

    /// @dev All IDs that have ever been created (to support global listing)
    uint256[] private _allIds;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event TodoCreated(
        uint256 indexed id,
        address indexed owner,
        string  title,
        uint256 createdAt
    );

    event TodoStatusUpdated(
        uint256 indexed id,
        address indexed owner,
        Status  oldStatus,
        Status  newStatus,
        uint256 updatedAt
    );

    event TodoDeleted(
        uint256 indexed id,
        address indexed owner,
        uint256 deletedAt
    );

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    modifier onlyOwner(uint256 id) {
        require(_todos[id].exists,           "TodoList: todo does not exist");
        require(_todos[id].owner == msg.sender, "TodoList: not the owner");
        _;
    }

    modifier todoExists(uint256 id) {
        require(_todos[id].exists, "TodoList: todo does not exist");
        _;
    }

    // ─────────────────────────────────────────────
    //  Write Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Create a new todo item.
     * @param title       Short title (non-empty).
     * @param description Optional longer description.
     * @return id         The newly assigned todo ID.
     */
    function createTodo(
        string calldata title,
        string calldata description
    ) external returns (uint256 id) {
        require(bytes(title).length > 0, "TodoList: title cannot be empty");

        id = _nextId++;

        _todos[id] = Todo({
            id:          id,
            owner:       msg.sender,
            title:       title,
            description: description,
            status:      Status.Pending,
            createdAt:   block.timestamp,
            updatedAt:   block.timestamp,
            exists:      true
        });

        _userTodoIds[msg.sender].push(id);
        _allIds.push(id);

        emit TodoCreated(id, msg.sender, title, block.timestamp);
    }

    /**
     * @notice Update the status of one of your todos.
     * @param id        The todo ID to update.
     * @param newStatus The new status value.
     */
    function updateStatus(uint256 id, Status newStatus)
        external
        onlyOwner(id)
    {
        Status old = _todos[id].status;
        require(old != newStatus, "TodoList: status unchanged");

        _todos[id].status    = newStatus;
        _todos[id].updatedAt = block.timestamp;

        emit TodoStatusUpdated(id, msg.sender, old, newStatus, block.timestamp);
    }

    /**
     * @notice Permanently delete one of your todos.
     * @param id The todo ID to delete.
     */
    function deleteTodo(uint256 id) external onlyOwner(id) {
        _todos[id].exists = false;

        emit TodoDeleted(id, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  Read Functions — My Todos
    // ─────────────────────────────────────────────

    /**
     * @notice Return all active todos belonging to the caller.
     * @return todos Array of Todo structs (deleted items excluded).
     */
    function getMyTodos() external view returns (Todo[] memory todos) {
        uint256[] storage ids = _userTodoIds[msg.sender];
        return _filterActive(ids);
    }

    /**
     * @notice Return a single todo by ID (must be the owner).
     */
    function getMyTodo(uint256 id)
        external
        view
        onlyOwner(id)
        returns (Todo memory)
    {
        return _todos[id];
    }

    // ─────────────────────────────────────────────
    //  Read Functions — All Todos
    // ─────────────────────────────────────────────

    /**
     * @notice Return ALL active todos across every user.
     * @dev    Iterates the full history; fine for moderate scale.
     *         For very large deployments consider pagination via
     *         getAllTodosPaginated().
     */
    function getAllTodos() external view returns (Todo[] memory) {
        return _filterActive(_allIds);
    }

    /**
     * @notice Paginated version of getAllTodos.
     * @param offset  Start index in the raw (including deleted) list.
     * @param limit   Maximum number of active results to return.
     * @return todos  Active todos in the requested window.
     * @return total  Total raw entries (use for pagination math).
     */
    function getAllTodosPaginated(uint256 offset, uint256 limit)
        external
        view
        returns (Todo[] memory todos, uint256 total)
    {
        total = _allIds.length;
        if (offset >= total) {
            return (new Todo[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) end = total;

        // Two-pass: count then fill
        uint256 count;
        for (uint256 i = offset; i < end; i++) {
            if (_todos[_allIds[i]].exists) count++;
        }

        todos = new Todo[](count);
        uint256 idx;
        for (uint256 i = offset; i < end; i++) {
            if (_todos[_allIds[i]].exists) {
                todos[idx++] = _todos[_allIds[i]];
            }
        }
    }

    /**
     * @notice Return all active todos for a specific user (public).
     * @param user The wallet address to query.
     */
    function getTodosOf(address user)
        external
        view
        returns (Todo[] memory)
    {
        return _filterActive(_userTodoIds[user]);
    }

    /**
     * @notice Return a single todo by ID (public read).
     */
    function getTodoById(uint256 id)
        external
        view
        todoExists(id)
        returns (Todo memory)
    {
        return _todos[id];
    }

    /**
     * @notice Total number of todos ever created (including deleted).
     */
    function totalTodos() external view returns (uint256) {
        return _allIds.length;
    }

    // ─────────────────────────────────────────────
    //  Internal Helpers
    // ─────────────────────────────────────────────

    function _filterActive(uint256[] storage ids)
        internal
        view
        returns (Todo[] memory result)
    {
        // Pass 1: count active
        uint256 count;
        for (uint256 i; i < ids.length; i++) {
            if (_todos[ids[i]].exists) count++;
        }

        // Pass 2: fill
        result = new Todo[](count);
        uint256 idx;
        for (uint256 i; i < ids.length; i++) {
            if (_todos[ids[i]].exists) {
                result[idx++] = _todos[ids[i]];
            }
        }
    }
}
