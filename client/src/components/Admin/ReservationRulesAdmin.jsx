import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Form,
  Select,
  DatePicker,
  Button,
  List,
  Space,
  Popconfirm,
  message,
  Typography,
  Input,
  Alert,
} from "antd";
import {
  useGetReservationRulesAdminQuery,
  useCreateReservationRuleMutation,
  useDeleteReservationRuleMutation,
  useGetSubjectLevelsQuery,
  useLazyGetSubjectsByLevelQuery,
  useLazyGetSubjectsByCategoryQuery,
} from "../../features/reservation/reservationApiSlice";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const dayOptions = [
  { label: "วันอาทิตย์", value: 0 },
  { label: "วันจันทร์", value: 1 },
  { label: "วันอังคาร", value: 2 },
  { label: "วันพุธ", value: 3 },
  { label: "วันพฤหัสบดี", value: 4 },
  { label: "วันศุกร์", value: 5 },
  { label: "วันเสาร์", value: 6 },
];

const formatRuleLabel = (rule) => {
  switch (rule.type) {
    case "weekday":
      return `ปิดรับในวัน: ${
        rule.weekdays
          .map((idx) => dayOptions.find((d) => d.value === idx)?.label || idx)
          .join(", ") || "-"
      }`;
    case "date_range":
      return `ช่วงวันที่ปิดรับ: ${
        rule.startDate ? new Date(rule.startDate).toLocaleDateString() : "-"
      } ถึง ${rule.endDate ? new Date(rule.endDate).toLocaleDateString() : "-"}`;
    case "subcategory":
      return `ปิดรับ หัวข้อ: ${
        rule.subcategory_en || "-"
      } (${rule.startDate ? new Date(rule.startDate).toLocaleDateString() : "-"} ถึง ${
        rule.endDate ? new Date(rule.endDate).toLocaleDateString() : "-"
      })`;
    default:
      return "กฎที่ไม่รู้จัก";
  }
};

