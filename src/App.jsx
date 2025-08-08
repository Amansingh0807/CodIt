import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';


function App() {
    return (
      
            <><div>
            <Toaster
                position="top-right"
                toastOptions={{
                    success: {
                        theme: {
                            primary: '#4aed88',
                        },
                    },
                    error: {
                        theme: {
                            primary: '#f44336', // Red for error
                        },
                    },
                }}
            ></Toaster>
        </div><BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />}></Route>
                    <Route path="/home" element={<Home />} />
                    <Route path="/editor/:roomId" element={<EditorPage />} />
                </Routes>
            </BrowserRouter></>
    
    );
}

export default App;