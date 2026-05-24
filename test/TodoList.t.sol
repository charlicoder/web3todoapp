// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/TodoList.sol";

/**
 * @title TodoListTest
 * @dev Full Foundry unit-test suite for the TodoList contract.
 *
 * Run with:
 *   forge test -vv
 *
 * Project layout assumed:
 *   src/TodoList.sol
 *   test/TodoList.t.sol
 *   lib/forge-std/         (forge install foundry-rs/forge-std)
 */
contract TodoListTest is Test {
    // ─────────────────────────────────────────────
    //  Aliases & constants
    // ─────────────────────────────────────────────

    TodoList public todoList;

    address internal ALICE = makeAddr("alice");
    address internal BOB = makeAddr("bob");
    address internal CAROL = makeAddr("carol");

    string internal constant T1 = "Buy groceries";
    string internal constant D1 = "Milk, eggs, bread";
    string internal constant T2 = "Write tests";
    string internal constant D2 = "Cover every branch";
    string internal constant T3 = "Deploy contract";
    string internal constant D3 = "Mainnet go-live";

    // ─────────────────────────────────────────────
    //  Setup
    // ─────────────────────────────────────────────

    function setUp() public {
        todoList = new TodoList();
    }

    // ─────────────────────────────────────────────
    //  Helper
    // ─────────────────────────────────────────────

    /// @dev Creates a todo as `user` and returns its ID.
    function _create(
        address user,
        string memory title,
        string memory desc
    ) internal returns (uint256 id) {
        vm.prank(user);
        id = todoList.createTodo(title, desc);
    }

    // ══════════════════════════════════════════════
    //  1. CREATE TODO
    // ══════════════════════════════════════════════

    function test_CreateTodo_AssignsIncrementalIds() public {
        uint256 id0 = _create(ALICE, T1, D1);
        uint256 id1 = _create(ALICE, T2, D2);
        uint256 id2 = _create(BOB, T3, D3);

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    function test_CreateTodo_StoresCorrectFields() public {
        uint256 id = _create(ALICE, T1, D1);

        TodoList.Todo memory t = todoList.getTodoById(id);

        assertEq(t.id, id);
        assertEq(t.owner, ALICE);
        assertEq(t.title, T1);
        assertEq(t.description, D1);
        assertEq(uint256(t.status), uint256(TodoList.Status.Pending));
        assertTrue(t.exists);
        assertGt(t.createdAt, 0);
        assertEq(t.createdAt, t.updatedAt);
    }

    function test_CreateTodo_EmitsEvent() public {
        vm.expectEmit(true, true, false, false);
        emit TodoList.TodoCreated(0, ALICE, T1, block.timestamp);

        vm.prank(ALICE);
        todoList.createTodo(T1, D1);
    }

    function test_CreateTodo_IncrementsTotalTodos() public {
        assertEq(todoList.totalTodos(), 0);
        _create(ALICE, T1, D1);
        _create(BOB, T2, D2);
        assertEq(todoList.totalTodos(), 2);
    }

    function test_CreateTodo_EmptyTitle_Reverts() public {
        vm.prank(ALICE);
        vm.expectRevert("TodoList: title cannot be empty");
        todoList.createTodo("", D1);
    }

    function test_CreateTodo_EmptyDescription_IsAllowed() public {
        uint256 id = _create(ALICE, T1, "");
        assertEq(todoList.getTodoById(id).description, "");
    }

    // ══════════════════════════════════════════════
    //  2. LIST MY TODOS
    // ══════════════════════════════════════════════

    function test_GetMyTodos_ReturnsOnlyCallerTodos() public {
        _create(ALICE, T1, D1);
        _create(ALICE, T2, D2);
        _create(BOB, T3, D3);

        vm.prank(ALICE);
        TodoList.Todo[] memory myTodos = todoList.getMyTodos();

        assertEq(myTodos.length, 2);
        assertEq(myTodos[0].owner, ALICE);
        assertEq(myTodos[1].owner, ALICE);
    }

    function test_GetMyTodos_EmptyWhenNoneCreated() public {
        vm.prank(ALICE);
        TodoList.Todo[] memory myTodos = todoList.getMyTodos();
        assertEq(myTodos.length, 0);
    }

    function test_GetMyTodo_ByIdAsOwner() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(ALICE);
        TodoList.Todo memory t = todoList.getMyTodo(id);
        assertEq(t.title, T1);
    }

    function test_GetMyTodo_ByIdAsNonOwner_Reverts() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(BOB);
        vm.expectRevert("TodoList: not the owner");
        todoList.getMyTodo(id);
    }

    function test_GetMyTodo_NonExistent_Reverts() public {
        vm.prank(ALICE);
        vm.expectRevert("TodoList: todo does not exist");
        todoList.getMyTodo(999);
    }

    // ══════════════════════════════════════════════
    //  3. UPDATE STATUS
    // ══════════════════════════════════════════════

    function test_UpdateStatus_PendingToInProgress() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(ALICE);
        todoList.updateStatus(id, TodoList.Status.InProgress);

        assertEq(
            uint256(todoList.getTodoById(id).status),
            uint256(TodoList.Status.InProgress)
        );
    }

    function test_UpdateStatus_InProgressToCompleted() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(ALICE);
        todoList.updateStatus(id, TodoList.Status.InProgress);
        vm.prank(ALICE);
        todoList.updateStatus(id, TodoList.Status.Completed);

        assertEq(
            uint256(todoList.getTodoById(id).status),
            uint256(TodoList.Status.Completed)
        );
    }

    function test_UpdateStatus_UpdatesTimestamp() public {
        uint256 id = _create(ALICE, T1, D1);
        uint256 createdAt = todoList.getTodoById(id).createdAt;

        // Warp time forward
        vm.warp(block.timestamp + 100);

        vm.prank(ALICE);
        todoList.updateStatus(id, TodoList.Status.InProgress);

        assertGt(todoList.getTodoById(id).updatedAt, createdAt);
    }

    function test_UpdateStatus_EmitsEvent() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.expectEmit(true, true, false, false);
        emit TodoList.TodoStatusUpdated(
            id,
            ALICE,
            TodoList.Status.Pending,
            TodoList.Status.Completed,
            block.timestamp
        );

        vm.prank(ALICE);
        todoList.updateStatus(id, TodoList.Status.Completed);
    }

    function test_UpdateStatus_SameStatus_Reverts() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(ALICE);
        vm.expectRevert("TodoList: status unchanged");
        todoList.updateStatus(id, TodoList.Status.Pending);
    }

    function test_UpdateStatus_NonOwner_Reverts() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(BOB);
        vm.expectRevert("TodoList: not the owner");
        todoList.updateStatus(id, TodoList.Status.Completed);
    }

    function test_UpdateStatus_NonExistent_Reverts() public {
        vm.prank(ALICE);
        vm.expectRevert("TodoList: todo does not exist");
        todoList.updateStatus(999, TodoList.Status.Completed);
    }

    // ══════════════════════════════════════════════
    //  4. DELETE TODO
    // ══════════════════════════════════════════════

    function test_DeleteTodo_RemovesFromMyList() public {
        uint256 id0 = _create(ALICE, T1, D1);
        uint256 id1 = _create(ALICE, T2, D2);

        vm.prank(ALICE);
        todoList.deleteTodo(id0);

        vm.prank(ALICE);
        TodoList.Todo[] memory myTodos = todoList.getMyTodos();

        assertEq(myTodos.length, 1);
        assertEq(myTodos[0].id, id1);
    }

    function test_DeleteTodo_RemovesFromAllTodos() public {
        uint256 id = _create(ALICE, T1, D1);
        _create(BOB, T2, D2);

        vm.prank(ALICE);
        todoList.deleteTodo(id);

        TodoList.Todo[] memory all = todoList.getAllTodos();
        assertEq(all.length, 1);
        assertEq(all[0].owner, BOB);
    }

    function test_DeleteTodo_EmitsEvent() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.expectEmit(true, true, false, false);
        emit TodoList.TodoDeleted(id, ALICE, block.timestamp);

        vm.prank(ALICE);
        todoList.deleteTodo(id);
    }

    function test_DeleteTodo_DoesNotDecrementTotalTodos() public {
        uint256 id = _create(ALICE, T1, D1);
        assertEq(todoList.totalTodos(), 1);

        vm.prank(ALICE);
        todoList.deleteTodo(id);

        // totalTodos counts ALL IDs, including soft-deleted
        assertEq(todoList.totalTodos(), 1);
    }

    function test_DeleteTodo_GetTodoById_Reverts() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(ALICE);
        todoList.deleteTodo(id);

        vm.expectRevert("TodoList: todo does not exist");
        todoList.getTodoById(id);
    }

    function test_DeleteTodo_NonOwner_Reverts() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(BOB);
        vm.expectRevert("TodoList: not the owner");
        todoList.deleteTodo(id);
    }

    function test_DeleteTodo_NonExistent_Reverts() public {
        vm.prank(ALICE);
        vm.expectRevert("TodoList: todo does not exist");
        todoList.deleteTodo(999);
    }

    function test_DeleteTodo_Twice_Reverts() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(ALICE);
        todoList.deleteTodo(id);

        vm.prank(ALICE);
        vm.expectRevert("TodoList: todo does not exist");
        todoList.deleteTodo(id);
    }

    function test_UpdateStatus_OnDeleted_Reverts() public {
        uint256 id = _create(ALICE, T1, D1);

        vm.prank(ALICE);
        todoList.deleteTodo(id);

        vm.prank(ALICE);
        vm.expectRevert("TodoList: todo does not exist");
        todoList.updateStatus(id, TodoList.Status.Completed);
    }

    // ══════════════════════════════════════════════
    //  5. GET ALL TODOS (multi-user)
    // ══════════════════════════════════════════════

    function test_GetAllTodos_ReturnsAllActiveAcrossUsers() public {
        _create(ALICE, T1, D1);
        _create(BOB, T2, D2);
        _create(CAROL, T3, D3);

        TodoList.Todo[] memory all = todoList.getAllTodos();
        assertEq(all.length, 3);
    }

    function test_GetAllTodos_ExcludesDeleted() public {
        uint256 id0 = _create(ALICE, T1, D1);
        _create(BOB, T2, D2);

        vm.prank(ALICE);
        todoList.deleteTodo(id0);

        TodoList.Todo[] memory all = todoList.getAllTodos();
        assertEq(all.length, 1);
        assertEq(all[0].owner, BOB);
    }

    function test_GetAllTodos_EmptyInitially() public view {
        assertEq(todoList.getAllTodos().length, 0);
    }

    function test_GetTodosOf_AnyUser_PublicRead() public {
        _create(ALICE, T1, D1);
        _create(ALICE, T2, D2);
        _create(BOB, T3, D3);

        // Carol (unrelated) reads Alice's todos
        vm.prank(CAROL);
        TodoList.Todo[] memory aliceTodos = todoList.getTodosOf(ALICE);
        assertEq(aliceTodos.length, 2);
    }

    function test_GetTodosOf_ReturnsEmptyForUnknownUser() public view {
        assertEq(todoList.getTodosOf(CAROL).length, 0);
    }

    // ══════════════════════════════════════════════
    //  6. PAGINATION
    // ══════════════════════════════════════════════

    function test_Paginated_FirstPage() public {
        _create(ALICE, T1, D1);
        _create(BOB, T2, D2);
        _create(CAROL, T3, D3);

        (TodoList.Todo[] memory page, uint256 total) = todoList
            .getAllTodosPaginated(0, 2);

        assertEq(total, 3);
        assertEq(page.length, 2);
        assertEq(page[0].id, 0);
        assertEq(page[1].id, 1);
    }

    function test_Paginated_SecondPage() public {
        _create(ALICE, T1, D1);
        _create(BOB, T2, D2);
        _create(CAROL, T3, D3);

        (TodoList.Todo[] memory page, uint256 total) = todoList
            .getAllTodosPaginated(2, 10);

        assertEq(total, 3);
        assertEq(page.length, 1);
        assertEq(page[0].id, 2);
    }

    function test_Paginated_OffsetBeyondEnd_ReturnsEmpty() public {
        _create(ALICE, T1, D1);

        (TodoList.Todo[] memory page, uint256 total) = todoList
            .getAllTodosPaginated(100, 10);

        assertEq(total, 1);
        assertEq(page.length, 0);
    }

    function test_Paginated_SkipsDeleted() public {
        uint256 id0 = _create(ALICE, T1, D1); // will be deleted
        _create(BOB, T2, D2);
        _create(CAROL, T3, D3);

        vm.prank(ALICE);
        todoList.deleteTodo(id0);

        // window covers all 3 raw slots, but only 2 are active
        (TodoList.Todo[] memory page, uint256 total) = todoList
            .getAllTodosPaginated(0, 10);

        assertEq(total, 3); // raw count unchanged
        assertEq(page.length, 2);
        assertEq(page[0].owner, BOB);
        assertEq(page[1].owner, CAROL);
    }

    function test_Paginated_ZeroLimit_ReturnsEmpty() public {
        _create(ALICE, T1, D1);

        (TodoList.Todo[] memory page, uint256 total) = todoList
            .getAllTodosPaginated(0, 0);

        assertEq(total, 1);
        assertEq(page.length, 0);
    }

    // ══════════════════════════════════════════════
    //  7. FUZZ TESTS
    // ══════════════════════════════════════════════

    /// @dev Fuzz: any non-empty title must be stored correctly.
    function testFuzz_CreateTodo_StoresTitle(string calldata title) public {
        vm.assume(bytes(title).length > 0);
        vm.assume(bytes(title).length < 256); // keep gas reasonable

        uint256 id = _create(ALICE, title, "");
        assertEq(todoList.getTodoById(id).title, title);
    }

    /// @dev Fuzz: random status values (0-2) transition correctly.
    function testFuzz_UpdateStatus_ValidTransitions(uint8 raw) public {
        vm.assume(raw <= 2);
        TodoList.Status newStatus = TodoList.Status(raw);

        uint256 id = _create(ALICE, T1, D1);

        // Only update if it differs from Pending (0)
        if (raw != 0) {
            vm.prank(ALICE);
            todoList.updateStatus(id, newStatus);
            assertEq(uint256(todoList.getTodoById(id).status), raw);
        }
    }

    /// @dev Fuzz: non-owner can never delete a todo.
    function testFuzz_DeleteTodo_NonOwner_AlwaysReverts(
        address attacker
    ) public {
        vm.assume(attacker != ALICE);
        vm.assume(attacker != address(0));

        uint256 id = _create(ALICE, T1, D1);

        vm.prank(attacker);
        vm.expectRevert("TodoList: not the owner");
        todoList.deleteTodo(id);
    }

    // ══════════════════════════════════════════════
    //  8. INVARIANT HELPERS (manual)
    // ══════════════════════════════════════════════

    /// @dev totalTodos() never decreases after operations.
    function test_Invariant_TotalTodosNeverDecreases() public {
        uint256 id0 = _create(ALICE, T1, D1);
        assertEq(todoList.totalTodos(), 1);

        _create(BOB, T2, D2);
        assertEq(todoList.totalTodos(), 2);

        vm.prank(ALICE);
        todoList.deleteTodo(id0);

        // Still 2 — soft delete does not reduce the count
        assertEq(todoList.totalTodos(), 2);
    }

    /// @dev getAllTodos() length ≤ totalTodos() always.
    function test_Invariant_ActiveNeverExceedsTotal() public {
        _create(ALICE, T1, D1);
        uint256 id1 = _create(BOB, T2, D2);
        _create(CAROL, T3, D3);

        vm.prank(BOB);
        todoList.deleteTodo(id1);

        uint256 active = todoList.getAllTodos().length;
        uint256 total = todoList.totalTodos();

        assertLe(active, total);
    }
}
