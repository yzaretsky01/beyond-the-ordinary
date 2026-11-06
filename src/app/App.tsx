import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROOMS, lazyAbout, lazyRoom } from '../experiments/registry';
import { ErrorBoundary } from '../ui/room/ErrorBoundary';
import '../ui/controls/controls.css';
import Hall from './hall/Hall';

export default function App() {
  return (
    <Suspense fallback={<p style={{ padding: 24, fontStyle: 'italic' }}>Loading…</p>}>
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
        {ROOMS.filter((r) => r.about).map((r) => {
          const About = lazyAbout(r);
          return (
            <Route
              key={r.id + '/about'}
              path={`/${r.id}/about`}
              element={
                <ErrorBoundary>
                  <About />
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
