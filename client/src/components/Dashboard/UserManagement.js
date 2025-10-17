import React, { useEffect, useMemo, useState } from 'react';
import { Button, Popconfirm, Select, Space, Spin, Table, Typography, message } from 'antd';
import {
  useDeleteUserMutation,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
} from '../../features/admin/adminApiSlice';

const roleOptions = [
  { value: 'member', label: 'สมาชิก' },
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
];

const UserManagement = () => {
  const [updating, setUpdating] = useState(null);
  const {
    data: usersData = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUsersQuery();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = useMemo(() => {
    if (!Array.isArray(usersData)) {
      return [];
    }

    return usersData.map((user) => ({
      ...user,
      key: user.id ?? user._id,
    }));
  }, [usersData]);

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch users:', error);
      message.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }
  }, [error]);

  const handleRoleChange = async (userId, role) => {
    setUpdating(userId);
    try {
      await updateUserRole({ userId, role }).unwrap();
      message.success('อัปเดตสิทธิ์เรียบร้อย');
    } catch (err) {
      console.error('Failed to update role:', err);
      message.error('ไม่สามารถอัปเดตสิทธิ์ได้');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (userId) => {
    setUpdating(userId);
    try {
      await deleteUser(userId).unwrap();
      message.success('ลบผู้ใช้เรียบร้อย');
    } catch (err) {
      console.error('Failed to delete user:', err);
      const messageKey =
        err?.data?.message === 'Cannot delete your own account'
          ? 'ไม่สามารถลบบัญชีของตัวเองได้'
          : 'ไม่สามารถลบผู้ใช้ได้';
      message.error(messageKey);
    } finally {
      setUpdating(null);
    }
  };

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
              onChange={(value) => handleRoleChange(record.id ?? record._id, value)}
              options={roleOptions}
              loading={updating === (record.id ?? record._id)}
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
              onConfirm={() => handleDelete(record.id ?? record._id)}
              okText="ลบ"
              cancelText="ยกเลิก"
            >
              <Button danger loading={updating === (record.id ?? record._id)}>
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
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={users}
          columns={columns}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'ไม่พบข้อมูลผู้ใช้' }}
          loading={isFetching}
          onChange={() => {
            if (!isFetching) {
              refetch();
            }
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
