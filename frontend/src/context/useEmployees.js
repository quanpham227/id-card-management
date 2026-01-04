import { useContext } from 'react';
import { EmployeeContext } from './EmployeeContext'; // Import từ file 1

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};