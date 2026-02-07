"use client"
import { Moon,Sun,Computer} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggler() {
    const {theme, setTheme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    },[])

    return (
        <>
        <Button variant={"ghost"}
            onClick={() => {
                if (theme === "light") {
                    setTheme("dark");
                } else if (theme === "dark") {
                    setTheme("system");
                } else if (theme === "system"){
                    setTheme("light");
                }else{
                    setTheme("light");
                }
            }}
            className="mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-1000 ease-in-out"
        >
            {theme==="system" && isMounted ?<Computer />:""}
            {theme==="light" && isMounted ?<Sun />:""}
            {theme==="dark" && isMounted ?<Moon />:""}
        </Button>
        </>

    )
}

