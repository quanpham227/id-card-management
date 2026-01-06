import React, { useState, useEffect } from 'react';
import { message, Modal } from 'antd';
import axiosClient from '../../../api/axiosClient';
import * as XLSX from 'xlsx'; // Import thư viện Excel
import dayjs from 'dayjs';

// IMPORT CÁC COMPONENTS
import AssetStats from './AssetStats';
import AssetFormModal from './AssetFormModal';
import AssetTable from './AssetTable'; 
import AssetHeader from './AssetHeader';
import AssetHistoryDrawer from './AssetHistoryDrawer';

// IMPORT HOOK TỪ CONTEXT
import { useEmployees } from '../../../context/useEmployees';

// IMPORT PERMISSIONS
import { PERMISSIONS } from '../../utils/permissions';

const AssetManager = ({ defaultType }) => {
  // --- 1. DỮ LIỆU TỪ CONTEXT ---
  const { employees, fetchEmployees } = useEmployees();

  // --- 2. STATE ---
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // State Modal & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); 
  const [submitting, setSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState(null);

  // --- 3. PHÂN QUYỀN ---
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEditAsset = PERMISSIONS.IS_ADMIN(user.role);

  // --- 4. CALL API ---
  useEffect(() => { 
    loadAssetsData();
    loadEmployeesData(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssetsData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/assets');
      if (Array.isArray(res.data)) {
          setAssets(res.data);
      } else {
          setAssets([]); 
      }
    } catch (error) {
      console.error('Lỗi tải Assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeesData = async () => {
    try {
       if (employees.length === 0) {
           await fetchEmployees();
       }
    } catch (error) {
       console.error("Lỗi tải Employees:", error);
    }
  };

  // --- 5. XỬ LÝ XÓA ---
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/assets/${id}`);
      message.success("Deleted successfully");
      loadAssetsData(); 
    } catch { 
      message.error("Delete failed"); 
    }
  };

  // --- 6. XỬ LÝ LƯU (THÊM/SỬA) ---
  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      let assignedUserObject = null;

      // Logic xử lý Assign Mode (Internal/Manual)
      if (values.assignMode === 'internal') {
          const selectedEmp = employees.find(e => e.employee_id === values.assigned_id);
          if (selectedEmp) {
              assignedUserObject = {
                employee_id: selectedEmp.employee_id,
                employee_name: selectedEmp.employee_name,
                department: selectedEmp.employee_department
              };
          }
      } else {
          if (values.manual_emp_id && values.manual_emp_name) {
              assignedUserObject = {
                employee_id: values.manual_emp_id,
                employee_name: values.manual_emp_name,
                department: values.manual_emp_dept || 'External'
              };
          }
      }
      
      const assetData = {
        ...values,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
        usage_status: values.usage_status, 
        assigned_to: assignedUserObject,
        specs: { 
          cpu: values.cpu, 
          ram: values.ram, 
          storage: values.storage, 
          mainboard: values.mainboard 
        },
        software: { 
          os: values.os, 
          office: values.office 
        },
        monitor: (values.type === 'PC') ? { model: values.monitor_model } : null,
        notes: values.notes 
      };

      // Clean data
      delete assetData.assignMode;
      delete assetData.assigned_id;
      delete assetData.manual_emp_id;
      delete assetData.manual_emp_name;
      delete assetData.manual_emp_dept;

      if (editingAsset) {
        await axiosClient.put(`/assets/${editingAsset.id}`, assetData);
        message.success("Updated successfully");
      } else {
        await axiosClient.post('/assets', assetData);
        message.success("Created successfully");
      }
      setIsModalOpen(false);
      loadAssetsData(); 
    } catch (error) { 
      console.error('Save error:', error);
      message.error("Save Error"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleViewHistory = (asset) => {
    setViewingAsset(asset);
    setHistoryOpen(true);
  };

  // --- 7. LOGIC LỌC DỮ LIỆU ---
  const safeAssets = Array.isArray(assets) ? assets : [];

  const filteredAssets = safeAssets.filter(item => {
    if (defaultType && item.type !== defaultType) return false;
    if (!searchText) return true;
    const kw = searchText.toLowerCase();
    
    return (
      item.asset_code?.toLowerCase().includes(kw) || 
      item.model?.toLowerCase().includes(kw) ||
      item.assigned_to?.employee_name?.toLowerCase().includes(kw) ||
      item.assigned_to?.department?.toLowerCase().includes(kw)
    );
  });

  // --- 8. HÀM XUẤT EXCEL ---
  const handleExportExcel = () => {
    if (filteredAssets.length === 0) {
        message.warning("No data to export");
        return;
    }
    const dataToExport = filteredAssets.map((item, index) => {
        const user = item.assigned_to?.employee_name || 'Stock / Unassigned';
        const dept = item.assigned_to?.department || '';
        const empId = item.assigned_to?.employee_id || '';
        return {
            "No": index + 1,
            "Asset Code": item.asset_code,
            "Type": item.type,
            "Model": item.model,
            "Health": item.health_status,
            "Status": item.usage_status,
            "User Name": user,
            "Department": dept,
            "Emp ID": empId,
            "Purchase Date": item.purchase_date,
            "CPU": item.specs?.cpu || '',
            "RAM": item.specs?.ram || '',
            "Storage": item.specs?.storage || '',
            "OS": item.software?.os || '',
            "Office": item.software?.office || '',
            "Monitor": item.monitor?.model || '',
            "Notes": item.notes || ''
        };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asset_List");
    XLSX.writeFile(workbook, `Asset_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
    message.success("Export successful!");
  };

  // --- [HELPER] HÀM CHUYỂN ĐỔI NGÀY EXCEL SANG YYYY-MM-DD ---
  const convertExcelDate = (excelDate) => {
    if (!excelDate) return dayjs().format('YYYY-MM-DD'); // Default hôm nay nếu rỗng
    
    // Nếu là chuỗi "2024-01-01" thì trả về luôn
    if (typeof excelDate === 'string' && excelDate.includes('-')) return excelDate;

    // Nếu là số Serial Excel (VD: 45321)
    if (!isNaN(excelDate)) {
        // Excel base date: 1900-01-01
        // Trừ đi số ngày lỗi của Excel (Excel tính năm 1900 là năm nhuận sai)
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return dayjs(date).format('YYYY-MM-DD');
    }
    
    return dayjs().format('YYYY-MM-DD');
  };

  // --- 9. HÀM IMPORT EXCEL (ĐÃ SỬA LỖI DATE & STATUS) ---
  const handleImportExcel = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        
        // raw: false giúp đọc dữ liệu đã format (string) thay vì raw number
        // Nhưng date: true an toàn hơn cho xử lý logic
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

        if (jsonData.length === 0) {
            message.warning("File is empty!");
            setLoading(false);
            return;
        }

        let createdCount = 0;
        let updatedCount = 0;
        let failCount = 0;

        for (const row of jsonData) {
             try {
                // 1. Lấy mã Asset Code (Key phải khớp chính xác với Header Excel)
                const excelCode = row['Asset Code']?.toString().trim();
                
                if (!excelCode) continue; 

                // 2. Xử lý User (Chấp nhận cả User Name, Emp ID)
                let assignedObj = null;
                if (row['Emp ID']) {
                    assignedObj = {
                        employee_id: row['Emp ID'].toString().trim(),
                        employee_name: row['User Name'] || 'Unknown',
                        department: row['Department'] || 'External'
                    };
                }

                // 3. Xử lý Date (Fix lỗi ngày hiện tại)
                const parsedDate = convertExcelDate(row['Purchase Date']);

                // 4. Xử lý Status & Health (Trim khoảng trắng để tránh lỗi "In Use " !== "In Use")
                const statusRaw = row['Status'] ? row['Status'].toString().trim() : 'Spare';
                const healthRaw = row['Health'] ? row['Health'].toString().trim() : 'Good';

                const payload = {
                    asset_code: excelCode,
                    type: row['Type'] || 'PC',
                    model: row['Model'] || 'Unknown Model',
                    
                    // Gán giá trị đã xử lý trim()
                    health_status: healthRaw,
                    usage_status: statusRaw,
                    
                    // Gán ngày đã convert
                    purchase_date: parsedDate,
                    
                    notes: row['Notes'] || 'Imported via Excel',
                    assigned_to: assignedObj,

                    specs: {
                        cpu: row['CPU'] || '',
                        ram: row['RAM'] || '',
                        storage: row['Storage'] || '',
                        mainboard: ''
                    },
                    software: {
                        os: row['OS'] || '',
                        office: row['Office'] || ''
                    },
                    monitor: row['Monitor'] ? { model: row['Monitor'] } : null
                };

                // 5. UPSERT LOGIC (Cập nhật hoặc Tạo mới)
                const existingAsset = assets.find(a => a.asset_code === excelCode);

                if (existingAsset) {
                    await axiosClient.put(`/assets/${existingAsset.id}`, payload);
                    updatedCount++;
                } else {
                    await axiosClient.post('/assets', payload);
                    createdCount++;
                }

             } catch (err) {
                 console.error("Import error row:", row, err);
                 failCount++;
             }
        }

        Modal.info({
            title: 'Import Result',
            content: (
                <div>
                    <p>Process completed for {jsonData.length} rows.</p>
                    <ul>
                        <li style={{color: 'green'}}>Created New: {createdCount}</li>
                        <li style={{color: 'orange'}}>Updated Existing: {updatedCount}</li>
                        <li style={{color: 'red'}}>Failed: {failCount}</li>
                    </ul>
                </div>
            ),
        });

        loadAssetsData(); 

      } catch (error) {
        console.error("Error parsing Excel:", error);
        message.error("Failed to process Excel file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <AssetStats assets={safeAssets} />

      <AssetHeader 
        defaultType={defaultType}
        filteredCount={filteredAssets.length}
        onSearch={setSearchText}
        onAdd={() => { setEditingAsset(null); setIsModalOpen(true); }}
        onReload={loadAssetsData}
        onExport={handleExportExcel} 
        onImport={handleImportExcel} 
        loading={loading}
        canEdit={canEditAsset}
      />

      <AssetTable 
        assets={filteredAssets}
        loading={loading}
        canEdit={canEditAsset}
        onEdit={(record) => { setEditingAsset(record); setIsModalOpen(true); }}
        onDelete={handleDelete}
        onViewHistory={handleViewHistory} 
      />

      <AssetFormModal 
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onFinish={handleSave}
        editingAsset={editingAsset}
        employees={employees}
        defaultType={defaultType}
        loading={submitting}
      />

      <AssetHistoryDrawer 
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        asset={viewingAsset}
        canEdit={canEditAsset}
      />
    </div>
  );
};

export default AssetManager;