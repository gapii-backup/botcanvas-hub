import { Routes, Route, Navigate } from 'react-router-dom';
import Step1 from './customize/Step1';
import Step2 from './customize/Step2';
import Step3 from './customize/Step3';
import Complete from './customize/Complete';

export default function Customize() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/customize/step-1" replace />} />
      <Route path="/step-1" element={<Step1 />} />
      <Route path="/step-2" element={<Step2 />} />
      <Route path="/step-3" element={<Step3 />} />
      <Route path="/complete" element={<Complete />} />
    </Routes>
  );
}
