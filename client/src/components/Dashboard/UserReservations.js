import React, { useEffect, useState } from 'react';
import { Card, Empty, List, Spin, Typography } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useSelector } from 'react-redux';

dayjs.locale('th');

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) {
    return '-';
  }
  const buddhistYear = date.year() + 543;
  const monthName = date.locale('th').format('MMMM');
  return `${date.format('D')} ${monthName} ${buddhistYear}`;
};

const UserReservations = () => {
  const auth = useSelector((state) => state.auth);
  const user = typeof auth.user === 'object' ? auth.user : null;
  const userEmail = (user?.email || user?.mail || '').trim();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchReservations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendUrl}/api/reservation/my`, {
          withCredentials: true,
        });
        if (!isMounted) return;
        const data = response.data || [];
        if (data.length === 0 && userEmail) {
          try {
            const fallbackResponse = await axios.get(`${backendUrl}/api/reservation/by-email`, {
              params: { email: userEmail },
              withCredentials: true,
            });
            setReservations(fallbackResponse.data || []);
            setError(null);
            return;
          } catch (fallbackError) {
            console.error('Fallback reservation fetch failed:', fallbackError);
            setReservations([]);
            setError('ไม่สามารถดึงข้อมูลการจองได้');
            return;
          }
        }
        setReservations(data);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Primary reservation fetch failed:', err);
        if (userEmail) {
          try {
            const fallbackResponse = await axios.get(`${backendUrl}/api/reservation/by-email`, {
              params: { email: userEmail },
              withCredentials: true,
            });
            setReservations(fallbackResponse.data || []);
            setError(null);
            return;
          } catch (fallbackError) {
            console.error('Fallback reservation fetch failed:', fallbackError);
          }
        }
        setError('ไม่สามารถดึงข้อมูลการจองได้');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReservations();

    return () => {
      isMounted = false;
    };
  }, [userEmail]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Typography.Text type="danger">{error}</Typography.Text>;
  }

  if (!reservations.length) {
    return (
      <Empty
        description={
          <span>
            {user?.username ? `${user.username} ยังไม่มีการจอง` : 'ยังไม่มีการจอง'}
          </span>
        }
      />
    );
  }

  return (
    <div>
      <Typography.Title level={3} className="dashboard-section-title">
        การจองของฉัน
      </Typography.Title>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={reservations}
        renderItem={(reservation) => {
          const selectedDates = Array.isArray(reservation.selectedDates)
            ? reservation.selectedDates.map((date) => formatBuddhistDate(date)).join(', ')
            : '-';

          const classSubjects = Array.isArray(reservation.classSubjects)
            ? reservation.classSubjects
            : [];

          return (
            <List.Item>
              <Card
                title={`หมายเลขการจอง: ${reservation.reservationNumber || '-'}`}
                bordered
              >
                <Typography.Paragraph>
                  <strong>สถานะ:</strong> {reservation.confirmation || 'received'}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  <strong>วันที่อบรม:</strong> {selectedDates || '-'}
                </Typography.Paragraph>
                <Typography.Paragraph>
                  <strong>จำนวนห้องเรียน:</strong> {reservation.numberOfClasses || 1}
                </Typography.Paragraph>

                {classSubjects.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Typography.Text strong>รายละเอียดรายวิชา:</Typography.Text>
                    {classSubjects.map((classItem, classIndex) => (
                      <Card
                        key={`class-${classIndex}`}
                        size="small"
                        style={{ marginTop: 12 }}
                        title={`ห้องเรียนที่ ${classItem.classNumber || classIndex + 1}`}
                      >
                        {Array.isArray(classItem.slots) && classItem.slots.length ? (
                          <List
                            size="small"
                            dataSource={classItem.slots}
                            renderItem={(slot, slotIndex) => (
                              <List.Item key={`slot-${slotIndex}`}>
                                <Typography.Text>
                                  {slot.date ? formatBuddhistDate(slot.date) : '-'} • {slot.slot || '-'} •{' '}
                                  {slot.subject?.name_th || slot.name_th || '-'}
                                  {slot.subject?.code || slot.code ? ` (${slot.subject?.code || slot.code})` : ''}
                                </Typography.Text>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Typography.Text type="secondary">
                            ยังไม่ได้เลือกวิชา
                          </Typography.Text>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default UserReservations;
