import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROOMS, lazyRoom } from '../experiments/registry';
import { ErrorBoundary } from '../ui/room/ErrorBoundary';
import '../ui/controls/controls.css';
import Hall from './hall/Hall';

export default function App() {
  return (
    <Suspense
      fallback={
        <p className="mono" style={{ padding: 24 }}>
          Loading…
        </p>
      }
    >
      <Routes>
        <Route path="/" element={<Hall />} />
        {ROOMS.filter((r) => r.load).map((r) => {
          const Room = lazyRoom(r);
          return (
            <Route
              key={r.id}
              path={`/${r.id}`}
              element={
                <ErrorBoundary>
                  <Room />
                </ErrorBoundary>
              }
            />
          );
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
