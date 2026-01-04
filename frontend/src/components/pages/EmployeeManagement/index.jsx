import React, { useState, useEffect, useRef, useMemo } from 'react';
import { notification } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

// Context
import { useEmployees } from '../../../context/useEmployees'; 

// Components
import DashboardHeader from '../Dashboard/components/DashboardHeader';
import EmployeeTable from '../Dashboard/components/EmployeeTable';
import PrintModal from '../Dashboard/components/PrintModal';
import BulkPrintModal from '../Dashboard/components/BulkPrintModal';

// 1. IMPORT CHECK QUYỀN
import { PERMISSIONS } from '../../utils/permissions';

dayjs.extend(isBetween);

const EmployeeManagement = () => {
  const { employees, loading, fetchEmployees, isLoaded } = useEmployees();
  const hasNotified = useRef(false);

  // --- STATE QUẢN LÝ ---
  const [searchText, setSearchText] = useState('');
  const [viewStatus, setViewStatus] = useState('Active');
  const [dateRange, setDateRange] = useState([null, null]);
  
  // State in ấn
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // 2. PHÂN QUYỀN (SỬA LẠI CHUẨN)
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  
  // Quyền In ấn & Thao tác (Admin, Manager, HR -> True | Staff -> False)
  const canPrint = PERMISSIONS.CAN_OPERATE(user.role);

  // Fetch Data
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) hasNotified.current = false;
    if (isLoaded && !isManualRefresh) return;
    try {
      await fetchEmployees(isManualRefresh);
      if (!hasNotified.current && isManualRefresh) {
        notification.success({ message: 'Làm mới dữ liệu thành công' });
        hasNotified.current = true;
      }
    } catch {
      if (!hasNotified.current) {
        notification.error({ message: 'Không thể tải dữ liệu' });
        hasNotified.current = true;
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Logic Lọc
  const filteredData = useMemo(() => {
    return employees.filter(item => {
      const status = item.employee_status || '';
      const statusMatch = viewStatus === 'All' ? true : (viewStatus === 'Active' ? status === 'Active' : status !== 'Active');
      
      const keyword = searchText.toLowerCase();
      const nameMatch = item.employee_name?.toLowerCase().includes(keyword);
      const idMatch = item.employee_id?.toLowerCase().includes(keyword);
      const deptMatch = item.employee_department?.toLowerCase().includes(keyword);
      
      let dateMatch = true;
      if (dateRange && dateRange[0] && dateRange[1] && item.employee_join_date) {
        const joinDate = dayjs(item.employee_join_date); 
        if (joinDate.isValid()) {
          dateMatch = joinDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
        } else { dateMatch = false; }
      }
      return statusMatch && (nameMatch || idMatch || deptMatch) && dateMatch;
    });
  }, [employees, searchText, viewStatus, dateRange]);

  // 3. ẨN CHECKBOX NẾU KHÔNG CÓ QUYỀN IN
  // Nếu canPrint = false (Staff) -> rowSelection = null (Không hiện ô tích)
  const rowSelection = canPrint ? {
    selectedRowKeys,
    onChange: (newKeys, newRows) => {
      setSelectedRowKeys(newKeys);
      setSelectedRows(newRows);
    },
    preserveSelectedRowKeys: true, 
  } : null;

  const handleOpenPrint = (record) => {
    setSelectedEmployee(record);
    setIsPrintModalOpen(true);
  };

  const handleCloseBulkPrint = () => {
    setIsBulkPrintOpen(false);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setSearchText('');      
    setViewStatus('Active');
    setDateRange([null, null]);
    fetchData(true); 
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <h2 style={{ marginBottom: 20, color: '#001529' }}>Quản lý Danh sách Nhân viên</h2>
      
      <DashboardHeader 
        viewStatus={viewStatus} setViewStatus={setViewStatus}
        searchText={searchText} setSearchText={setSearchText}
        dateRange={dateRange} setDateRange={setDateRange}
        selectedCount={selectedRowKeys.length} 
        
        onBulkPrint={() => setIsBulkPrintOpen(true)}
        onRefresh={() => fetchData(true)} 
        loading={loading}
        
        // 4. TRUYỀN QUYỀN IN XUỐNG HEADER (Để ẩn nút In hàng loạt)
        canPrint={canPrint} 
      />
      
      <EmployeeTable 
        dataSource={filteredData}
        loading={loading}
        onPrint={handleOpenPrint}
        rowSelection={rowSelection}
        
        // 5. TRUYỀN QUYỀN IN XUỐNG TABLE (Để ẩn nút In lẻ từng dòng)
        canPrint={canPrint}
      />

      {/* Chỉ render Modal nếu có quyền (thêm lớp bảo vệ) */}
      {canPrint && (
        <>
            <PrintModal 
                open={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                employee={selectedEmployee}
                onRefresh={() => fetchData(true)}
            />

            <BulkPrintModal 
                open={isBulkPrintOpen}
                onClose={handleCloseBulkPrint}
                selectedEmployees={selectedRows}
            />
        </>
      )}
    </div>
  );
};

export default EmployeeManagement;