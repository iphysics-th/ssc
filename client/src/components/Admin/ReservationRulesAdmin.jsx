import React, { useCallback, useMemo, useState, useEffect } from "react";
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

const formatRuleLabel = (rule, subcategoryLookup) => {
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
    case "subcategory": {
      const info = subcategoryLookup?.get(rule.subcategory_en);
      const displayName = info?.subcategory_th || rule.subcategory_en || "-";
      return `ปิดรับ หัวข้อ: ${displayName}${
        info?.occurrences?.length ? " (ทุกระดับ)" : ""
      } (${rule.startDate ? new Date(rule.startDate).toLocaleDateString() : "-"} ถึง ${
        rule.endDate ? new Date(rule.endDate).toLocaleDateString() : "-"
      })`;
    }
    default:
      return "กฎที่ไม่รู้จัก";
  }
};

const ReservationRulesAdmin = () => {
  const [weekdayForm] = Form.useForm();
  const [dateRangeForm] = Form.useForm();
  const [subcategoryForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("weekday");
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [loadingAllSubcategories, setLoadingAllSubcategories] = useState(false);
  const [hasLoadedAllSubcategories, setHasLoadedAllSubcategories] = useState(false);
  const [selectedSubcategoryMeta, setSelectedSubcategoryMeta] = useState(null);

  const { data: rules = [], isFetching: loadingRules } =
    useGetReservationRulesAdminQuery();
  const { data: levels = [] } = useGetSubjectLevelsQuery();
  const [fetchCategories] = useLazyGetSubjectsByLevelQuery();
  const [fetchSubcategories] = useLazyGetSubjectsByCategoryQuery();

  const loadAllSubcategories = useCallback(async () => {
    if (!Array.isArray(levels) || !levels.length) {
      setAllSubcategories([]);
      setHasLoadedAllSubcategories(true);
      return;
    }

    setLoadingAllSubcategories(true);
    try {
      const unique = new Map();

      for (const level of levels) {
        const levelKey = level?.level_en;
        if (!levelKey) continue;

        let categories = [];
        try {
          categories = await fetchCategories(levelKey).unwrap();
        } catch (err) {
          console.error("Failed to load categories for level:", levelKey, err);
          continue;
        }

        for (const category of categories || []) {
          const categoryKey = category?.category_en;
          if (!categoryKey) continue;

          let subcats = [];
          try {
            subcats = await fetchSubcategories({
              level: levelKey,
              category: categoryKey,
            }).unwrap();
          } catch (err) {
            console.error(
              "Failed to load subcategories for category:",
              categoryKey,
              err
            );
            continue;
          }

          (subcats || []).forEach((sub) => {
            const subKey = sub?.subcategory_en;
            if (!subKey) return;

            const existing =
              unique.get(subKey) ||
              {
                subcategory_en: subKey,
                subcategory_th: sub?.subcategory_th || subKey,
                occurrenceKeys: new Set(),
                occurrences: [],
                levels: new Set(),
                categories: new Set(),
              };

            const occurrenceKey = `${levelKey}::${categoryKey}`;
            if (!existing.occurrenceKeys.has(occurrenceKey)) {
              existing.occurrences.push({
                level_en: levelKey,
                level_th: level?.level_th || levelKey,
                category_en: categoryKey,
                category_th: category?.category_th || categoryKey,
              });
              existing.occurrenceKeys.add(occurrenceKey);
            }
            existing.levels.add(levelKey);
            existing.categories.add(categoryKey);
            existing.subcategory_th = sub?.subcategory_th || existing.subcategory_th;

            unique.set(subKey, existing);
          });
        }
      }

      const normalized = Array.from(unique.values()).map((item) => {
        const occurrences = [...item.occurrences].sort((a, b) => {
          const levelCompare = (a.level_th || a.level_en || "").localeCompare(
            b.level_th || b.level_en || "",
            "th"
          );
          if (levelCompare !== 0) return levelCompare;
          return (a.category_th || a.category_en || "").localeCompare(
            b.category_th || b.category_en || "",
            "th"
          );
        });

        return {
          subcategory_en: item.subcategory_en,
          subcategory_th: item.subcategory_th,
          occurrences,
          levels: Array.from(item.levels || []),
          categories: Array.from(item.categories || []),
        };
      });

      normalized.sort((a, b) =>
        (a.subcategory_th || a.subcategory_en || "").localeCompare(
          b.subcategory_th || b.subcategory_en || "",
          "th"
        )
      );

      setAllSubcategories(normalized);
    } catch (error) {
      console.error("Failed to load global subcategories", error);
      message.error("ไม่สามารถโหลดหัวข้อย่อยทั้งหมดได้");
    } finally {
      setLoadingAllSubcategories(false);
      setHasLoadedAllSubcategories(true);
    }
  }, [levels, fetchCategories, fetchSubcategories]);

  const [createRule, { isLoading: creating }] = useCreateReservationRuleMutation();
  const [deleteRule] = useDeleteReservationRuleMutation();

  const subcategoryLookup = useMemo(() => {
    const map = new Map();
    (allSubcategories || []).forEach((item) => {
      if (item?.subcategory_en) {
        map.set(item.subcategory_en, item);
      }
    });
    return map;
  }, [allSubcategories]);

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
      setSelectedSubcategoryMeta(null);
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
      if (!hasLoadedAllSubcategories) {
        loadAllSubcategories();
      }
    }
  }, [activeTab, hasLoadedAllSubcategories, loadAllSubcategories]);

  useEffect(() => {
    setHasLoadedAllSubcategories(false);
  }, [levels]);

  useEffect(() => {
    if (!selectedSubcategoryMeta) return;
    const refreshed = allSubcategories.find(
      (item) => item.subcategory_en === selectedSubcategoryMeta.subcategory_en
    );
    if (!refreshed) {
      setSelectedSubcategoryMeta(null);
    } else if (refreshed !== selectedSubcategoryMeta) {
      setSelectedSubcategoryMeta(refreshed);
    }
  }, [allSubcategories, selectedSubcategoryMeta]);

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
                title={<strong>{formatRuleLabel(item, subcategoryLookup)}</strong>}
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
                title={<strong>{formatRuleLabel(item, subcategoryLookup)}</strong>}
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
          if (changed.subcategory_en) {
            const meta =
              subcategoryLookup.get(changed.subcategory_en) || null;
            setSelectedSubcategoryMeta(meta);
          }
        }}
      >
        <Form.Item
          label="เลือกหัวข้อย่อย"
          name="subcategory_en"
          rules={[{ required: true, message: "กรุณาเลือกหัวข้อย่อย" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="เลือกหัวข้อย่อย"
            optionFilterProp="label"
            loading={loadingAllSubcategories && !hasLoadedAllSubcategories}
            disabled={loadingAllSubcategories && !hasLoadedAllSubcategories}
            notFoundContent={
              hasLoadedAllSubcategories
                ? "ไม่พบหัวข้อย่อย"
                : "กำลังโหลดข้อมูลหัวข้อย่อย..."
            }
            options={allSubcategories.map((sub) => ({
              label: `${sub.subcategory_th || sub.subcategory_en} (${sub.subcategory_en})`,
              value: sub.subcategory_en,
            }))}
          />
        </Form.Item>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="กฎหัวข้อย่อยจะมีผลกับหัวข้อเดียวกันในทุกระดับและทุกกลุ่มวิชา"
        />
        {selectedSubcategoryMeta && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <div>
                <div>
                  หัวข้อย่อย <strong>{selectedSubcategoryMeta.subcategory_th}</strong> อยู่ใน:
                </div>
                <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
                  {selectedSubcategoryMeta.occurrences.map((occ, idx) => (
                    <li key={`${occ.level_en}-${occ.category_en}-${idx}`}>
                      {occ.level_th} — {occ.category_th}
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
        )}
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
        <Button
          type="primary"
          htmlType="submit"
          loading={creating}
          disabled={
            !hasLoadedAllSubcategories ||
            loadingAllSubcategories ||
            allSubcategories.length === 0
          }
        >
          บันทึกกฎหัวข้อย่อย
        </Button>
      </Form>

      <Card title="หัวข้อย่อยที่ปิดรับ" loading={loadingRules}>
        <List
          dataSource={subcategoryRules}
          locale={{ emptyText: "ยังไม่มีหัวข้อย่อยที่ปิดรับ" }}
          renderItem={(item) => {
            const info = subcategoryLookup.get(item.subcategory_en);
            const descriptionParts = [];
            if (item.note) {
              descriptionParts.push(<div key="note">{item.note}</div>);
            }
            if (info?.occurrences?.length) {
              descriptionParts.push(
                <div key="coverage" style={{ fontSize: 13, color: "#64748b" }}>
                  ครอบคลุม: {info.occurrences.map((occ) => `${occ.level_th} — ${occ.category_th}`).join(", ")}
                </div>
              );
            }

            return (
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
                  title={<strong>{formatRuleLabel(item, subcategoryLookup)}</strong>}
                  description={descriptionParts.length ? descriptionParts : null}
                />
              </List.Item>
            );
          }}
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
