import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Ainnovate Dashboard Test</h1>
        <p className="mb-4">Si ves esto, la app está funcionando básicamente.</p>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setCount(count + 1)}
        >
          Contador: {count}
        </button>
      </div>
    </div>
  )
}

export default App
