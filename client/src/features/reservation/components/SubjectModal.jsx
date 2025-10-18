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
  Alert,
  message,
} from "antd";
import {
  BookOutlined,
  AppstoreOutlined,
  FilterOutlined,
  ArrowRightOutlined,
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
  numberOfStudents,
}) => {
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [structuredSubjects, setStructuredSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState(null); // 👈 New
  const [drawerVisible, setDrawerVisible] = useState(false); // 👈 New

  const navigate = useNavigate();

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

  const isCategoryOpen = (category) => !category || category.isActive !== false;

  const isSubcategoryOpen = (subcategory, category) => {
    if (!subcategory) {
      return isCategoryOpen(category);
    }
    const categoryOpen = isCategoryOpen(category);
    return (
      categoryOpen &&
      subcategory.isActive !== false &&
      subcategory.isCategoryActive !== false
    );
  };

  const isSubjectOpen = (subject, category, subcategory) => {
    if (!subject) {
      return false;
    }
    const subcategoryOpen = isSubcategoryOpen(subcategory, category);
    return (
      subcategoryOpen &&
      subject.isActive !== false &&
      subject.isCategoryActive !== false &&
      subject.isSubcategoryActive !== false
    );
  };

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

          subcatBlocks.push({
            ...sub,
            subjects: subjList ?? [],
          });
        }

        structured.push({
          ...cat,
          subcategories: subcatBlocks,
        });
      }

      setStructuredSubjects(structured);
    } catch (error) {
      console.error("Error building subject hierarchy:", error);
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
        if (subject)
          return {
            subject,
            category: cat,
            subcategory: sub,
          };
      }
    }
    return null;
  };

  const selectedRecord = useMemo(
    () => (selectedSubject ? findSubjectByCode(selectedSubject) : null),
    [selectedSubject, structuredSubjects]
  );

  const selectedCategoryData = useMemo(
    () =>
      selectedCategory
        ? structuredSubjects.find((cat) => cat.category_en === selectedCategory) || null
        : null,
    [structuredSubjects, selectedCategory]
  );

  const canConfirmSelection = useMemo(() => {
    if (!selectedRecord) {
      return false;
    }

    if (selectedRecord.subject.student_max < numberOfStudents) {
      return false;
    }

    return isSubjectOpen(
      selectedRecord.subject,
      selectedRecord.category,
      selectedRecord.subcategory
    );
  }, [selectedRecord, numberOfStudents]);

  const availabilityNotice = useMemo(() => {
    const details = selectedSubjectDetail;
    if (!details?.availability) {
      return [];
    }

    const { categoryOpen, subcategoryOpen, subjectOpen, capacityAvailable } =
      details.availability;

    const reasons = [];

    if (!categoryOpen) {
      reasons.push("กลุ่มวิชาปิดรับ");
    }

    if (categoryOpen && !subcategoryOpen) {
      reasons.push("หัวข้อย่อยปิดรับ");
    }

    if (categoryOpen && subcategoryOpen && !subjectOpen) {
      reasons.push("คอร์สปิดรับ");
    }

    if (!capacityAvailable) {
      reasons.push("จำนวนผู้เรียนเกินโควต้า");
    }

    return reasons;
  }, [selectedSubjectDetail]);

  const handleSubjectClick = (subject, category, subcategory) => {
    const subjectOpen = isSubjectOpen(subject, category, subcategory);
    const capacityExceeded = subject.student_max < numberOfStudents;

    if (!subjectOpen) {
      message.warning("คอร์สนี้ปิดรับแล้ว");
    } else if (capacityExceeded) {
      message.warning("จำนวนผู้เรียนเกินกว่าที่คอร์สเปิดรับ");
    }

    setSelectedSubject(subject.code);
    setSelectedSubjectDetail({
      ...subject,
      price: Number.isFinite(Number(subject.price)) ? Number(subject.price) : 0,
      categoryInfo: category
        ? {
          category_en: category.category_en,
          category_th: category.category_th,
          isActive: category.isActive !== false,
        }
        : null,
      subcategoryInfo: subcategory
        ? {
          subcategory_en: subcategory.subcategory_en,
          subcategory_th: subcategory.subcategory_th,
          isActive: subcategory.isActive !== false,
          isCategoryActive: subcategory.isCategoryActive !== false,
        }
        : null,
      isAvailable: subjectOpen && !capacityExceeded,
      availability: {
        subjectOpen,
        categoryOpen: isCategoryOpen(category),
        subcategoryOpen: isSubcategoryOpen(subcategory, category),
        capacityAvailable: !capacityExceeded,
      },
    });
    setDrawerVisible(true);
  };

  const handleOk = () => {
    const selected = findSubjectByCode(selectedSubject);
    if (!selected) {
      return false;
    }

    const subjectOpen = isSubjectOpen(
      selected.subject,
      selected.category,
      selected.subcategory
    );
    const capacityAvailable = selected.subject.student_max >= numberOfStudents;

    if (!subjectOpen) {
      message.warning("คอร์สนี้ปิดรับแล้ว");
      return false;
    }

    if (!capacityAvailable) {
      message.warning("จำนวนผู้เรียนเกินกว่าที่คอร์สเปิดรับ");
      return false;
    }

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
            onClick={() => {
              if (handleOk()) {
                handleCancel();
              }
            }}
            disabled={!canConfirmSelection}
          >
            ตกลง
          </Button>,
        ]}
      >
        <Tabs
          activeKey={selectedLevel}
          onChange={handleLevelChange}
          centered
          items={levels.map((lvl) => ({
            key: lvl.level_en,
            label: lvl.level_th,
          }))}
          style={{ marginBottom: 16 }}
        />

        {/* Filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <FilterOutlined style={{ color: "#64748b" }} />

          <Select
            placeholder="เลือกกลุ่มวิชา (ถ้าต้องการ)"
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ minWidth: 200 }}
            allowClear
            disabled={!structuredSubjects.length}
          >
            {structuredSubjects.map((cat) => (
              <Option key={cat.category_en} value={cat.category_en}>
                <Space size={4}>
                  <span>{cat.category_th}</span>
                  {cat.isActive === false && <Tag color="red">ปิดรับ</Tag>}
                </Space>
              </Option>
            ))}
          </Select>

          <Select
            placeholder="เลือกสาขาย่อย (ถ้าต้องการ)"
            value={selectedSubcategory}
            onChange={setSelectedSubcategory}
            style={{ minWidth: 200 }}
            allowClear
            disabled={!selectedCategory}
          >
            {selectedCategoryData?.subcategories.map((sub) => (
              <Option key={sub.subcategory_en} value={sub.subcategory_en}>
                <Space size={4}>
                  <span>{sub.subcategory_th}</span>
                  {!isSubcategoryOpen(sub, selectedCategoryData) && (
                    <Tag color="red">ปิดรับ</Tag>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
        </div>

        {/* Subject Browser */}
        <Spin spinning={loading}>
          {filteredStructure.length ? (
            <div
              style={{
                maxHeight: "65vh",
                overflowY: "auto",
                paddingRight: 10,
              }}
            >
              {filteredStructure.map((cat) => {
                const categoryOpen = isCategoryOpen(cat);
                return (
                  <div key={cat.category_en} style={{ marginBottom: 32 }}>
                    {/* Category Header */}
                    <div
                      style={{
                        background: "linear-gradient(90deg, #f1f5f9 0%, #ffffff 100%)",
                        borderLeft: "6px solid #1677ff",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        marginBottom: 16,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        opacity: categoryOpen ? 1 : 0.7,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>
                          {cat.category_th}
                        </Title>
                        {!categoryOpen && <Tag color="red">ปิดรับ</Tag>}
                      </div>
                    </div>

                    {/* Subcategories */}
                    {cat.subcategories.map((sub) => {
                      const subcategoryOpen = isSubcategoryOpen(sub, cat);
                      return (
                        <div key={sub.subcategory_en} style={{ marginBottom: 24 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              color: "#334155",
                              marginBottom: 10,
                              opacity: subcategoryOpen ? 1 : 0.7,
                            }}
                          >
                            <Text strong>{sub.subcategory_th}</Text>
                            {!subcategoryOpen && <Tag color="red">ปิดรับ</Tag>}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              overflowX: "auto",
                              paddingBottom: 8,
                            }}
                          >
                            {sub.subjects.map((subject) => {
                              const categoryOpen = isCategoryOpen(cat);
                              const subcategoryOpen = isSubcategoryOpen(sub, cat);
                              const subjectOpen = isSubjectOpen(subject, cat, sub);
                              const capacityExceeded = subject.student_max < numberOfStudents;
                              const disabled = !subjectOpen || capacityExceeded;
                              const isSelected = selectedSubject === subject.code;

                              return (
                                <Card
                                  key={subject.code}
                                  hoverable
                                  onClick={() => handleSubjectClick(subject, cat, sub)}
                                  style={{
                                    width: 180,
                                    minWidth: 180,
                                    flex: "0 0 auto",
                                    borderRadius: 12,
                                    border: isSelected
                                      ? "2px solid #1677ff"
                                      : "1px solid #e5e7eb",
                                    opacity: disabled ? 0.6 : 1,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    position: "relative",
                                  }}
                                  cover={
                                    <div
                                      style={{
                                        width: "100%",
                                        aspectRatio: "4 / 3",
                                        background: "#f8fafc",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 36,
                                        color: "#94a3b8",
                                        borderBottom: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <AppstoreOutlined />
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
                                        <Space size={4} wrap style={{ justifyContent: "center" }}>
                                          <Tag color="blue">
                                            ฿
                                            {subject.price != null
                                              ? Number(subject.price).toLocaleString()
                                              : 0}
                                          </Tag>
                                          <Tag color="green">{subject.student_max} คน</Tag>
                                          {!categoryOpen && <Tag color="red">ปิดรับ (กลุ่มวิชา)</Tag>}
                                          {categoryOpen && !subcategoryOpen && (
                                            <Tag color="red">ปิดรับ (หัวข้อย่อย)</Tag>
                                          )}
                                          {subcategoryOpen && !subjectOpen && (
                                            <Tag color="red">ปิดรับ</Tag>
                                          )}
                                          {capacityExceeded && (
                                            <Tag color="orange">เกินโควต้า</Tag>
                                          )}
                                        </Space>
                                      </div>
                                    }
                                  />
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="ยังไม่มีข้อมูลวิชาในระดับนี้"
            />
          )}
        </Spin>

      </Modal>

      {/* Slide-in Drawer (Course Detail) */}
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
            {/* Thumbnail */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {selectedSubjectDetail.thumbnail ? (
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}/${selectedSubjectDetail.thumbnail}`}
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

            {/* Title & Code */}
            <Title
              level={4}
              style={{
                marginBottom: 4,
                color: "#0f172a",
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {selectedSubjectDetail.name_th}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              รหัสวิชา: {selectedSubjectDetail.code}
            </Text>

            {/* Breadcrumb */}
            <Breadcrumb
              style={{ margin: "10px 0 14px" }}
              items={[
                {
                  title:
                    findSubjectByCode(selectedSubject)?.category?.category_th || "",
                },
                {
                  title:
                    findSubjectByCode(selectedSubject)?.subcategory?.subcategory_th ||
                    "",
                },
              ]}
            />

            {/* Highlighted Price */}
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
              <Title
                level={3}
                style={{
                  margin: 0,
                  color: "#2563eb",
                  fontWeight: 800,
                }}
              >
                ฿{Number(selectedSubjectDetail.price || 0).toLocaleString("th-TH")}
              </Title>
              <Text style={{ color: "#475569" }}>ราคาต่อคอร์ส</Text>
            </div>

            {/* Course Info */}
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                <Tag color="blue">ระดับชั้น: {selectedSubjectDetail.level_th}</Tag>
                <Tag color="green">
                  จำนวนนักเรียนสูงสุด: {selectedSubjectDetail.student_max} คน
                </Tag>
                {selectedSubjectDetail.total_classroom && (
                  <Tag color="purple">
                    จำนวนห้องที่เปิด: {selectedSubjectDetail.total_classroom} ห้อง
                  </Tag>
                )}
              </Space>
            </div>

            {/* Warnings */}
            {!selectedSubjectDetail.isAvailable && availabilityNotice.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="คอร์สนี้ไม่พร้อมสำหรับการจอง"
                description={availabilityNotice.join(" • ")}
              />
            )}

            {/* Description */}
            <Paragraph
              style={{
                color: "#334155",
                maxHeight: 240,
                overflowY: "auto",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {selectedSubjectDetail.description_th ||
                "ไม่มีรายละเอียดคอร์สเพิ่มเติม"}
            </Paragraph>

            {/* Button */}
            <Button
              type="primary"
              block
              size="large"
              style={{
                background: "#1677ff",
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
              disabled={!selectedSubjectDetail?.isAvailable}
              onClick={() => {
                const success = handleOk();
                if (success) {
                  setDrawerVisible(false);
                  handleCancel();
                }
              }}
            >
              เลือกคอร์สนี้
            </Button>
          </div>
        ) : (
          <Empty description="ไม่มีข้อมูลคอร์ส" />
        )}
      </Drawer>

    </>
  );
};

export default SubjectSelectionModal;
