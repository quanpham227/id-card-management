// src/components/pages/Assets/AssetManager.jsx
import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import axiosClient from '../../../api/axiosClient';

// IMPORT CÁC COMPONENTS
import AssetStats from './AssetStats';
import AssetFormModal from './AssetFormModal';
import AssetTable from './AssetTable'; 
import AssetHeader from './AssetHeader';
import AssetHistoryDrawer from './AssetHistoryDrawer';

// IMPORT HOOK TỪ CONTEXT
import { useEmployees } from '../../../context/useEmployees';

// 1. [QUAN TRỌNG] Import file check quyền
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

  // --- 3. PHÂN QUYỀN (ĐÃ SỬA) ---
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Sử dụng PERMISSIONS.IS_ADMIN để Admin, Manager, IT đều là true
  // (Staff và HR sẽ là false)
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
      const res = await axiosClient.get('/api/assets');
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
      await axiosClient.delete(`/api/assets/${id}`);
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
      const selectedEmp = employees.find(e => e.employee_id === values.assigned_id);
      
      const assetData = {
        ...values,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
        usage_status: values.usage_status, 
        assigned_to: selectedEmp ? {
            employee_id: selectedEmp.employee_id,
            employee_name: selectedEmp.employee_name,
            department: selectedEmp.employee_department
        } : null,
        // ... (Giữ nguyên logic mapping specs/software cũ của bạn) ...
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

      if (editingAsset) {
        await axiosClient.put(`/api/assets/${editingAsset.id}`, assetData);
        message.success("Updated successfully");
      } else {
        await axiosClient.post('/api/assets', assetData);
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
    
    // Thêm check an toàn ?. để tránh lỗi khi field bị null
    return (
      item.asset_code?.toLowerCase().includes(kw) || 
      item.model?.toLowerCase().includes(kw) ||
      item.assigned_to?.employee_name?.toLowerCase().includes(kw) ||
      item.assigned_to?.department?.toLowerCase().includes(kw)
    );
  });

  return (
    <div style={{ padding: '0 4px' }}>
      <AssetStats assets={safeAssets} />

      <AssetHeader 
        defaultType={defaultType}
        filteredCount={filteredAssets.length}
        onSearch={setSearchText}
        onAdd={() => { setEditingAsset(null); setIsModalOpen(true); }}
        onReload={loadAssetsData}
        loading={loading}
        // Truyền quyền xuống Header (để ẩn/hiện nút Add)
        canEdit={canEditAsset}
      />

      <AssetTable 
        assets={filteredAssets}
        loading={loading}
        // Truyền quyền xuống Table (để ẩn/hiện nút Action)
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
        // Có thể cho Staff xem lịch sử nhưng không được Add Log
        canEdit={canEditAsset}
      />
    </div>
  );
};

export default AssetManager;