import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
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
  Tooltip,
  message,
} from "antd";
import {
  BookOutlined,
  AppstoreOutlined,
  FilterOutlined,
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

const normalizeDateKey = (value) => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.format("YYYY-MM-DD");
};

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  const buddhistYear = date.year() + 543;
  const monthName = date.locale("th").format("MMMM");
  return `${date.format("D")} ${monthName} ${buddhistYear}`;
};

const SubjectSelectionModal = ({
  isModalVisible,
  handleCancel,
  onSubjectSelected,
  classStudentCount = 0,
  resolveSubcategoryBlock,
  buildRuleBlockMessage,
  activeSlot = null,
  existingSubjectOrder = [],
  subjectUsageBySlot = {},
  overallSubjectCounts = {},
  activeSlotKey = null,
  activeClassIndex = 0,
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

  const isCategoryOpen = (category) => !category || category.isActive !== false;
  const isSubcategoryOpen = (subcategory, category) => {
    if (!subcategory) return isCategoryOpen(category);
    return (
      isCategoryOpen(category) &&
      subcategory.isActive !== false &&
      subcategory.isCategoryActive !== false
    );
  };
  const isSubjectOpen = (subject, category, subcategory) =>
    !!(
      subject &&
      isSubcategoryOpen(subcategory, category) &&
      subject.isActive !== false &&
      subject.isCategoryActive !== false &&
      subject.isSubcategoryActive !== false
    );

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
        (sub) => !selectedSubcategory || sub.subcategory_en === selectedSubcategory
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

  const normalizedSubjectOrder = useMemo(() => {
    if (!Array.isArray(existingSubjectOrder)) return [];
    return existingSubjectOrder
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === "string") {
          return { code: entry, slotIndex: Number.MAX_SAFE_INTEGER };
        }
        if (typeof entry === "object") {
          const code =
            typeof entry.code === "string" && entry.code.trim().length
              ? entry.code
              : null;
          if (!code) return null;
          const slotIndexRaw =
            typeof entry.slotIndex === "number" && Number.isFinite(entry.slotIndex)
              ? entry.slotIndex
              : Number.MAX_SAFE_INTEGER;
          return { code, slotIndex: slotIndexRaw };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.slotIndex - b.slotIndex);
  }, [existingSubjectOrder]);

  const isFirstClass = Number(activeClassIndex) === 0;
  const hasPriorSubjectInClass = normalizedSubjectOrder.length > 0;

  const resolveAvailability = useCallback(
    (subject) => {
      const code = subject?.code || null;
      if (!code) {
        return {
          total: null,
          used: 0,
          reserved: 0,
          remaining: null,
          isFull: false,
        };
      }
      const totalRaw =
        subject?.total_classroom != null
          ? Number(subject.total_classroom)
          : subject?.total_classrooms != null
            ? Number(subject.total_classrooms)
            : null;
      const total =
        Number.isFinite(totalRaw) && totalRaw > 0 ? Math.floor(totalRaw) : null;
      const slotUsage = activeSlotKey && subjectUsageBySlot?.[activeSlotKey]
        ? subjectUsageBySlot[activeSlotKey][code] || 0
        : 0;
      let reservedUsage = 0;
      const activeDateKey = normalizeDateKey(activeSlot?.dateValue);
      if (subject?.reservedSlots && activeDateKey) {
        const reservedByDate = subject.reservedSlots[activeDateKey];
        if (reservedByDate) {
          const slotLabelKey = activeSlot?.slotLabel;
          const fallbackKey = Number.isFinite(activeSlot?.slotIndex)
            ? `slot-${Number(activeSlot.slotIndex)}`
            : null;
          const value =
            (slotLabelKey && reservedByDate[slotLabelKey]) ??
            (fallbackKey && reservedByDate[fallbackKey]) ??
            0;
          if (Number.isFinite(value)) {
            reservedUsage = value;
          }
        }
      }
      const combinedUsage = slotUsage + reservedUsage;
      const remaining = total != null ? Math.max(total - combinedUsage, 0) : null;
      return {
        total,
        used: combinedUsage,
        reserved: reservedUsage,
        remaining,
        isFull: total != null && remaining <= 0,
      };
    },
    [subjectUsageBySlot, activeSlotKey, activeSlot]
  );

  const buildDiscountInfo = useCallback(
    (subject) => {
      const basePrice = Number(subject?.price) || 0;
      const code = subject?.code || null;
      const perClassEligible = !isFirstClass || hasPriorSubjectInClass;
      const overallCount = code ? overallSubjectCounts?.[code] || 0 : 0;
      const totalClassrooms =
        subject?.total_classroom != null
          ? Number(subject.total_classroom)
          : subject?.total_classrooms != null
            ? Number(subject.total_classrooms)
            : null;
      const repeatEligible =
        Number.isFinite(totalClassrooms) &&
        totalClassrooms > 2 &&
        overallCount >= 1;
      const discountEligible = perClassEligible || repeatEligible;
      const discountAmount = discountEligible ? Math.min(4000, basePrice) : 0;
      const discountedPrice = Math.max(0, basePrice - discountAmount);
      return {
        basePrice,
        discountAmount,
        discountedPrice,
        isDiscountApplied: discountAmount > 0,
        perClassEligible,
        repeatEligible,
      };
    },
    [isFirstClass, hasPriorSubjectInClass, overallSubjectCounts]
  );

  const canConfirmSelection = useMemo(() => {
    if (!selectedRecord) return false;
    const subjectOpen = isSubjectOpen(
      selectedRecord.subject,
      selectedRecord.category,
      selectedRecord.subcategory
    );
    if (!subjectOpen) return false;
    const availability = resolveAvailability(selectedRecord.subject);
    if (availability.isFull) return false;
    if (
      typeof resolveSubcategoryBlock === "function" &&
      selectedRecord.subcategory?.subcategory_en
    ) {
      const duration =
        selectedRecord.subject?.slot && selectedRecord.subject.slot > 0
          ? selectedRecord.subject.slot
          : 1;
      const blockInfo = resolveSubcategoryBlock(
        selectedRecord.subcategory.subcategory_en,
        duration
      );
      if (blockInfo) return false;
    }
    return true;
  }, [selectedRecord, resolveAvailability, resolveSubcategoryBlock]);

  const handleSubjectClick = (
    subject,
    category,
    subcategory,
    blockInfo,
    blockMessage
  ) => {
    const subjectOpen = isSubjectOpen(subject, category, subcategory);
    const overflowCount = Math.max(
      0,
      classStudentCount > 0 && subject.student_max
        ? classStudentCount - subject.student_max
        : 0
    );
    const overflowTooHigh = overflowCount > 5;
    const availability = resolveAvailability(subject);
    const blockedByRule = !!blockInfo;

    if (blockedByRule)
      return message.warning(
        blockMessage || "หัวข้อย่อยนี้ปิดรับในช่วงเวลาที่เลือก"
      );

    if (!subjectOpen) return message.warning("คอร์สนี้ปิดรับแล้ว");
    if (availability.isFull)
      return message.warning("ช่วงเวลานี้ถูกจองเต็มแล้ว");
    if (overflowTooHigh)
      return message.warning(
        "มีนักเรียนเกินจำนวนที่คอร์สรองรับมากกว่า 5 คน ไม่สามารถเลือกวิชานี้ได้"
      );
    if (overflowCount > 0) {
      message.info(
        `มีนักเรียนเกินจำนวนที่คอร์สรองรับ ${overflowCount} คน\nจะมีค่าบริการเพิ่ม ${overflowCount.toLocaleString(
          "th-TH"
        )} คน x 200 บาท = ${(
          overflowCount * 200
        ).toLocaleString("th-TH")} บาท`
      );
    }

    setSelectedSubject(subject.code);
    setSelectedSubjectDetail({
      ...subject,
      categoryInfo: category
        ? {
            category_en: category.category_en,
            category_th: category.category_th,
          }
        : null,
      subcategoryInfo: subcategory
        ? {
            subcategory_en: subcategory.subcategory_en,
            subcategory_th: subcategory.subcategory_th,
          }
        : null,
      isAvailable: subjectOpen && !blockedByRule && !availability.isFull,
      overflowCount,
      overflowCharge: overflowCount * 200,
      overflowTooHigh,
      discountInfo: buildDiscountInfo(subject),
      availability,
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
        {/* ---------- Tabs ---------- */}
        {activeSlot && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <div>
                <div>
                  กำลังเลือกวิชาสำหรับวันที่{" "}
                  <strong>
                    {activeSlot.displayDate ||
                      formatBuddhistDate(activeSlot.dateValue)}
                  </strong>
                </div>
                <div>ช่วงเวลา: {activeSlot.slotLabel}</div>
              </div>
            }
          />
        )}
        <Tabs
          activeKey={selectedLevel}
          onChange={handleLevelChange}
          centered
          items={levels.map((lvl) => ({
            key: lvl.level_en,
            label: lvl.level_th,
          }))}
        />
        

        {/* ✅ Added filter dropdowns inside tab */}
        {structuredSubjects.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <Select
              allowClear
              placeholder="กรองตามกลุ่มวิชา"
              style={{ minWidth: 220 }}
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
              style={{ minWidth: 220 }}
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

        {/* ---------- Subject Cards ---------- */}
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
                          const subjectOpen = isSubjectOpen(subject, cat, sub);
                          const overflowCount = Math.max(
                            0,
                            classStudentCount > 0 && subject.student_max
                              ? classStudentCount - subject.student_max
                              : 0
                          );
                          const overflowTooHigh = overflowCount > 5;
                          const durationSlots =
                            subject.slot && subject.slot > 0 ? subject.slot : 1;
                          const blockInfo =
                            typeof resolveSubcategoryBlock === "function"
                              ? resolveSubcategoryBlock(
                                  sub.subcategory_en,
                                  durationSlots
                                )
                              : null;
                          const blockMessage =
                            blockInfo && typeof buildRuleBlockMessage === "function"
                              ? buildRuleBlockMessage(
                                  blockInfo,
                                  sub.subcategory_th || sub.subcategory_en
                                )
                              : null;
                          const blockedByRule = !!blockInfo;
                          const discountInfo = buildDiscountInfo(subject);
                          const availability = resolveAvailability(subject);
                          const disabled =
                            !subjectOpen ||
                            blockedByRule ||
                            overflowTooHigh ||
                            availability.isFull;
                          const isSelected = selectedSubject === subject.code;
                          const hours = durationSlots * 3;

                          return (
                            <Card
                              key={subject.code}
                              hoverable
                              onClick={() =>
                                handleSubjectClick(
                                  subject,
                                  cat,
                                  sub,
                                  blockInfo,
                                  blockMessage
                                )
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
                                transition: "all 0.2s ease",
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
                                    <div style={{ marginBottom: 6 }}>
                                      {discountInfo.isDiscountApplied ? (
                                        <>
                                          <Text
                                            delete
                                            style={{ marginRight: 8, fontSize: "1rem" }}
                                          >
                                            ราคาปกติ ฿{discountInfo.basePrice.toLocaleString("th-TH")} บาท
                                          </Text>
                                          <Text strong style={{ color: "#16a34a", fontSize: "1.1rem" }}>
                                            ราคาหลังส่วนลด ฿{discountInfo.discountedPrice.toLocaleString("th-TH")} บาท
                                          </Text>
                                        </>
                                      ) : (
                                        <Text strong style={{ fontSize: "1.1rem" }}>
                                          ราคาปกติ ฿{discountInfo.basePrice.toLocaleString("th-TH")} บาท
                                        </Text>
                                      )}
                                    </div>
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
                                      {availability.total != null && (
                                        <Tag
                                          color={
                                            availability.remaining > 0
                                              ? "cyan"
                                              : "magenta"
                                          }
                                        >
                                          ห้องว่าง {availability.remaining}/
                                          {availability.total}
                                        </Tag>
                                      )}
                                      {overflowCount > 0 && !overflowTooHigh && (
                                        <Tag color="volcano">
                                          เกิน {overflowCount} คน (+฿
                                          {(overflowCount * 200).toLocaleString(
                                            "th-TH"
                                          )}
                                          )
                                        </Tag>
                                      )}
                                      {overflowTooHigh && (
                                        <Tag color="red">
                                          มีนักเรียนเกินจำนวนที่คอร์สรองรับมากกว่า 5 คน ไม่สามารถเลือกวิชานี้ได้
                                        </Tag>
                                      )}
                                    </Space>
                                    {overflowCount > 0 && !overflowTooHigh && (
                                      <Paragraph
                                        style={{ fontSize: 12, marginTop: 8, color: "#dc2626" }}
                                      >
                                        มีนักเรียนเกินจำนวนที่คอร์สรองรับ{" "}
                                        {overflowCount.toLocaleString("th-TH")} คน<br />
                                        จะมีค่าบริการเพิ่ม{" "}
                                        {overflowCount.toLocaleString("th-TH")} คน x 200 บาท ={" "}
                                        {(overflowCount * 200).toLocaleString("th-TH")} บาท
                                      </Paragraph>
                                    )}
                                    {overflowTooHigh && (
                                      <Paragraph
                                        type="danger"
                                        style={{ fontSize: 12, marginTop: 8 }}
                                      >
                                        มีนักเรียนเกินจำนวนที่คอร์สรองรับมากกว่า 5 คน ไม่สามารถเลือกวิชานี้ได้
                                      </Paragraph>
                                    )}
                                    {blockMessage && (
                                      <Paragraph
                                        type="danger"
                                        style={{ fontSize: 12, marginTop: 8 }}
                                      >
                                        {blockMessage}
                                      </Paragraph>
                                    )}
                                  </div>
                                }
                              />
                              {blockedByRule && (
                                <Tooltip title={blockMessage}>
                                  <Tag color="red" style={{ marginTop: 8 }}>
                                    ช่วงนี้ปิดรับ
                                  </Tag>
                                </Tooltip>
                              )}
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

      {/* ---------- Drawer ---------- */}
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
                  {selectedSubjectDetail.discountInfo?.isDiscountApplied ? (
                    <>
                      <div style={{ marginBottom: 6 }}>
                        <Text delete style={{ fontSize: "1.2rem", color: "#64748b" }}>
                          ราคาปกติ ฿
                          {selectedSubjectDetail.discountInfo.basePrice.toLocaleString(
                            "th-TH"
                          )} บาท
                        </Text>
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <Text
                          strong
                          style={{ fontSize: "1.8rem", color: "#16a34a" }}
                        >
                          ราคาหลังส่วนลด ฿
                          {selectedSubjectDetail.discountInfo.discountedPrice.toLocaleString(
                            "th-TH"
                          )} บาท
                        </Text>
                      </div>
                      <Text style={{ color: "#16a34a" }}>
                        ส่วนลด -฿
                        {selectedSubjectDetail.discountInfo.discountAmount.toLocaleString(
                          "th-TH"
                        )} บาท
                      </Text>
                    </>
                  ) : (
                    <Title level={3} style={{ margin: 0, color: "#2563eb" }}>
                      ฿{Number(selectedSubjectDetail.price || 0).toLocaleString("th-TH")} บาท
                    </Title>
                  )}
                  <Text style={{ color: "#475569" }}>ราคาต่อคอร์ส</Text>
                </div>

            {/* ✅ moved button here */}
            <Button
              type="primary"
              block
              size="large"
              style={{
                background: "#1677ff",
                fontWeight: 600,
                marginBottom: 20,
              }}
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

            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <Tag color="blue">
                ระดับชั้น: {selectedSubjectDetail.level_th || "-"}
              </Tag>
              <Tag color="green">
                จำนวนนักเรียนสูงสุด: {selectedSubjectDetail.student_max} คน
              </Tag>
              {selectedSubjectDetail.availability &&
                selectedSubjectDetail.availability.total != null && (
                  <Tag
                    color={
                      selectedSubjectDetail.availability.remaining > 0
                        ? "cyan"
                        : "magenta"
                    }
                  >
                    ห้องว่าง{" "}
                    {selectedSubjectDetail.availability.remaining.toLocaleString(
                      "th-TH"
                    )}
                    /
                    {selectedSubjectDetail.availability.total.toLocaleString(
                      "th-TH"
                    )}
                  </Tag>
                )}
              {selectedSubjectDetail.overflowTooHigh ? (
                <Alert
                  type="error"
                  showIcon
                  message="มีนักเรียนเกินจำนวนที่คอร์สรองรับมากกว่า 5 คน"
                  description="ไม่สามารถเลือกวิชานี้ได้"
                  style={{ marginTop: 4 }}
                />
              ) : (
                selectedSubjectDetail.overflowCount > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message={`มีนักเรียนเกินจำนวนที่คอร์สรองรับ ${selectedSubjectDetail.overflowCount.toLocaleString(
                      "th-TH"
                    )} คน`}
                    description={`จะมีค่าบริการเพิ่ม ${selectedSubjectDetail.overflowCount.toLocaleString(
                      "th-TH"
                    )} คน x 200 บาท = ฿${(
                      selectedSubjectDetail.overflowCharge || 0
                    ).toLocaleString("th-TH")}`}
                    style={{ marginTop: 4 }}
                  />
                )
              )}
              {selectedSubjectDetail.total_classroom && (
                <Tag color="purple">
                  จำนวนห้องที่เปิด: {selectedSubjectDetail.total_classroom} ห้อง
                </Tag>
              )}
              <Tag color="geekblue">
                ระยะเวลาเรียน:{" "}
                {(selectedSubjectDetail.slot && selectedSubjectDetail.slot > 0
                  ? selectedSubjectDetail.slot
                  : 1) * 3}{" "}
                ชั่วโมง
              </Tag>
            </Space>

            <Paragraph
              style={{
                color: "#334155",
                marginTop: 20,
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
