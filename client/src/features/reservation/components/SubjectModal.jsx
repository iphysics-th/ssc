import React, { useEffect, useState } from "react";
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
    setDrawerVisible(false);
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

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject.code);
    setSelectedSubjectDetail(subject);
    setDrawerVisible(true);
  };

  const handleOk = () => {
    const selected = findSubjectByCode(selectedSubject);
    if (selected) {
      onSubjectSelected({
        subject: selected.subject,
        level: selectedLevel,
        category: selected.category.category_en,
        subcategory: selected.subcategory.subcategory_en,
      });
    }
    handleCancel();
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
            onClick={handleOk}
            disabled={!selectedSubject}
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
                {cat.category_th}
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
            {structuredSubjects
              .find((cat) => cat.category_en === selectedCategory)
              ?.subcategories.map((sub) => (
                <Option key={sub.subcategory_en} value={sub.subcategory_en}>
                  {sub.subcategory_th}
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
              {filteredStructure.map((cat) => (
                <div key={cat.category_en} style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      background:
                        "linear-gradient(90deg, #f1f5f9 0%, #ffffff 100%)",
                      borderLeft: "6px solid #1677ff",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: 16,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      {cat.category_th}
                    </Title>
                  </div>

                  {cat.subcategories.map((sub) => (
                    <div key={sub.subcategory_en} style={{ marginBottom: 24 }}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          color: "#334155",
                          marginBottom: 10,
                        }}
                      >
                        {sub.subcategory_th}
                      </Text>

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          overflowX: "auto",
                          paddingBottom: 8,
                        }}
                      >
                        {sub.subjects.map((subject) => {
                          const disabled =
                            subject.student_max < numberOfStudents;
                          const isSelected =
                            selectedSubject === subject.code;

                          return (
                            <Card
                              key={subject.code}
                              hoverable={!disabled}
                              onClick={() =>
                                !disabled && handleSubjectClick(subject)
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
                                cursor: disabled
                                  ? "not-allowed"
                                  : "pointer",
                                transition: "all 0.2s ease",
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
                                  <div
                                    style={{
                                      textAlign: "center",
                                      marginTop: 6,
                                    }}
                                  >
                                    <Tag color="blue">
                                      ฿{subject.price || 0}
                                    </Tag>
                                    <Tag color="green">
                                      {subject.student_max} คน
                                    </Tag>
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
        width={400}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedSubjectDetail ? (
          <div>
            {/* Thumbnail */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                    borderRadius: 8,
                  }}
                />
              ) : (
                <AppstoreOutlined style={{ fontSize: 48, color: "#94a3b8" }} />
              )}
            </div>

            {/* Breadcrumb */}
            <Breadcrumb
              style={{ marginBottom: 8 }}
              items={[
                {
                  title:
                    findSubjectByCode(selectedSubject)?.category?.category_th ||
                    "",
                },
                {
                  title:
                    findSubjectByCode(selectedSubject)?.subcategory
                      ?.subcategory_th || "",
                },
              ]}
            />

            {/* Price and Limit */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Tag color="blue">฿{selectedSubjectDetail.price || 0}</Tag>
              <Tag color="green">
                จำนวนนักเรียนสูงสุด {selectedSubjectDetail.student_max} คน
              </Tag>
            </div>

            {/* Summary */}
            <Paragraph
              style={{
                color: "#334155",
                maxHeight: 240,
                overflowY: "auto",
                marginBottom: 20,
              }}
            >
              {selectedSubjectDetail.description ||
                "ไม่มีรายละเอียดคอร์สเพิ่มเติม"}
            </Paragraph>

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() =>
                  navigate(`/courses/${selectedSubjectDetail.code}`)
                }
              >
                ดูรายละเอียดเพิ่มเติม
              </Button>
              <Button
                onClick={() => {
                  setDrawerVisible(false);
                  handleOk();
                }}
              >
                เลือกคอร์สนี้
              </Button>
            </div>
          </div>
        ) : (
          <Empty description="ไม่มีข้อมูลคอร์ส" />
        )}
      </Drawer>
    </>
  );
};

export default SubjectSelectionModal;
