import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Popconfirm, Select, Space, Spin, Table, Typography, message } from 'antd';
import axios from 'axios';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const roleOptions = [
  { value: 'member', label: 'สมาชิก' },
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/admin/users`, {
        withCredentials: true,
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId, role) => {
    setUpdating(userId);
    try {
      await axios.put(
        `${backendUrl}/api/admin/users/${userId}/role`,
        { role },
        { withCredentials: true }
      );
      message.success('อัปเดตสิทธิ์เรียบร้อย');
      fetchUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      message.error('ไม่สามารถอัปเดตสิทธิ์ได้');
    } finally {
      setUpdating(null);
    }
  }, [fetchUsers]);

  const handleDelete = useCallback(async (userId) => {
    setUpdating(userId);
    try {
      await axios.delete(`${backendUrl}/api/admin/users/${userId}`, {
        withCredentials: true,
      });
      message.success('ลบผู้ใช้เรียบร้อย');
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      const msg =
        error?.response?.data?.message === 'Cannot delete your own account'
          ? 'ไม่สามารถลบบัญชีของตัวเองได้'
          : 'ไม่สามารถลบผู้ใช้ได้';
      message.error(msg);
    } finally {
      setUpdating(null);
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        title: 'ชื่อผู้ใช้',
        dataIndex: 'username',
        key: 'username',
        render: (value) => value || '-',
      },
      {
        title: 'อีเมล',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'สิทธิ์',
        dataIndex: 'roles',
        key: 'roles',
        render: (roles = [], record) => {
          const currentRole = roles[0] || 'member';
          return (
            <Select
              value={currentRole}
              style={{ width: 160 }}
              onChange={(value) => handleRoleChange(record.id, value)}
              options={roleOptions}
              loading={updating === record.id}
            />
          );
        },
      },
      {
        title: 'การจัดการ',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Popconfirm
              title="ยืนยันการลบผู้ใช้"
              description="คุณต้องการลบผู้ใช้นี้หรือไม่?"
              onConfirm={() => handleDelete(record.id)}
              okText="ลบ"
              cancelText="ยกเลิก"
            >
              <Button danger loading={updating === record.id}>
                ลบผู้ใช้
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDelete, handleRoleChange, updating]
  );

  return (
    <div>
      <Typography.Title level={3} className="dashboard-section-title">
        จัดการผู้ใช้
      </Typography.Title>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={users.map((user) => ({ ...user, key: user.id }))}
          columns={columns}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'ไม่พบข้อมูลผู้ใช้' }}
        />
      )}
    </div>
  );
};

export default UserManagement;
