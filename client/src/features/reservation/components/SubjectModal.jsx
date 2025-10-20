import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Button,
  Tabs,
  Select,
  Card,
  Tag,
  Spin,
  Empty,
  Typography,
  Drawer,
  Breadcrumb,
  Space,
  message,
} from "antd";
import {
  BookOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import {
  useGetSubjectLevelsQuery,
  useLazyGetSubjectsByLevelQuery,
  useLazyGetSubjectsByCategoryQuery,
  useLazyGetSubjectsBySubcategoryQuery,
} from "../reservationApiSlice";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const SubjectSelectionModal = ({
  isModalVisible,
  handleCancel,
  onSubjectSelected,
  classStudentCount = 0,
}) => {
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [structuredSubjects, setStructuredSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const backendUrl = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
  const navigate = useNavigate();

  const resolveImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${backendUrl}${normalized}`;
  };

  const { data: levelOptions = [] } = useGetSubjectLevelsQuery(undefined, {
    skip: !isModalVisible,
  });

  const [fetchCategories] = useLazyGetSubjectsByLevelQuery();
  const [fetchSubcategories] = useLazyGetSubjectsByCategoryQuery();
  const [fetchSubjects] = useLazyGetSubjectsBySubcategoryQuery();

  useEffect(() => {
    if (isModalVisible) {
      setLevels(Array.isArray(levelOptions) ? levelOptions : []);
    } else {
      resetAll();
    }
  }, [isModalVisible, levelOptions]);

  const resetAll = () => {
    setStructuredSubjects([]);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedSubject(null);
    setSelectedSubjectDetail(null);
    setDrawerVisible(false);
  };

  const isSubjectOpen = (subject) =>
    subject && subject.isActive !== false &&
    subject.isCategoryActive !== false &&
    subject.isSubcategoryActive !== false;

  const handleLevelChange = async (levelKey) => {
    setSelectedLevel(levelKey);
    resetAll();
    try {
      setLoading(true);
      const categories = await fetchCategories(levelKey).unwrap();
      const structured = [];

      for (const cat of categories ?? []) {
        const subcats = await fetchSubcategories({
          level: levelKey,
          category: cat.category_en,
        }).unwrap();

        const subcatBlocks = [];
        for (const sub of subcats ?? []) {
          const subjList = await fetchSubjects({
            level: levelKey,
            category: cat.category_en,
            subcategory: sub.subcategory_en,
          }).unwrap();
          subcatBlocks.push({ ...sub, subjects: subjList ?? [] });
        }
        structured.push({ ...cat, subcategories: subcatBlocks });
      }

      setStructuredSubjects(structured);
    } catch (err) {
      console.error("Error fetching subject data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStructure = structuredSubjects
    .filter((cat) => !selectedCategory || cat.category_en === selectedCategory)
    .map((cat) => ({
      ...cat,
      subcategories: cat.subcategories.filter(
        (sub) =>
          !selectedSubcategory || sub.subcategory_en === selectedSubcategory
      ),
    }));

  const findSubjectByCode = (code) => {
    for (const cat of structuredSubjects) {
      for (const sub of cat.subcategories) {
        const subject = sub.subjects.find((s) => s.code === code);
        if (subject) return { subject, category: cat, subcategory: sub };
      }
    }
    return null;
  };

  const selectedRecord = useMemo(
    () => (selectedSubject ? findSubjectByCode(selectedSubject) : null),
    [selectedSubject, structuredSubjects]
  );

  const canConfirmSelection = useMemo(() => {
    if (!selectedRecord) return false;
    if (
      classStudentCount > 0 &&
      selectedRecord.subject.student_max < classStudentCount
    )
      return false;
    return true;
  }, [selectedRecord, classStudentCount]);

  const handleSubjectClick = (subject, category, subcategory) => {
    const subjectOpen = isSubjectOpen(subject);
    const capacityExceeded =
      classStudentCount > 0 && subject.student_max < classStudentCount;

    if (!subjectOpen) return message.warning("คอร์สนี้ปิดรับแล้ว");
    if (capacityExceeded)
      return message.warning("จำนวนผู้เรียนเกินกว่าที่คอร์สนี้รองรับ");

    setSelectedSubject(subject.code);
    setSelectedSubjectDetail({
      ...subject,
      categoryInfo: {
        category_en: category.category_en,
        category_th: category.category_th,
      },
      subcategoryInfo: {
        subcategory_en: subcategory.subcategory_en,
        subcategory_th: subcategory.subcategory_th,
      },
      isAvailable: subjectOpen && !capacityExceeded,
    });
    setDrawerVisible(true);
  };

  const handleOk = () => {
    const selected = findSubjectByCode(selectedSubject);
    if (!selected) return false;
    onSubjectSelected({
      subject: selected.subject,
      level: selectedLevel,
      category: selected.category.category_en,
      subcategory: selected.subcategory.subcategory_en,
    });
    return true;
  };

  return (
    <>
      <Modal
        open={isModalVisible}
        onCancel={handleCancel}
        width={900}
        maskClosable={false}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOutlined />
            <span>เลือกวิชา</span>
          </div>
        }
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            ยกเลิก
          </Button>,
          <Button
            key="ok"
            type="primary"
            disabled={!canConfirmSelection}
            onClick={() => {
              if (handleOk()) handleCancel();
            }}
          >
            ตกลง
          </Button>,
        ]}
      >
        {/* ------------------ Tabs ------------------ */}
        <Tabs
          activeKey={selectedLevel}
          onChange={handleLevelChange}
          centered
          items={levels.map((lvl) => ({
            key: lvl.level_en,
            label: lvl.level_th,
          }))}
        />

        {/* 🔹 Filter dropdowns at the top inside tab */}
        {structuredSubjects.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
              justifyContent: "flex-start",
            }}
          >
            <Select
              allowClear
              placeholder="กรองตามกลุ่มวิชา"
              style={{ minWidth: 200 }}
              value={selectedCategory}
              onChange={(v) => {
                setSelectedCategory(v);
                setSelectedSubcategory(null);
              }}
            >
              {structuredSubjects.map((cat) => (
                <Option key={cat.category_en} value={cat.category_en}>
                  {cat.category_th}
                </Option>
              ))}
            </Select>

            <Select
              allowClear
              placeholder="กรองตามสาขา"
              style={{ minWidth: 200 }}
              value={selectedSubcategory}
              onChange={(v) => setSelectedSubcategory(v)}
            >
              {structuredSubjects
                .filter(
                  (cat) =>
                    !selectedCategory || cat.category_en === selectedCategory
                )
                .flatMap((cat) => cat.subcategories)
                .map((sub) => (
                  <Option key={sub.subcategory_en} value={sub.subcategory_en}>
                    {sub.subcategory_th}
                  </Option>
                ))}
            </Select>
          </div>
        )}

        {/* ------------------ Subject Cards ------------------ */}
        <Spin spinning={loading}>
          {filteredStructure.length ? (
            <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 10 }}>
              {filteredStructure.map((cat) => (
                <div key={cat.category_en} style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      background: "linear-gradient(90deg, #f1f5f9, #fff)",
                      borderLeft: "6px solid #1677ff",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 16,
                    }}
                  >
                    <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                      {cat.category_th}
                    </Title>
                  </div>

                  {cat.subcategories.map((sub) => (
                    <div key={sub.subcategory_en} style={{ marginBottom: 24 }}>
                      <Text strong>{sub.subcategory_th}</Text>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          overflowX: "auto",
                          paddingBottom: 8,
                        }}
                      >
                        {sub.subjects.map((subject) => {
                          const subjectImage = resolveImageUrl(subject.image);
                          const disabled =
                            subject.isActive === false ||
                            (classStudentCount > 0 &&
                              subject.student_max < classStudentCount);
                          const isSelected = selectedSubject === subject.code;
                          const hours =
                            (subject.slot && subject.slot > 0 ? subject.slot : 1) * 3;

                          return (
                            <Card
                              key={subject.code}
                              hoverable
                              onClick={() =>
                                !disabled &&
                                handleSubjectClick(subject, cat, sub)
                              }
                              style={{
                                width: 180,
                                minWidth: 180,
                                flex: "0 0 auto",
                                borderRadius: 12,
                                border: isSelected
                                  ? "2px solid #1677ff"
                                  : "1px solid #e5e7eb",
                                opacity: disabled ? 0.6 : 1,
                                cursor: disabled ? "not-allowed" : "pointer",
                              }}
                              cover={
                                <div
                                  style={{
                                    width: "100%",
                                    aspectRatio: "4 / 3",
                                    background: subjectImage
                                      ? "#000"
                                      : "#f8fafc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderBottom: "1px solid #e2e8f0",
                                  }}
                                >
                                  {subjectImage ? (
                                    <img
                                      src={subjectImage}
                                      alt={subject.name_th}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    <AppstoreOutlined
                                      style={{ fontSize: 36, color: "#94a3b8" }}
                                    />
                                  )}
                                </div>
                              }
                            >
                              <Card.Meta
                                title={
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "0.95rem",
                                      color: "#1e293b",
                                      textAlign: "center",
                                    }}
                                  >
                                    {subject.name_th}
                                  </div>
                                }
                                description={
                                  <div style={{ textAlign: "center", marginTop: 6 }}>
                                    <Space
                                      size={4}
                                      wrap
                                      style={{ justifyContent: "center" }}
                                    >
                                      <Tag color="blue">
                                        ฿
                                        {subject.price != null
                                          ? Number(subject.price).toLocaleString()
                                          : 0}
                                      </Tag>
                                      <Tag color="green">
                                        {subject.student_max} คน
                                      </Tag>
                                      <Tag color="geekblue">{hours} ชม.</Tag>
                                    </Space>
                                  </div>
                                }
                              />
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <Empty description="ยังไม่มีข้อมูลวิชาในระดับนี้" />
          )}
        </Spin>
      </Modal>

      {/* ------------------ Drawer ------------------ */}
      <Drawer
        title={selectedSubjectDetail?.name_th || "รายละเอียดคอร์ส"}
        placement="right"
        width={420}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: 20, background: "#f9fafb" }}
      >
        {selectedSubjectDetail ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: resolveImageUrl(selectedSubjectDetail.image)
                  ? "#000"
                  : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {resolveImageUrl(selectedSubjectDetail.image) ? (
                <img
                  src={resolveImageUrl(selectedSubjectDetail.image)}
                  alt={selectedSubjectDetail.name_th}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <AppstoreOutlined style={{ fontSize: 48, color: "#94a3b8" }} />
              )}
            </div>

            <Title level={4} style={{ marginBottom: 4, color: "#0f172a" }}>
              {selectedSubjectDetail.name_th}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              รหัสวิชา: {selectedSubjectDetail.code}
            </Text>

            <div style={{ margin: "10px 0 14px" }}>
              <Breadcrumb
                items={[
                  { title: selectedSubjectDetail.categoryInfo?.category_th },
                  { title: selectedSubjectDetail.subcategoryInfo?.subcategory_th },
                ]}
              />
            </div>

            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <Title level={3} style={{ margin: 0, color: "#2563eb" }}>
                ฿{Number(selectedSubjectDetail.price || 0).toLocaleString("th-TH")}
              </Title>
              <Text style={{ color: "#475569" }}>ราคาต่อคอร์ส</Text>
            </div>

            {/* ✅ Moved button here */}
            <Button
              type="primary"
              block
              size="large"
              style={{ background: "#1677ff", fontWeight: 600, marginBottom: 20 }}
              disabled={!selectedSubjectDetail?.isAvailable}
              onClick={() => {
                if (handleOk()) {
                  setDrawerVisible(false);
                  handleCancel();
                }
              }}
            >
              เลือกคอร์สนี้
            </Button>

            {/* Description moved below button */}
            <Paragraph
              style={{
                color: "#334155",
                marginTop: 10,
                maxHeight: 240,
                overflowY: "auto",
                lineHeight: 1.6,
              }}
            >
              {selectedSubjectDetail.description_th || "ไม่มีรายละเอียดคอร์ส"}
            </Paragraph>
          </div>
        ) : (
          <Empty description="ไม่มีข้อมูลคอร์ส" />
        )}
      </Drawer>
    </>
  );
};

export default SubjectSelectionModal;
