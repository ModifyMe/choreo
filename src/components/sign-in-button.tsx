"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface SignInButtonProps {
    text?: string
    size?: "default" | "sm" | "lg" | "icon"
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    className?: string
}

export function SignInButton({ text = "Sign In", size = "default", variant = "default", className }: SignInButtonProps) {
    return (
        <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            size={size}
            variant={variant}
            className={className}
        >
            {text}
        </Button>
    )
}
