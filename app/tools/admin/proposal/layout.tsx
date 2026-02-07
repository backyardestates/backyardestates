import {
    SignOutButton,
    SignedIn,
} from '@clerk/nextjs'


export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            {/* Show the sign-in and sign-up buttons when the user is signed out */}
            <SignOutButton />
            {/* Show the user button when the user is signed in */}
            <SignedIn>
                {children}
            </SignedIn>
        </>
    )
}