"use client";

import React from 'react'
import { useContext } from "react";
import TodoListContext from "../context/TodoListContext";

const page = () => {
    const { contractAddress, currentAccount, fetchTotalTodos } = useContext(TodoListContext);
    return (
        <div>
            <h1>Home Page</h1>
            <p>Contract Address: {contractAddress}</p>
            <p>Current Account: {currentAccount}</p>
        </div>
    )
}

export default page