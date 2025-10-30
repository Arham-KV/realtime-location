// import './leaflet-fix';
// import React from 'react'
// import { createRoot } from 'react-dom/client'
// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import './styles.css'
// import Login from './pages/Login'
// import Dashboard from './pages/Dashboard'
// import SharePage from './pages/SharePage'
// import Viewer from './pages/Viewer'

// function App(){
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path='/' element={<Login/>}/>
//         <Route path='/dashboard' element={<Dashboard/>}/>
//         <Route path='/share/:token' element={<SharePage/>}/>
//         <Route path='/track/:token' element={<Viewer/>}/>
//       </Routes>
//     </BrowserRouter>
//   )
// }

// createRoot(document.getElementById('root')).render(<App/>)





import './leaflet-fix';
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SharePage from './pages/SharePage'
import Viewer from './pages/Viewer'
import Analytics from './pages/Analytics' // ✅ Yeh line add karo

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/share/:token' element={<SharePage/>}/>
        <Route path='/track/:token' element={<Viewer/>}/>
        <Route path='/analytics/:token' element={<Analytics/>}/> {/* ✅ Yeh line add karo */}
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App/>)