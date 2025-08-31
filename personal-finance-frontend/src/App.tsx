import { Route, Routes } from 'react-router-dom'
import { AddReceiptData, Dashboard, SummaryPage } from './pages'
import { ROUTES } from './Util/constants'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path={ROUTES.default} element={<Dashboard />} />
        <Route path={ROUTES.summary} element={<SummaryPage />} />
        <Route path={ROUTES.addReceiptData} element={<AddReceiptData />} />
      </Routes>
    </>
  )
}

export default App
