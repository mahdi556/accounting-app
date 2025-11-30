// src/app/layout.js
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import '@styles/persian-datepicker.css'

export const metadata = {
  title: 'سیستم حسابداری',
  description: 'سیستم کامل حسابداری با Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <div className="app-container d-flex">
          <Sidebar />
          <div className="main-content flex-grow-1">
            <Header />
            <main className="content p-3">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}