import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { notification } from 'antd';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Context
import { useEmployees } from '../../../context/useEmployees';

// Components
import DashboardHeader from '../Dashboard/components/DashboardHeader';
import EmployeeTable from '../Dashboard/components/EmployeeTable';
import PrintModal from '../Dashboard/components/PrintModal';
import BulkPrintModal from '../Dashboard/components/BulkPrintModal';

// Check quyền
import { PERMISSIONS } from '../../utils/permissions';

// Kích hoạt Plugins
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// ----------------------------------------------------------------------
// 🛠️ HÀM HELPER: FORMAT NGÀY AN TOÀN (Tránh lỗi Invalid Date)
// ----------------------------------------------------------------------
const safeFormatDate = (dateStr, includeTime = false) => {
  if (!dateStr) return '';

  // Danh sách các định dạng đầu vào có thể gặp trong DB/API
  const parseFormats = [
    'ISO_8601',
    'DD/MM/YYYY',
    'DD-MM-YYYY',
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'DD/MM/YYYY HH:mm:ss',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss.SSSZ', // ISO chuẩn
  ];

  // Thử parse với danh sách định dạng trên
  const d = dayjs(dateStr, parseFormats);

  // Nếu parse thất bại (Invalid Date), trả về rỗng để file Excel sạch đẹp
  if (!d.isValid()) {
    return '';
  }

  // Format đầu ra
  return includeTime ? d.format('DD/MM/YYYY HH:mm') : d.format('DD/MM/YYYY');
};

