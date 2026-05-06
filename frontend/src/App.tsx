import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Game from './pages/Game';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
