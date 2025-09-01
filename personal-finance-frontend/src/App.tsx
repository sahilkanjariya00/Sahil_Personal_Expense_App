import { Navigate, Route, Routes } from 'react-router-dom'
import { AddReceiptData, Dashboard, LoginPage, RegisterPage, SummaryPage } from './pages'
import { useAuth } from './hooks/authHook';
import { ROUTES } from './Util/constants'
import './App.css'

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Routes>
        {!isAuthenticated ?
          <>
            <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />
          </> :
          <>
            <Route path="*" element={<Navigate to={ROUTES.default} replace />} />
            <Route path={ROUTES.default} element={<Dashboard />} />
            <Route path={ROUTES.summary} element={<SummaryPage />} />
            <Route path={ROUTES.addReceiptData} element={<AddReceiptData />} />
          </>
        }
      </Routes>
    </>
  )
}

export default App
