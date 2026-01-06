import React, { useState, useEffect } from 'react';
import { message, Modal } from 'antd';
import axiosClient from '../../../api/axiosClient';
import * as XLSX from 'xlsx'; 
import dayjs from 'dayjs';

// IMPORT CÁC COMPONENTS
import AssetStats from './AssetStats';
import AssetFormModal from './AssetFormModal';
import AssetTable from './AssetTable'; 
import AssetHeader from './AssetHeader';
import AssetHistoryDrawer from './AssetHistoryDrawer';

import { useEmployees } from '../../../context/useEmployees';
import { PERMISSIONS } from '../../utils/permissions';

const AssetManager = ({ defaultType }) => {
  const { employees, fetchEmployees } = useEmployees();

  // STATE
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null); 

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); 
  const [submitting, setSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEditAsset = PERMISSIONS.IS_ADMIN(user.role);

  // --- API CALLS ---
  useEffect(() => { 
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
        await Promise.all([loadAssetsData(), loadCategories(), loadEmployeesData()]);
    } finally {
        setLoading(false);
    }
  };

  const loadAssetsData = async () => {
    try {
      const res = await axiosClient.get('/assets');
      if (Array.isArray(res.data)) setAssets(res.data);
      else setAssets([]); 
    } catch (error) {
      console.error('Lỗi tải Assets:', error);
      setAssets([]);
    }
  };

  const loadCategories = async () => {
      try {
          const res = await axiosClient.get('/categories');
          if (Array.isArray(res.data)) setCategories(res.data);
          else setCategories([]);
      } catch (error) {
          console.error('Lỗi tải Categories:', error);
          setCategories([]);
      }
  }

  const loadEmployeesData = async () => {
    try {
       if (employees.length === 0) await fetchEmployees();
    } catch (error) {
       console.error("Lỗi tải Employees:", error);
    }
  };

  // --- [QUAN TRỌNG] LOGIC LỌC DỮ LIỆU 2 TẦNG ---
  const safeAssets = Array.isArray(assets) ? assets : [];

  // TẦNG 1: Lọc theo Category (Dùng để hiển thị Stats đúng theo trang hiện tại)
  const assetsByCategory = safeAssets.filter(item => {
      if (defaultType && item.category?.code !== defaultType) return false;
      return true;
  });

  // TẦNG 2: Lọc chi tiết (Status + Search) để hiển thị Bảng
  const filteredAssets = assetsByCategory.filter(item => {
    // Lọc theo Status (từ click thẻ Stats)
    if (filterStatus) {
        if (filterStatus === 'CRITICAL') {
            if (item.health_status !== 'Critical') return false;
        } else {
            if (item.usage_status !== filterStatus) return false;
        }
    }
    
    // Lọc theo Search Text
    if (!searchText) return true;
    const kw = searchText.toLowerCase();
    return (
      item.asset_code?.toLowerCase().includes(kw) || 
      item.model?.toLowerCase().includes(kw) ||
      item.assigned_to?.employee_name?.toLowerCase().includes(kw) ||
      item.assigned_to?.department?.toLowerCase().includes(kw)
    );
  });

  // --- ACTIONS ---
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/assets/${id}`);
      message.success("Deleted successfully");
      loadAssetsData(); 
    } catch { 
      message.error("Delete failed"); 
    }
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      let assignedUserObject = null;
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
        category_id: values.category_id, 
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
        usage_status: values.usage_status, 
        assigned_to: assignedUserObject,
        specs: { 
          cpu: values.cpu, 
          ram: values.ram, 
          storage: values.storage, 
          mainboard: values.mainboard 
        },
        software: { os: values.os, office: values.office },
        monitor: (values.category_code === 'PC') ? { model: values.monitor_model } : null,
        notes: values.notes 
      };

      // Clean props phụ
      delete assetData.assignMode; delete assetData.assigned_id; delete assetData.manual_emp_id;
      delete assetData.manual_emp_name; delete assetData.manual_emp_dept; delete assetData.category_code; 

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

  // --- EXPORT / IMPORT ---
  const handleExportExcel = () => {
    if (filteredAssets.length === 0) {
        message.warning("No data to export");
        return;
    }
    const dataToExport = filteredAssets.map((item, index) => {
        const user = item.assigned_to?.employee_name || 'Stock / Unassigned';
        const typeName = item.category?.name || 'Unknown';
        return {
            "No": index + 1,
            "Asset Code": item.asset_code,
            "Type": typeName,
            "Model": item.model,
            "Health": item.health_status,
            "Status": item.usage_status,
            "User Name": user,
            "Department": item.assigned_to?.department || '',
            "Emp ID": item.assigned_to?.employee_id || '',
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

  const convertExcelDate = (excelDate) => {
    if (!excelDate) return dayjs().format('YYYY-MM-DD'); 
    if (typeof excelDate === 'string' && excelDate.includes('-')) return excelDate;
    if (!isNaN(excelDate)) {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return dayjs(date).format('YYYY-MM-DD');
    }
    return dayjs().format('YYYY-MM-DD');
  };

  const handleImportExcel = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
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
                const excelCode = row['Asset Code']?.toString().trim();
                if (!excelCode) continue; 

                const typeName = row['Type']?.toString().trim() || 'PC';
                const foundCat = categories.find(c => c.name.toLowerCase() === typeName.toLowerCase()) 
                               || categories.find(c => c.code.toLowerCase() === typeName.toLowerCase());
                const categoryId = foundCat ? foundCat.id : (categories[0]?.id || 1);

                let assignedObj = null;
                if (row['Emp ID']) {
                    assignedObj = {
                        employee_id: row['Emp ID'].toString().trim(),
                        employee_name: row['User Name'] || 'Unknown',
                        department: row['Department'] || 'External'
                    };
                }

                const parsedDate = convertExcelDate(row['Purchase Date']);
                const statusRaw = row['Status'] ? row['Status'].toString().trim() : 'Spare';
                const healthRaw = row['Health'] ? row['Health'].toString().trim() : 'Good';

                const payload = {
                    asset_code: excelCode,
                    category_id: categoryId,
                    model: row['Model'] || 'Unknown Model',
                    health_status: healthRaw,
                    usage_status: statusRaw,
                    purchase_date: parsedDate,
                    notes: row['Notes'] || 'Imported via Excel',
                    assigned_to: assignedObj,
                    specs: {
                        cpu: row['CPU'] || '',
                        ram: row['RAM'] || '',
                        storage: row['Storage'] || '',
                        mainboard: ''
                    },
                    software: { os: row['OS'] || '', office: row['Office'] || '' },
                    monitor: row['Monitor'] ? { model: row['Monitor'] } : null
                };

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
                    <p>Processed {jsonData.length} rows.</p>
                    <ul>
                        <li style={{color: 'green'}}>Created: {createdCount}</li>
                        <li style={{color: 'orange'}}>Updated: {updatedCount}</li>
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
      
      {/* [SỬA] Truyền assetsByCategory (Đã lọc theo loại) vào AssetStats */}
      {/* Như vậy, nếu đang ở trang PC, nó chỉ thống kê PC */}
      <AssetStats 
          assets={assetsByCategory} 
          categories={categories} 
          activeFilter={filterStatus}
          onFilterChange={setFilterStatus}
      />

      {/* Header và Table vẫn dùng filteredAssets (Đã lọc loại + lọc status) */}
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
        categories={categories}
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