import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import { ROUTES } from './Util/constants'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
          <Route path={ROUTES.default} element={<Dashboard />}/>
      </Routes>
    </>
  )
}

export default App