const ReservationRulesAdmin = () => {
  const [weekdayForm] = Form.useForm();
  const [dateRangeForm] = Form.useForm();
  const [subcategoryForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("weekday");

  const { data: rules = [], isFetching: loadingRules } =
    useGetReservationRulesAdminQuery();
  const { data: levels = [] } = useGetSubjectLevelsQuery();
  const [fetchCategories, { data: categories = [] }] =
    useLazyGetSubjectsByLevelQuery();
  const [fetchSubcategories, { data: subcategories = [] }] =
    useLazyGetSubjectsByCategoryQuery();

  const [createRule, { isLoading: creating }] = useCreateReservationRuleMutation();
  const [deleteRule] = useDeleteReservationRuleMutation();

  const weekdayRules = useMemo(
    () => rules.filter((rule) => rule.type === "weekday"),
    [rules]
  );
  const dateRangeRules = useMemo(
    () => rules.filter((rule) => rule.type === "date_range"),
    [rules]
  );
  const subcategoryRules = useMemo(
    () => rules.filter((rule) => rule.type === "subcategory"),
    [rules]
  );

  const handleCreate = async (type, values) => {
    try {
      const payload = { type };

      if (type === "weekday") {
        payload.weekdays = values.weekdays;
      } else if (type === "date_range") {
        payload.startDate = values.range?.[0]?.toISOString();
        payload.endDate = values.range?.[1]?.toISOString();
        payload.note = values.note || "";
      } else if (type === "subcategory") {
        payload.level_en = values.level_en;
        payload.category_en = values.category_en;
        payload.subcategory_en = values.subcategory_en;
        payload.startDate = values.range?.[0]?.toISOString();
        payload.endDate = values.range?.[1]?.toISOString();
        payload.note = values.note || "";
      }

      await createRule(payload).unwrap();
      message.success("บันทึกกฎเรียบร้อยแล้ว");
      weekdayForm.resetFields();
      dateRangeForm.resetFields();
      subcategoryForm.resetFields();
    } catch (error) {
      message.error(error?.data?.message || "ไม่สามารถบันทึกกฎได้");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRule(id).unwrap();
      message.success("ลบกฎเรียบร้อยแล้ว");
    } catch (error) {
      message.error("ไม่สามารถลบกฎได้");
    }
  };

  useEffect(() => {
    if (activeTab === "subcategory") {
      const defaultLevel = subcategoryForm.getFieldValue("level_en");
      if (defaultLevel) {
        fetchCategories(defaultLevel);
      }
    }
  }, [activeTab, fetchCategories, subcategoryForm]);

  const renderWeekdayTab = () => (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Form
        layout="vertical"
        form={weekdayForm}
        onFinish={(values) => handleCreate("weekday", values)}
      >
        <Form.Item
          label="เลือกวัน"
          name="weekdays"
          rules={[{ required: true, message: "กรุณาเลือกวัน" }]}
        >
          <Select
            mode="multiple"
            placeholder="เลือกวันที่ไม่อนุญาตให้จอง"
            options={dayOptions}
            allowClear
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={creating}>
          บันทึกกฎวัน
        </Button>
      </Form>

      <Card title="รายการวันปิดรับ" loading={loadingRules}>
        <List
          dataSource={weekdayRules}
          locale={{ emptyText: "ยังไม่มีการปิดรับเฉพาะวัน" }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="ยืนยันการลบ?"
                  onConfirm={() => handleDelete(item.id)}
                >
                  <Button danger size="small">ลบ</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<strong>{formatRuleLabel(item)}</strong>}
                description={item.note || null}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );

  const renderDateRangeTab = () => (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Form
        layout="vertical"
        form={dateRangeForm}
        onFinish={(values) => handleCreate("date_range", values)}
      >
        <Form.Item
          label="ช่วงวันที่ปิดรับ"
          name="range"
          rules={[{ required: true, message: "กรุณาเลือกช่วงวันที่" }]}
        >
          <RangePicker style={{ width: "100%" }} allowClear />
        </Form.Item>
        <Form.Item label="บันทึกเพิ่มเติม" name="note">
          <Input.TextArea rows={2} placeholder="ใส่หมายเหตุเพิ่มเติม (ถ้ามี)" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={creating}>
          บันทึกช่วงเวลา
        </Button>
      </Form>

      <Card title="ช่วงวันที่ปิดรับ" loading={loadingRules}>
        <List
          dataSource={dateRangeRules}
          locale={{ emptyText: "ยังไม่มีช่วงเวลาที่ปิดรับ" }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="ยืนยันการลบ?"
                  onConfirm={() => handleDelete(item.id)}
                >
                  <Button danger size="small">ลบ</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<strong>{formatRuleLabel(item)}</strong>}
                description={item.note || null}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );

  const renderSubcategoryTab = () => (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Form
        layout="vertical"
        form={subcategoryForm}
        onFinish={(values) => handleCreate("subcategory", values)}
        onValuesChange={(changed) => {
          if (changed.level_en) {
            subcategoryForm.setFieldsValue({ category_en: undefined, subcategory_en: undefined });
            fetchCategories(changed.level_en);
          }
          if (changed.category_en) {
            subcategoryForm.setFieldsValue({ subcategory_en: undefined });
            fetchSubcategories({ level: subcategoryForm.getFieldValue("level_en"), category: changed.category_en });
          }
        }}
      >
        <Form.Item
          label="เลือกระดับการเรียน"
          name="level_en"
          rules={[{ required: true, message: "กรุณาเลือกระดับ" }]}
        >
          <Select
            placeholder="เลือกระดับ"
            options={levels.map((level) => ({
              label: level.level_th,
              value: level.level_en,
            }))}
          />
        </Form.Item>
        <Form.Item
          label="เลือกกลุ่มวิชา"
          name="category_en"
          rules={[{ required: true, message: "กรุณาเลือกกลุ่มวิชา" }]}
        >
          <Select
            placeholder="เลือกกลุ่มวิชา"
            options={(categories || []).map((cat) => ({
              label: cat.category_th,
              value: cat.category_en,
            }))}
          />
        </Form.Item>
        <Form.Item
          label="เลือกหัวข้อย่อย"
          name="subcategory_en"
          rules={[{ required: true, message: "กรุณาเลือกหัวข้อย่อย" }]}
        >
          <Select
            placeholder="เลือกหัวข้อย่อย"
            options={(subcategories || []).map((sub) => ({
              label: sub.subcategory_th,
              value: sub.subcategory_en,
            }))}
          />
        </Form.Item>
        <Form.Item
          label="ช่วงวันที่"
          name="range"
          rules={[{ required: true, message: "กรุณาเลือกช่วงวันที่" }]}
        >
          <RangePicker style={{ width: "100%" }} allowClear />
        </Form.Item>
        <Form.Item label="บันทึกเพิ่มเติม" name="note">
          <Input.TextArea rows={2} placeholder="ใส่หมายเหตุเพิ่มเติม (ถ้ามี)" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={creating}>
          บันทึกกฎหัวข้อย่อย
        </Button>
      </Form>

      <Card title="หัวข้อย่อยที่ปิดรับ" loading={loadingRules}>
        <List
          dataSource={subcategoryRules}
          locale={{ emptyText: "ยังไม่มีหัวข้อย่อยที่ปิดรับ" }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="ยืนยันการลบ?"
                  onConfirm={() => handleDelete(item.id)}
                >
                  <Button danger size="small">ลบ</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<strong>{formatRuleLabel(item)}</strong>}
                description={item.note || null}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Title level={3} className="dashboard-section-title">
        ตั้งค่าการปิดรับการจอง
      </Title>
      <Text type="secondary">
        กำหนดวันและช่วงเวลาที่ระบบไม่อนุญาตให้ทำการจอง รวมทั้งการระบุหัวข้อย่อยที่ปิดรับเป็นการชั่วคราว
      </Text>
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 12 }}
        message={
          <div>
            <div>
              กฎที่สร้างจะปรากฏในหน้าปฏิทินการจองและหน้าคัดเลือกวิชาแบบเรียลไทม์ เพื่อช่วยให้ผู้ใช้เห็นช่วงเวลาที่ไม่เปิดรับ
            </div>
            <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
              <li>กฎ "ปิดเฉพาะวัน" จะปิดทั้งปฏิทินตามวันในสัปดาห์ที่เลือก</li>
              <li>กฎ "ปิดช่วงเวลา" ใช้สำหรับวันหยุดยาวหรือช่วงบำรุงรักษา</li>
              <li>
                กฎ "ปิดหัวข้อย่อย" จะซ่อนหัวข้อนั้นจากการเลือก หากวันที่อยู่ในช่วงที่ระบุ
              </li>
            </ul>
          </div>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={[
          {
            key: "weekday",
            label: "ปิดเฉพาะวัน",
            children: renderWeekdayTab(),
          },
          {
            key: "date_range",
            label: "ปิดช่วงเวลา",
            children: renderDateRangeTab(),
          },
          {
            key: "subcategory",
            label: "ปิดหัวข้อย่อย",
            children: renderSubcategoryTab(),
          },
        ]}
      />
    </div>
  );
};

export default ReservationRulesAdmin;