const EmployeeManagement = () => {
  // --- [MỚI] CẤU HÌNH BASE URL CHO API ---
  // Logic này đảm bảo chạy đúng trên cả Localhost (cổng 8000) và Docker (qua Nginx /api)
  let baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    baseUrl = 'http://localhost:8000/api';
  }
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  // ---------------------------------------

  // 1. HOOKS & CONTEXT
  const { employees, loading, fetchEmployees, isLoaded } = useEmployees();
  const hasNotified = useRef(false);

  // 2. STATE QUẢN LÝ UI
  const [searchText, setSearchText] = useState('');
  const [viewStatus, setViewStatus] = useState('Active');

  // 📅 State 1: Ngày vào làm (Cũ)
  const [dateRange, setDateRange] = useState([null, null]);

  // 🆕 State 2: Ngày nghỉ việc (Mới - Tách biệt hoàn toàn)
  const [resignationDateRange, setResignationDateRange] = useState([null, null]);

  // 🆕 State 3: Loading cho nút Download Photos
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);

  // State in ấn & Phân quyền
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const canManage = PERMISSIONS.CAN_MANAGE_HR_DATA(user.role);

  // 3. FETCH DATA
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

  useEffect(() => {
    fetchData();
  }, []);

  // 4. LOGIC LỌC DỮ LIỆU (LỚP 1 - Lọc từ input bên ngoài)
  const filteredData = useMemo(() => {
    if (!employees) return [];

    return employees.filter((item) => {
      // 4.1. Lọc theo Status
      const status = item.employee_status || '';
      const statusMatch =
        viewStatus === 'All'
          ? true
          : viewStatus === 'Active'
            ? status === 'Active'
            : status !== 'Active';

      // 4.2. Lọc theo Keyword
      const keyword = searchText.toLowerCase();
      const nameMatch = item.employee_name?.toLowerCase().includes(keyword);
      const idMatch = item.employee_id?.toLowerCase().includes(keyword);
      const deptMatch = item.employee_department?.toLowerCase().includes(keyword);

      // 4.3. Lọc theo Date Range (Ngày vào làm)
      let dateMatch = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        if (!item.employee_join_date) {
          dateMatch = false;
        } else {
          let joinDate = dayjs(item.employee_join_date);
          if (!joinDate.isValid()) {
            joinDate = dayjs(item.employee_join_date, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']);
          }
          if (joinDate.isValid()) {
            dateMatch = joinDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
          } else {
            dateMatch = false;
          }
        }
      }

      // 🆕 4.4. Lọc theo Ngày NGHỈ VIỆC (resignationDateRange mới)
      let resignationDateMatch = true;
      if (resignationDateRange && resignationDateRange[0] && resignationDateRange[1]) {
        // Nếu chọn lọc nghỉ việc mà nhân viên chưa có ngày nghỉ -> Loại luôn
        if (!item.employee_left_date) {
          resignationDateMatch = false;
        } else {
          let leftDate = dayjs(item.employee_left_date);
          // Thử parse các kiểu ngày tháng
          if (!leftDate.isValid()) {
            leftDate = dayjs(item.employee_left_date, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']);
          }

          if (leftDate.isValid()) {
            resignationDateMatch = leftDate.isBetween(
              resignationDateRange[0],
              resignationDateRange[1],
              'day',
              '[]'
            );
          } else {
            resignationDateMatch = false; // Data rác -> Loại
          }
        }
      }

      // Kết hợp tất cả điều kiện (AND)
      return (
        statusMatch && (nameMatch || idMatch || deptMatch) && dateMatch && resignationDateMatch
      );
    });
  }, [employees, searchText, viewStatus, dateRange, resignationDateRange]);

  // 5. 🔥 LOGIC REF (LỚP 2 - Dữ liệu thực tế trong bảng)
  // Khởi tạo Ref với giá trị ban đầu là filteredData
  const finalDataRef = useRef(filteredData);

  // 🛠️ ĐỒNG BỘ: Chỉ cập nhật Ref khi filteredData (Lớp 1) THỰC SỰ thay đổi
  useEffect(() => {
    finalDataRef.current = filteredData;
  }, [filteredData]);

  // ⚡ HÀM NHẬN DỮ LIỆU TỪ TABLE (Callback)
  // Khi user lọc/sort TRÊN BẢNG, hàm này chạy và GHI ĐÈ lên Ref
  const handleTableDataChange = useCallback((currentDataSource) => {
    if (currentDataSource) {
      finalDataRef.current = currentDataSource;
    }
  }, []);

  // ----------------------------------------------------------------------
  // 📸 [MỚI] HÀM DOWNLOAD PHOTOS (ZIP)
  // ----------------------------------------------------------------------
  const handleDownloadPhotos = useCallback(async () => {
    // 1. Lấy danh sách nhân viên đang hiển thị
    const currentData = finalDataRef.current;
    if (!currentData || currentData.length === 0) {
      notification.warning({ message: 'Không có nhân viên nào để tải!' });
      return;
    }
    const MAX_DOWNLOAD_LIMIT = 100;

    if (currentData.length > MAX_DOWNLOAD_LIMIT) {
      notification.error({
        message: 'Số lượng quá lớn!',
        description: (
          <div>
            Bạn bị ngáo hả. tải ít thôi. Bạn đang chọn <b>{currentData.length}</b> nhân viên. Hệ
            thống giới hạn tải tối đa <b>{MAX_DOWNLOAD_LIMIT}</b> ảnh mỗi lần để đảm bảo tốc độ.
            <br />
            <b>Vui lòng lọc theo Bộ phận hoặc Team nhỏ hơn.</b>
          </div>
        ),
        duration: 8, // Hiện lâu chút cho họ đọc
      });
      return; // ⛔ Dừng ngay, không gọi API
    }

    // 2. Trích xuất danh sách Mã nhân viên (IDs)
    const employeeIds = currentData.map((emp) => emp.employee_id);
    console.log('--- DOWNLOAD PHOTOS START ---');
    console.log('Total IDs:', employeeIds.length);

    setIsDownloadingImages(true); // Bật trạng thái loading

    try {
      const token = localStorage.getItem('token');

      // 3. Gọi API Backend (Endpoint /download-zip mà bạn vừa viết)
      const response = await fetch(`${baseUrl}/download-zip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Gửi token xác thực nếu cần
        },
        body: JSON.stringify({ employee_ids: employeeIds }),
      });

      // 4. Xử lý lỗi từ Backend
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy bất kỳ ảnh nào cho danh sách nhân viên này.');
        }
        const errData = await response.json();
        throw new Error(errData.detail || 'Lỗi khi tải ảnh từ server.');
      }

      // 5. Xử lý file Binary (Blob) trả về để tải xuống
      const blob = await response.blob();

      // Tạo một URL ảo cho file blob
      const url = window.URL.createObjectURL(blob);

      // Tạo thẻ <a> ẩn để kích hoạt tải xuống
      const a = document.createElement('a');
      a.href = url;
      // Đặt tên file tải về kèm thời gian
      a.download = `Photos_${dayjs().format('DDMM_HHmm')}.zip`;
      document.body.appendChild(a);
      a.click();

      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notification.success({
        message: 'Đang tải xuống...',
        description: 'File ZIP ảnh nhân viên sẽ bắt đầu tải ngay.',
      });
    } catch (error) {
      console.error(error);
      notification.error({
        message: 'Tải ảnh thất bại',
        description: error.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setIsDownloadingImages(false); // Tắt loading dù thành công hay thất bại
    }
  }, [baseUrl]); // Dependency vào baseUrl

  // ----------------------------------------------------------------------
  // 📊 HÀM XUẤT EXCEL
  // ----------------------------------------------------------------------
  const handleExportExcel = useCallback(() => {
    const currentData = finalDataRef.current;

    console.log('--- EXPORT FINAL ---');
    console.log('Data UI (Lớp 1):', filteredData.length);
    console.log('Data Table (Lớp 2):', currentData.length);

    if (!currentData || currentData.length === 0) {
      notification.warning({ message: 'Không có dữ liệu trên bảng để xuất!' });
      return;
    }

    const excelData = currentData.map((item) => ({
      'Mã NV': item.employee_id,
      'Họ và Tên': item.employee_name,
      'Lần In Cuối': safeFormatDate(item.last_printed_at, true),
      'Trạng Thái': item.employee_status,
      'Bộ Phận': item.employee_department,
      'Chức Vụ': item.employee_position,
      'Loại NV': item.employee_type,
      'Giới Tính': item.employee_gender,
      'Ngày Sinh': safeFormatDate(item.employee_birth_date),
      'Chế Độ TS':
        item.maternity_type && item.maternity_type !== 'Normal' ? item.maternity_type : '',
      'Bắt Đầu TS': safeFormatDate(item.maternity_begin),
      'Kết Thúc TS': safeFormatDate(item.maternity_end),
      'Ngày Vào Làm': safeFormatDate(item.employee_join_date),
      'Ngày Nghỉ Việc': safeFormatDate(item.employee_left_date),
      'Loại HĐ': item.contract_type,
      'Số HĐ': item.contract_id,
      'HĐ Bắt Đầu': safeFormatDate(item.contract_begin),
      'HĐ Kết Thúc': safeFormatDate(item.contract_end),
      'Mã Cũ': item.employee_old_id,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const wscols = [
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 8 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách nhân viên');
    const fileName = `DS_NhanVien_${dayjs().format('DDMMYYYY_HHmm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    notification.success({
      message: 'Xuất Excel thành công!',
      description: `Đã xuất ${currentData.length} dòng dữ liệu.`,
    });
  }, [filteredData]);

  // 7. HANDLERS KHÁC
  const rowSelection = canManage
    ? {
        selectedRowKeys,
        onChange: (newKeys, newRows) => {
          setSelectedRowKeys(newKeys);
          setSelectedRows(newRows);
        },
        preserveSelectedRowKeys: true,
      }
    : null;

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
    setResignationDateRange([null, null]);
    fetchData(true);
  };

  // 8. RENDER UI
  return (
    <div style={{ padding: '0 4px' }}>
      <h2 style={{ marginBottom: 20, color: '#001529' }}>Quản lý Danh sách Nhân viên</h2>

      <DashboardHeader
        viewStatus={viewStatus}
        setViewStatus={setViewStatus}
        searchText={searchText}
        setSearchText={setSearchText}
        // Bộ lọc ngày
        dateRange={dateRange}
        setDateRange={setDateRange}
        resignationDateRange={resignationDateRange}
        setResignationDateRange={setResignationDateRange}
        selectedCount={selectedRowKeys.length}
        onBulkPrint={() => setIsBulkPrintOpen(true)}
        onRefresh={() => fetchData(true)}
        loading={loading}
        onExport={handleExportExcel}
        canPrint={canManage}
        // 👇 TRUYỀN PROPS MỚI CHO NÚT DOWNLOAD PHOTOS
        onDownloadImages={handleDownloadPhotos}
        isDownloadingImages={isDownloadingImages}
      />

      <EmployeeTable
        dataSource={filteredData}
        loading={loading}
        onPrint={handleOpenPrint}
        rowSelection={rowSelection}
        canPrint={canManage}
        onTableDataChange={handleTableDataChange}
      />

      {canManage && (
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
