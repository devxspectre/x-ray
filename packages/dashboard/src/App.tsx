// Main App component
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import SessionList from './pages/SessionList'
import SessionDetail from './pages/SessionDetail'

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<SessionList />} />
        <Route path="/session/:id" element={<SessionDetail />} />
      </Routes>
    </>
  )
}
