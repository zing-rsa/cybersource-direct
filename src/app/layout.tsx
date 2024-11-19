import { Suspense } from "react"

export const metadata = {
  title: 'Next.js',
  description: 'Generated by Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
          <Suspense>
            {children}
          </Suspense>
        </body>
    </html>
  )
}
