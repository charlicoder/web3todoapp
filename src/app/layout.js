import "./globals.css";
import TodoListContextProvider from "./context/TodoListProvider";
import SettingsProvider from "./context/SettingsProvider";

export const metadata = {
    title: "Web3 Todo — Decentralized Task Manager",
    description:
        "A beautiful decentralized todo list powered by Ethereum smart contracts. Create, manage, and track your tasks on-chain.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="h-full">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen flex flex-col">
                <SettingsProvider>
                    <TodoListContextProvider>
                        {children}
                    </TodoListContextProvider>
                </SettingsProvider>
            </body>
        </html>
    );
}
