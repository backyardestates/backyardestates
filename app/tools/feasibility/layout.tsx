import {
    SignInButton,
    SignOutButton,
    SignUpButton,
    SignedIn,
    SignedOut,
} from '@clerk/nextjs'


export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <main className="flex justify-end items-center p-4 gap-4 h-16">
            {/* Show the sign-in and sign-up buttons when the user is signed out */}
            <SignOutButton />
            {/* Show the user button when the user is signed in */}
            <SignedIn>
                {children}
            </SignedIn>
        </main>
    )
}