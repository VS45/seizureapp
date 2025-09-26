// app/unauthorized/page.jsx
export default function Unauthorized() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2">You don't have permission to access this page.</p>
        <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}