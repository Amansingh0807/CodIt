import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import { SignedIn, SignedOut } from '@clerk/clerk-react';


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
                    <Route
                        path="/home"
                        element={<SignedIn>
                            <Home />
                        </SignedIn>}
                    ></Route>
                    <Route
                        path="/editor/:roomId"
                        element={<SignedIn>
                            <EditorPage />
                        </SignedIn>}
                    ></Route>
                    <Route
                        path="/editor/:roomId"
                        element={<SignedOut>
                            <Navigate to="/" />
                        </SignedOut>}
                    ></Route>
                </Routes>
            </BrowserRouter></>
    
    );
}

export default App;