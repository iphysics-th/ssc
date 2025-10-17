import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, List, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useSelector } from 'react-redux';
import {
  useGetMyReservationsQuery,
  useLazyGetReservationsByEmailQuery,
} from '../../features/reservation/reservationApiSlice';

dayjs.locale('th');

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
  const username = (user?.username || '').trim();

  const {
    data: primaryReservations = [],
    isLoading: isPrimaryLoading,
    isError: isPrimaryError,
  } = useGetMyReservationsQuery();

  const [
    triggerFallback,
    {
      data: fallbackReservations = [],
      isFetching: isFallbackFetching,
      isError: isFallbackError,
    },
  ] = useLazyGetReservationsByEmailQuery();

  const [hasTriggeredFallback, setHasTriggeredFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const shouldTriggerFallback =
      (isPrimaryError ||
        (!isPrimaryLoading && Array.isArray(primaryReservations) && primaryReservations.length === 0)) &&
      (userEmail || username) &&
      !hasTriggeredFallback;

    if (shouldTriggerFallback) {
      triggerFallback({ email: userEmail || undefined, username: username || undefined });
      setHasTriggeredFallback(true);
    }
  }, [
    isPrimaryError,
    isPrimaryLoading,
    primaryReservations,
    userEmail,
    username,
    hasTriggeredFallback,
    triggerFallback,
  ]);

  useEffect(() => {
    if (isFallbackError || (isPrimaryError && !hasTriggeredFallback && !(userEmail || username))) {
      setErrorMessage('ไม่สามารถดึงข้อมูลการจองได้');
      return;
    }

    if (!isPrimaryLoading && !isFallbackFetching) {
      setErrorMessage(null);
    }
  }, [
    isFallbackError,
    isPrimaryError,
    hasTriggeredFallback,
    userEmail,
    username,
    isPrimaryLoading,
    isFallbackFetching,
  ]);

  const reservations = useMemo(() => {
    if (Array.isArray(primaryReservations) && primaryReservations.length > 0) {
      return primaryReservations;
    }
    if (Array.isArray(fallbackReservations) && fallbackReservations.length > 0) {
      return fallbackReservations;
    }
    return [];
  }, [primaryReservations, fallbackReservations]);

  const isLoading = isPrimaryLoading || (hasTriggeredFallback && isFallbackFetching);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (errorMessage) {
    return <Typography.Text type="danger">{errorMessage}</Typography.Text>;
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

