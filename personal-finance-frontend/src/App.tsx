import { Route, Routes } from 'react-router-dom'
import { ROUTES } from './Util/constants'
import { Dashboard, SummaryPage } from './pages'
import './App.css'

function App() {
  return (
    <>
      <Routes>
          <Route path={ROUTES.default} element={<Dashboard />}/>
          <Route path={ROUTES.summary} element={<SummaryPage />}/>
      </Routes>
    </>
  )
}

export default App
