import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  Typography,
  List,
  Button,
  Space,
  Tag,
  Empty,
  Skeleton,
  Form,
  Input,
  InputNumber,
  message,
  Divider,
  Upload,
  Modal,
  Switch,
  Popconfirm,
} from "antd";
import {
  useGetSubjectLevelsQuery,
  useLazyGetSubjectsByLevelQuery,
  useLazyGetSubjectsByCategoryQuery,
  useLazyGetSubjectsBySubcategoryQuery,
  useGetSubjectDetailQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useUpdateSubjectStatusMutation,
  useDeleteSubjectMutation,
  useUpdateCategoryStatusMutation,
  useUpdateSubcategoryStatusMutation,
} from "../../features/reservation/reservationApiSlice";
import {
  SaveOutlined,
  AppstoreOutlined,
  BookOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const buildAbsoluteUrl = (backendUrl, path) => {
  if (!path) return "";
  if (/^https?:/i.test(path)) return path;
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  if (!backendUrl) {
    return `/${normalized}`;
  }
  return `${backendUrl.replace(/\/$/, "")}/${normalized}`;
};

const { Option } = Select;
const { Title, Text } = Typography;

const CourseManagement = () => {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLevel, setCreateLevel] = useState(null);
  const [createCategory, setCreateCategory] = useState(null);
  const [createCategories, setCreateCategories] = useState([]);
  const [createSubcategories, setCreateSubcategories] = useState([]);
  const [isCreateCategoriesLoading, setIsCreateCategoriesLoading] = useState(false);
  const [isCreateSubcategoriesLoading, setIsCreateSubcategoriesLoading] = useState(false);
  const [createUploadFileList, setCreateUploadFileList] = useState([]);
  const [createImageFile, setCreateImageFile] = useState(null);
  const [currentSubjectActive, setCurrentSubjectActive] = useState(true);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const { data: levelOptions = [], isFetching: isLevelsLoading } =
    useGetSubjectLevelsQuery();
  const [fetchCategories] = useLazyGetSubjectsByLevelQuery();
  const [fetchSubcategories] = useLazyGetSubjectsByCategoryQuery();
  const [fetchCourses] = useLazyGetSubjectsBySubcategoryQuery();

  const {
    data: subjectDetail,
    isFetching: isDetailLoading,
    refetch: refetchDetail,
  } = useGetSubjectDetailQuery(selectedCourseId, {
    skip: !selectedCourseId,
  });

  const [createSubject, { isLoading: isCreatingSubject }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: isUpdating }] = useUpdateSubjectMutation();
  const [updateSubjectStatus, { isLoading: isUpdatingSubjectStatus }] =
    useUpdateSubjectStatusMutation();
  const [deleteSubject, { isLoading: isDeletingSubject }] = useDeleteSubjectMutation();
  const [updateCategoryStatus, { isLoading: isUpdatingCategoryStatus }] =
    useUpdateCategoryStatusMutation();
  const [updateSubcategoryStatus, { isLoading: isUpdatingSubcategoryStatus }] =
    useUpdateSubcategoryStatusMutation();

  const normalizeCourses = (list = []) =>
    list.map((item) => ({
      ...item,
      id: item.id || item._id || item.code,
    }));

  const currentCategory = useMemo(() => {
    if (!selectedCategory) {
      return null;
    }
    return categories.find((cat) => cat.category_en === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const currentSubcategory = useMemo(() => {
    if (!selectedSubcategory) {
      return null;
    }
    return (
      subcategories.find((sub) => sub.subcategory_en === selectedSubcategory) || null
    );
  }, [subcategories, selectedSubcategory]);

  const resetSelection = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedCourseId(null);
    setCategories([]);
    setSubcategories([]);
    setCourses([]);
    setUploadFileList([]);
    setImageFile(null);
    setCurrentSubjectActive(true);
  };

  const clearCreateUploadPreview = () => {
    createUploadFileList.forEach((file) => {
      if (file?.url && file.url.startsWith("blob:")) {
        URL.revokeObjectURL(file.url);
      }
    });
    setCreateUploadFileList([]);
    setCreateImageFile(null);
  };

  const resetCreateModalState = () => {
    clearCreateUploadPreview();
    createForm.resetFields();
    setCreateLevel(null);
    setCreateCategory(null);
    setCreateCategories([]);
    setCreateSubcategories([]);
  };

  const handleCreateModalClose = () => {
    if (isCreatingSubject) {
      return;
    }
    setIsCreateModalOpen(false);
    resetCreateModalState();
  };

  useEffect(() => {
    if (!selectedLevel) {
      resetSelection();
      return;
    }

    const run = async () => {
      setLoadingHierarchy(true);
      try {
        const result = await fetchCategories(selectedLevel).unwrap();
        setCategories(result ?? []);
      } catch (error) {
        console.error(error);
        message.error("ไม่สามารถโหลดกลุ่มวิชาได้");
      } finally {
        setLoadingHierarchy(false);
      }
    };

    run();
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSubcategories([]);
    setCourses([]);
    setUploadFileList([]);
    setImageFile(null);
    setSelectedCourseId(null);
    setCurrentSubjectActive(true);
  }, [selectedLevel, fetchCategories]);

  useEffect(() => {
    if (!selectedLevel || !selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory(null);
    setSelectedCourseId(null);
    setCourses([]);
    setUploadFileList([]);
    setImageFile(null);
    setCurrentSubjectActive(true);
    return;
  }

    const run = async () => {
      setLoadingHierarchy(true);
      try {
        const result = await fetchSubcategories({
          level: selectedLevel,
          category: selectedCategory,
        }).unwrap();
        setSubcategories(result ?? []);
      } catch (error) {
        console.error(error);
        message.error("ไม่สามารถโหลดหัวข้อย่อยได้");
      } finally {
        setLoadingHierarchy(false);
      }
    };

    run();
    setSelectedSubcategory(null);
    setCourses([]);
    setUploadFileList([]);
    setImageFile(null);
    setSelectedCourseId(null);
    setCurrentSubjectActive(true);
}, [selectedLevel, selectedCategory, fetchSubcategories]);

  useEffect(() => {
  if (!selectedLevel || !selectedCategory || !selectedSubcategory) {
    setCourses([]);
    setSelectedCourseId(null);
    setUploadFileList([]);
    setImageFile(null);
    setCurrentSubjectActive(true);
    return;
  }

    const run = async () => {
      setLoadingCourses(true);
      try {
        const result = await fetchCourses({
          level: selectedLevel,
          category: selectedCategory,
          subcategory: selectedSubcategory,
        }).unwrap();
        setCourses(normalizeCourses(result ?? []));
      } catch (error) {
        console.error(error);
        message.error("ไม่สามารถโหลดรายวิชาได้");
      } finally {
        setLoadingCourses(false);
      }
    };

  run();
  setSelectedCourseId(null);
  setCurrentSubjectActive(true);
}, [selectedLevel, selectedCategory, selectedSubcategory, fetchCourses]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return;
    }

    if (!createLevel) {
      setCreateCategories([]);
      setCreateCategory(null);
      setCreateSubcategories([]);
      createForm.setFieldsValue({
        category_en: undefined,
        subcategory_en: undefined,
      });
      return;
    }

    let canceled = false;

    const loadCategoriesForModal = async () => {
      setIsCreateCategoriesLoading(true);
      try {
        const result = await fetchCategories(createLevel).unwrap();
        if (canceled) return;
        setCreateCategories(result ?? []);
      } catch (error) {
        console.error(error);
        message.error("ไม่สามารถโหลดกลุ่มวิชาได้");
      } finally {
        if (!canceled) {
          setIsCreateCategoriesLoading(false);
        }
      }
    };

    setCreateCategory(null);
    setCreateSubcategories([]);
    createForm.setFieldsValue({
      category_en: undefined,
      subcategory_en: undefined,
    });

    loadCategoriesForModal();

    return () => {
      canceled = true;
    };
  }, [isCreateModalOpen, createLevel, fetchCategories, createForm]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return;
    }

    if (!createLevel || !createCategory) {
      setCreateSubcategories([]);
      createForm.setFieldsValue({
        subcategory_en: undefined,
      });
      return;
    }

    let canceled = false;

    const loadSubcategoriesForModal = async () => {
      setIsCreateSubcategoriesLoading(true);
      try {
        const result = await fetchSubcategories({
          level: createLevel,
          category: createCategory,
        }).unwrap();
        if (canceled) return;
        setCreateSubcategories(result ?? []);
      } catch (error) {
        console.error(error);
        message.error("ไม่สามารถโหลดหัวข้อย่อยได้");
      } finally {
        if (!canceled) {
          setIsCreateSubcategoriesLoading(false);
        }
      }
    };

    createForm.setFieldsValue({
      subcategory_en: undefined,
    });

    loadSubcategoriesForModal();

    return () => {
      canceled = true;
    };
  }, [isCreateModalOpen, createLevel, createCategory, fetchSubcategories, createForm]);

  useEffect(() => {
    if (!selectedCourseId) {
      form.resetFields();
      setUploadFileList([]);
      setImageFile(null);
      setCurrentSubjectActive(true);
      return;
    }

    if (!subjectDetail) {
      form.resetFields();
      setUploadFileList([]);
      setImageFile(null);
      setCurrentSubjectActive(true);
      return;
    }

    form.setFieldsValue({
      name_th: subjectDetail.name_th,
      code: subjectDetail.code,
      student_max: subjectDetail.student_max,
      price: subjectDetail.price,
      level_en: subjectDetail.level_en,
      category_en: subjectDetail.category_en,
      subcategory_en: subjectDetail.subcategory_en,
      total_classrooms: subjectDetail.total_classrooms || 1,
      slot: subjectDetail.slot || 1,
      description: Array.isArray(subjectDetail.description_th)
        ? subjectDetail.description_th.join("\n")
        : "",
    });

    const imageUrl = buildAbsoluteUrl(backendUrl, subjectDetail.image);
    setUploadFileList(
      imageUrl
        ? [
            {
              uid: "existing",
              name: subjectDetail.image
                ? subjectDetail.image.split("/").pop()
                : "course-image",
              status: "done",
              url: imageUrl,
            },
          ]
        : []
    );
    setImageFile(null);
    setCurrentSubjectActive(subjectDetail.isActive !== false);
  }, [selectedCourseId, subjectDetail, form, backendUrl]);

  const handleCourseSelect = (course) => {
    if (!course?.id) return;
    setCurrentSubjectActive(course.isActive !== false);
    setSelectedCourseId(course.id);
  };

  const handleRefreshAfterUpdate = (values) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === selectedCourseId
          ? {
              ...course,
              name_th: values.name_th,
              code: values.code,
              price: values.price,
              student_max: values.student_max,
              total_classrooms: values.total_classrooms,
            }
          : course
      )
    );
  };

  const handleAddCourse = () => {
    resetCreateModalState();
    createForm.setFieldsValue({
      level_en: selectedLevel || undefined,
      student_max: 1,
      total_classrooms: 1,
      slot: 1,
      description: "",
      isActive: true,
    });
    setCreateLevel(selectedLevel || null);
    setIsCreateModalOpen(true);
  };

  const handleCategoryStatusChange = async (checked) => {
    if (!selectedLevel || !selectedCategory) {
      message.warning("กรุณาเลือกกลุ่มวิชาก่อน");
      return;
    }
    const categoryRecord = currentCategory;
    try {
      await updateCategoryStatus({
        level_en: selectedLevel,
        category_en: selectedCategory,
        category_th: categoryRecord?.category_th,
        isActive: checked,
      }).unwrap();

      setCategories((prev) =>
        prev.map((category) =>
          category.category_en === selectedCategory
            ? { ...category, isActive: checked }
            : category
        )
      );
      setSubcategories((prev) =>
        prev.map((sub) => ({
          ...sub,
          isCategoryActive: checked,
        }))
      );
      setCourses((prev) =>
        prev.map((course) => ({
          ...course,
          isCategoryActive: checked,
        }))
      );
      message.success(checked ? "เปิดรับกลุ่มวิชาแล้ว" : "ปิดรับกลุ่มวิชาแล้ว");
    } catch (error) {
      console.error(error);
      message.error("ไม่สามารถอัปเดตสถานะกลุ่มวิชาได้");
    }
  };

  const handleSubcategoryStatusChange = async (checked) => {
    if (!selectedLevel || !selectedCategory || !selectedSubcategory) {
      message.warning("กรุณาเลือกหัวข้อย่อยก่อน");
      return;
    }

    const subcategoryRecord = currentSubcategory;

    try {
      await updateSubcategoryStatus({
        level_en: selectedLevel,
        category_en: selectedCategory,
        subcategory_en: selectedSubcategory,
        subcategory_th: subcategoryRecord?.subcategory_th,
        isActive: checked,
      }).unwrap();

      setSubcategories((prev) =>
        prev.map((sub) =>
          sub.subcategory_en === selectedSubcategory ? { ...sub, isActive: checked } : sub
        )
      );

      setCourses((prev) =>
        prev.map((course) => ({
          ...course,
          isSubcategoryActive: checked,
        }))
      );

      message.success(checked ? "เปิดรับหัวข้อย่อยแล้ว" : "ปิดรับหัวข้อย่อยแล้ว");
    } catch (error) {
      console.error(error);
      message.error("ไม่สามารถอัปเดตสถานะหัวข้อย่อยได้");
    }
  };

  const handleSubjectStatusChange = async (checked) => {
    if (!selectedCourseId) {
      message.warning("กรุณาเลือกรายวิชาก่อน");
      return;
    }

    try {
      await updateSubjectStatus({ id: selectedCourseId, isActive: checked }).unwrap();
      setCurrentSubjectActive(checked);
      setCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourseId ? { ...course, isActive: checked } : course
        )
      );
      if (typeof refetchDetail === "function") {
        try {
          await refetchDetail();
        } catch (refetchError) {
          console.error(refetchError);
        }
      }
      message.success(checked ? "เปิดรับคอร์สแล้ว" : "ปิดรับคอร์สแล้ว");
    } catch (error) {
      console.error(error);
      message.error("ไม่สามารถอัปเดตสถานะคอร์สได้");
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourseId) {
      return;
    }

    try {
      await deleteSubject(selectedCourseId).unwrap();
      message.success("ลบคอร์สเรียบร้อยแล้ว");
      setCourses((prev) => prev.filter((course) => course.id !== selectedCourseId));
      setSelectedCourseId(null);
      setUploadFileList([]);
      setImageFile(null);
      setCurrentSubjectActive(true);
    } catch (error) {
      console.error(error);
      message.error(error?.data?.message || "ไม่สามารถลบคอร์สได้");
    }
  };

  const buildCourseFormData = (
    values,
    levelRecord,
    categoryRecord,
    subcategoryRecord,
    image
  ) => {
    const formDataObj = new FormData();
    const appendField = (key, value) => {
      if (value === undefined || value === null || value === "") return;
      formDataObj.append(key, value);
    };

    appendField("name_th", values.name_th?.trim());
    appendField("code", values.code?.trim());
    appendField("student_max", values.student_max);
    appendField("price", values.price);
    appendField("total_classrooms", values.total_classrooms);
    appendField("level_en", levelRecord.level_en);
    appendField("level_th", levelRecord.level_th);
    appendField("category_en", categoryRecord.category_en);
    appendField("category_th", categoryRecord.category_th);
    appendField("subcategory_en", subcategoryRecord.subcategory_en);
    appendField("subcategory_th", subcategoryRecord.subcategory_th);
    appendField("slot", values.slot || 1);
    appendField("description_th", values.description || "");
    if (typeof values.isActive === "boolean") {
      appendField("isActive", values.isActive);
    }

    if (image) {
      formDataObj.append("imageFile", image);
    }

    return formDataObj;
  };

  const handleSubmit = async (values) => {
    const levelRecord = levelOptions.find((level) => level.level_en === values.level_en);
    const categoryRecord = categories.find((cat) => cat.category_en === values.category_en);
    const subcategoryRecord = subcategories.find(
      (sub) => sub.subcategory_en === values.subcategory_en
    );

    if (!levelRecord || !categoryRecord || !subcategoryRecord) {
      message.error("กรุณาเลือกระดับ กลุ่มวิชา และหัวข้อย่อย");
      return;
    }

    if (!selectedCourseId) {
      message.warning("กรุณาเลือกรายวิชาก่อน");
      return;
    }

    const formDataObj = buildCourseFormData(
      values,
      levelRecord,
      categoryRecord,
      subcategoryRecord,
      imageFile
    );

    try {
      await updateSubject({ id: selectedCourseId, data: formDataObj }).unwrap();
      message.success("บันทึกข้อมูลคอร์สเรียบร้อยแล้ว");
      handleRefreshAfterUpdate(values);
      setImageFile(null);
      if (typeof refetchDetail === "function") {
        await refetchDetail();
      }
    } catch (error) {
      console.error(error);
      message.error(error?.data?.message || "ไม่สามารถบันทึกข้อมูลคอร์สได้");
    }
  };

  const handleCreateCourse = async () => {
    try {
      const values = await createForm.validateFields();

      const levelRecord = levelOptions.find((level) => level.level_en === values.level_en);
      const categoryRecord = createCategories.find(
        (cat) => cat.category_en === values.category_en
      );
      const subcategoryRecord = createSubcategories.find(
        (sub) => sub.subcategory_en === values.subcategory_en
      );

      if (!levelRecord || !categoryRecord || !subcategoryRecord) {
        message.error("กรุณาเลือกระดับ กลุ่มวิชา และหัวข้อย่อย");
        return;
      }

      const formDataObj = buildCourseFormData(
        values,
        levelRecord,
        categoryRecord,
        subcategoryRecord,
        createImageFile
      );

      const created = await createSubject(formDataObj).unwrap();
      message.success("สร้างคอร์สใหม่เรียบร้อยแล้ว");

      const matchesCurrentFilter =
        selectedLevel === values.level_en &&
        selectedCategory === values.category_en &&
        selectedSubcategory === values.subcategory_en;

      if (matchesCurrentFilter) {
        try {
          const refreshed = await fetchCourses({
            level: values.level_en,
            category: values.category_en,
            subcategory: values.subcategory_en,
          }).unwrap();
          const normalized = normalizeCourses(refreshed ?? []);
          setCourses(normalized);
          const newId = created?.id || created?._id || created?.code;
          if (newId) {
            setSelectedCourseId(newId);
          }
        } catch (refreshError) {
          console.error(refreshError);
          message.error("สร้างสำเร็จ แต่วิชาใหม่ไม่สามารถแสดงในรายการได้");
        }
      }

      handleCreateModalClose();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
      message.error(error?.data?.message || "ไม่สามารถสร้างคอร์สใหม่ได้");
    }
  };

  const handleUploadBefore = (file) => {
    if (uploadFileList.length && uploadFileList[0].url && uploadFileList[0].url.startsWith("blob:")) {
      URL.revokeObjectURL(uploadFileList[0].url);
    }
    const preview = URL.createObjectURL(file);
    setUploadFileList([
      {
        uid: file.uid,
        name: file.name,
        status: "done",
        url: preview,
      },
    ]);
    setImageFile(file);
    return false;
  };

  const handleUploadRemove = (file) => {
    if (file?.url && file.url.startsWith("blob:")) {
      URL.revokeObjectURL(file.url);
    }
    setUploadFileList([]);
    setImageFile(null);
  };

  const handleCreateUploadBefore = (file) => {
    if (
      createUploadFileList.length &&
      createUploadFileList[0].url &&
      createUploadFileList[0].url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(createUploadFileList[0].url);
    }
    const preview = URL.createObjectURL(file);
    setCreateUploadFileList([
      {
        uid: file.uid,
        name: file.name,
        status: "done",
        url: preview,
      },
    ]);
    setCreateImageFile(file);
    return false;
  };

  const handleCreateUploadRemove = (file) => {
    if (file?.url && file.url.startsWith("blob:")) {
      URL.revokeObjectURL(file.url);
    }
    setCreateUploadFileList([]);
    setCreateImageFile(null);
  };

  const levelOptionsSorted = useMemo(() => levelOptions ?? [], [levelOptions]);

  const categoryActive = currentCategory ? currentCategory.isActive !== false : true;
  const subcategoryOwnActive = currentSubcategory ? currentSubcategory.isActive !== false : true;
  const subcategoryCategoryActive = currentSubcategory
    ? currentSubcategory.isCategoryActive !== false
    : true;
  const effectiveSubcategoryActive = selectedSubcategory
    ? subcategoryOwnActive && subcategoryCategoryActive && categoryActive
    : true;
  const effectiveCourseActive =
    currentSubjectActive && categoryActive && effectiveSubcategoryActive;

  let courseStatusMessage = "เปิดรับ";
  let courseStatusTone = effectiveCourseActive ? "success" : "danger";
  if (!categoryActive) {
    courseStatusMessage = "ปิดรับ (กลุ่มวิชา)";
    courseStatusTone = "danger";
  } else if (!effectiveSubcategoryActive) {
    courseStatusMessage = subcategoryOwnActive
      ? "ปิดรับตามกลุ่มวิชา"
      : "ปิดรับ (หัวข้อย่อย)";
    courseStatusTone = "danger";
  } else if (!currentSubjectActive) {
    courseStatusMessage = "ปิดรับ (คอร์ส)";
    courseStatusTone = "danger";
  }

  const categoryStatusText = categoryActive ? "เปิดรับ" : "ปิดรับ";
  const categoryStatusTone = categoryActive ? "success" : "danger";
  const subcategoryToggleText = subcategoryOwnActive ? "เปิดรับ" : "ปิดรับ";
  const subcategoryToggleTone = subcategoryOwnActive ? "success" : "danger";
  const subcategoryEffectiveMessage = selectedSubcategory
    ? effectiveSubcategoryActive
      ? "พร้อมสำหรับการจอง"
      : subcategoryOwnActive
      ? "ปิดรับตามกลุ่มวิชา"
      : "ปิดรับ (หัวข้อย่อย)"
    : "";
  const subcategoryEffectiveTone = effectiveSubcategoryActive ? "secondary" : "danger";

  return (
    <div style={{ padding: 16 }}>
      <Title level={3} style={{ marginBottom: 12 }}>
        <Space align="center">
          <AppstoreOutlined />
          <span>จัดการคอร์ส</span>
        </Space>
      </Title>
      <Text type="secondary">
        เลือกระดับการเรียน กลุ่มวิชา และหัวข้อย่อยเพื่อค้นหาและจัดการรายละเอียดคอร์ส
      </Text>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={9}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card
              title="ตัวกรอง"
              bordered
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddCourse}
                  disabled={isCreateModalOpen || isCreatingSubject}
                >
                  เพิ่มคอร์สใหม่
                </Button>
              }
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Text strong>เลือกระดับการเรียน</Text>
                  <Select
                    placeholder="เลือกระดับ"
                    value={selectedLevel}
                    loading={isLevelsLoading}
                    onChange={(value) => setSelectedLevel(value)}
                    style={{ width: "100%", marginTop: 4 }}
                    allowClear
                  >
                    {levelOptionsSorted.map((level) => (
                      <Option key={level.level_en} value={level.level_en}>
                        {level.level_th}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Text strong>เลือกกลุ่มวิชา</Text>
                  <Select
                    placeholder="เลือกกลุ่มวิชา"
                    value={selectedCategory}
                    onChange={(value) => setSelectedCategory(value)}
                    style={{ width: "100%", marginTop: 4 }}
                    allowClear
                    disabled={!selectedLevel || loadingHierarchy}
                  >
                    {categories.map((cat) => (
                      <Option key={cat.category_en} value={cat.category_en}>
                        <Space size={6}>
                          <span>{cat.category_th}</span>
                          {cat.isActive === false && <Tag color="red">ปิดรับ</Tag>}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                  {selectedCategory ? (
                    <div style={{ marginTop: 8 }}>
                      <Space>
                        <Switch
                          checked={categoryActive}
                          onChange={handleCategoryStatusChange}
                          disabled={isUpdatingCategoryStatus}
                          loading={isUpdatingCategoryStatus}
                          checkedChildren="เปิดรับ"
                          unCheckedChildren="ปิดรับ"
                        />
                        <Text type={categoryStatusTone}>{categoryStatusText}</Text>
                      </Space>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Text strong>เลือกหัวข้อย่อย</Text>
                  <Select
                    placeholder="เลือกหัวข้อย่อย"
                    value={selectedSubcategory}
                    onChange={(value) => setSelectedSubcategory(value)}
                    style={{ width: "100%", marginTop: 4 }}
                    allowClear
                    disabled={!selectedCategory || loadingHierarchy}
                  >
                    {subcategories.map((sub) => {
                      const subEffectiveActive =
                        (sub.isActive !== false) &&
                        (sub.isCategoryActive !== false) &&
                        categoryActive;
                      return (
                        <Option key={sub.subcategory_en} value={sub.subcategory_en}>
                          <Space size={6}>
                            <span>{sub.subcategory_th}</span>
                            {subEffectiveActive ? null : <Tag color="red">ปิดรับ</Tag>}
                          </Space>
                        </Option>
                      );
                    })}
                  </Select>
                  {selectedSubcategory ? (
                    <div style={{ marginTop: 8 }}>
                      <Space align="start" direction="vertical" size={4}>
                        <Space>
                          <Switch
                            checked={subcategoryOwnActive}
                            onChange={handleSubcategoryStatusChange}
                            disabled={isUpdatingSubcategoryStatus}
                            loading={isUpdatingSubcategoryStatus}
                            checkedChildren="เปิดรับ"
                            unCheckedChildren="ปิดรับ"
                          />
                          <Text type={subcategoryToggleTone}>{subcategoryToggleText}</Text>
                        </Space>
                        {subcategoryEffectiveMessage ? (
                          <Text type={subcategoryEffectiveTone}>
                            {subcategoryEffectiveMessage}
                          </Text>
                        ) : null}
                      </Space>
                    </div>
                  ) : null}
                </div>
              </Space>
            </Card>

            <Card
              title={
                <Space align="center">
                  <BookOutlined />
                  <span>รายวิชา</span>
                </Space>
              }
              bordered
              bodyStyle={{ padding: 0 }}
            >
              {loadingCourses ? (
                <div style={{ padding: 16 }}>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </div>
              ) : courses.length === 0 ? (
                <Empty description="ไม่มีรายวิชาในหมวดนี้" style={{ margin: "32px 0" }} />
              ) : (
                <List
                  dataSource={courses}
                  renderItem={(item) => {
                    const isSelected = item.id === selectedCourseId;
                    const isCourseAvailable =
                      (item.isActive !== false) &&
                      (item.isCategoryActive !== false) &&
                      (item.isSubcategoryActive !== false);
                    return (
                      <List.Item
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#eef2ff" : "transparent",
                          opacity: isCourseAvailable ? 1 : 0.7,
                        }}
                        onClick={() => handleCourseSelect(item)}
                      >
                        <Space direction="vertical" size={2} style={{ width: "100%" }}>
                          <Space align="center">
                            <Tag color={isSelected ? "purple" : "blue"}>{item.code}</Tag>
                            <Text strong>{item.name_th}</Text>
                            {isCourseAvailable ? null : <Tag color="red">ปิดรับ</Tag>}
                          </Space>
                          <Space size={12} wrap>
                            {item.price !== null && item.price !== undefined && (
                              <Tag color="volcano">ราคา {Number(item.price).toLocaleString()} บาท</Tag>
                            )}
                            <Tag color="geekblue">รับได้ {item.student_max} คน</Tag>
                            <Tag color="gold">ห้อง {item.total_classrooms || 1}</Tag>
                          </Space>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={15}>
          <Card
            title="รายละเอียดคอร์ส"
            bordered
            extra={selectedCourseId ? <Tag color="green">แก้ไขคอร์ส</Tag> : null}
            bodyStyle={{ minHeight: 360 }}
          >
            {!selectedCourseId ? (
              <Empty description="เลือกคอร์สจากรายการด้านซ้ายเพื่อแก้ไขหรือเพิ่มใหม่" />
            ) : isDetailLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ price: undefined, student_max: 1, total_classrooms: 1, slot: 1 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="ระดับการเรียน"
                      name="level_en"
                      rules={[{ required: true, message: "กรุณาเลือกระดับ" }]}
                    >
                      <Select placeholder="เลือกระดับ" disabled>
                        {levelOptionsSorted.map((level) => (
                          <Option key={level.level_en} value={level.level_en}>
                            {level.level_th}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="กลุ่มวิชา"
                      name="category_en"
                      rules={[{ required: true, message: "กรุณาเลือกกลุ่มวิชา" }]}
                    >
                      <Select placeholder="เลือกกลุ่มวิชา" disabled>
                        {categories.map((cat) => (
                          <Option key={cat.category_en} value={cat.category_en}>
                            {cat.category_th}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="หัวข้อย่อย"
                      name="subcategory_en"
                      rules={[{ required: true, message: "กรุณาเลือกหัวข้อย่อย" }]}
                    >
                      <Select placeholder="เลือกหัวข้อย่อย" disabled>
                        {subcategories.map((sub) => (
                          <Option key={sub.subcategory_en} value={sub.subcategory_en}>
                            {sub.subcategory_th}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="สถานะคอร์ส">
                  <Space>
                    <Switch
                      checked={currentSubjectActive}
                      onChange={handleSubjectStatusChange}
                      disabled={!selectedCourseId || isUpdatingSubjectStatus}
                      loading={isUpdatingSubjectStatus}
                      checkedChildren="เปิดรับ"
                      unCheckedChildren="ปิดรับ"
                    />
                    <Text type={courseStatusTone}>{courseStatusMessage}</Text>
                  </Space>
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="ชื่อคอร์ส"
                      name="name_th"
                      rules={[{ required: true, message: "กรุณากรอกชื่อคอร์ส" }]}
                    >
                      <Input placeholder="ชื่อคอร์สภาษาไทย" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="รหัสคอร์ส"
                      name="code"
                      rules={[{ required: true, message: "กรุณากรอกรหัสคอร์ส" }]}
                    >
                      <Input placeholder="ตัวอย่าง: SCI-001" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="ราคาคอร์ส (บาท)"
                      name="price"
                      rules={[{ required: true, message: "กรุณากรอกราคา" }]}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="เช่น 1500" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="จำนวนผู้เข้าร่วมสูงสุด"
                      name="student_max"
                      rules={[{ required: true, message: "กรุณากรอกจำนวนผู้เข้าร่วมสูงสุด" }]}
                    >
                      <InputNumber min={1} max={300} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="จำนวนห้อง"
                      name="total_classrooms"
                      rules={[{ required: true, message: "กรุณากรอกจำนวนห้อง" }]}
                    >
                      <InputNumber min={1} max={20} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="เวลาต่อคอร์ส (slot)" name="slot">
                      <InputNumber min={1} max={10} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="รูปภาพคอร์ส">
                  <Upload
                    accept="image/*"
                    fileList={uploadFileList}
                    beforeUpload={handleUploadBefore}
                    onRemove={handleUploadRemove}
                    listType="picture"
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />}>อัปโหลดรูปภาพ</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  label="รายละเอียดคอร์ส (บรรทัดละหนึ่ง bullet)"
                  name="description"
                >
                  <Input.TextArea rows={6} placeholder="ใส่รายละเอียดแต่ละบรรทัด" allowClear />
                </Form.Item>

                <Divider />

                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => form.submit()}
                    loading={isUpdating}
                  >
                    บันทึกการเปลี่ยนแปลง
                  </Button>
                  <Button
                    onClick={() => form.resetFields()}
                    disabled={isUpdating}
                  >
                    รีเซ็ต
                  </Button>
                  {selectedCourseId ? (
                    <Popconfirm
                      title="ยืนยันการลบคอร์ส"
                      description="คุณต้องการลบคอร์สนี้หรือไม่?"
                      okText="ลบ"
                      cancelText="ยกเลิก"
                      okButtonProps={{ danger: true, loading: isDeletingSubject }}
                      onConfirm={handleDeleteCourse}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={isDeletingSubject}
                        disabled={isUpdating || isDeletingSubject}
                      >
                        ลบคอร์ส
                      </Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              </Form>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        open={isCreateModalOpen}
        title="เพิ่มคอร์สใหม่"
        onCancel={handleCreateModalClose}
        footer={null}
        destroyOnClose={false}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateCourse}
          initialValues={{ student_max: 1, total_classrooms: 1, slot: 1, isActive: true }}
        >
          <Form.Item
            label="สถานะคอร์ส"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="เปิดรับ" unCheckedChildren="ปิดรับ" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="ระดับการเรียน"
                name="level_en"
                rules={[{ required: true, message: "กรุณาเลือกระดับ" }]}
              >
                <Select
                  placeholder="เลือกระดับ"
                  loading={isLevelsLoading}
                  onChange={(value) => setCreateLevel(value || null)}
                  allowClear
                >
                  {levelOptionsSorted.map((level) => (
                    <Option key={level.level_en} value={level.level_en}>
                      {level.level_th}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="กลุ่มวิชา"
                name="category_en"
                rules={[{ required: true, message: "กรุณาเลือกกลุ่มวิชา" }]}
              >
                <Select
                  placeholder="เลือกกลุ่มวิชา"
                  disabled={!createLevel}
                  loading={isCreateCategoriesLoading}
                  onChange={(value) => setCreateCategory(value || null)}
                  allowClear
                >
                  {createCategories.map((cat) => (
                    <Option key={cat.category_en} value={cat.category_en}>
                      {cat.category_th}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="หัวข้อย่อย"
                name="subcategory_en"
                rules={[{ required: true, message: "กรุณาเลือกหัวข้อย่อย" }]}
              >
                <Select
                  placeholder="เลือกหัวข้อย่อย"
                  disabled={!createCategory}
                  loading={isCreateSubcategoriesLoading}
                  allowClear
                >
                  {createSubcategories.map((sub) => (
                    <Option key={sub.subcategory_en} value={sub.subcategory_en}>
                      {sub.subcategory_th}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="ชื่อคอร์ส"
                name="name_th"
                rules={[{ required: true, message: "กรุณากรอกชื่อคอร์ส" }]}
              >
                <Input placeholder="ชื่อคอร์สภาษาไทย" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="รหัสคอร์ส"
                name="code"
                rules={[{ required: true, message: "กรุณากรอกรหัสคอร์ส" }]}
              >
                <Input placeholder="ตัวอย่าง: SCI-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="ราคาคอร์ส (บาท)"
                name="price"
                rules={[{ required: true, message: "กรุณากรอกราคา" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="เช่น 1500" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="จำนวนผู้เข้าร่วมสูงสุด"
                name="student_max"
                rules={[{ required: true, message: "กรุณากรอกจำนวนผู้เข้าร่วมสูงสุด" }]}
              >
                <InputNumber min={1} max={300} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="จำนวนห้อง"
                name="total_classrooms"
                rules={[{ required: true, message: "กรุณากรอกจำนวนห้อง" }]}
              >
                <InputNumber min={1} max={20} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="เวลาต่อคอร์ส (slot)" name="slot">
                <InputNumber min={1} max={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="รูปภาพคอร์ส">
            <Upload
              accept="image/*"
              fileList={createUploadFileList}
              beforeUpload={handleCreateUploadBefore}
              onRemove={handleCreateUploadRemove}
              listType="picture"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>อัปโหลดรูปภาพ</Button>
            </Upload>
          </Form.Item>

          <Form.Item label="รายละเอียดคอร์ส (บรรทัดละหนึ่ง bullet)" name="description">
            <Input.TextArea rows={6} placeholder="ใส่รายละเอียดแต่ละบรรทัด" allowClear />
          </Form.Item>

          <Divider />

          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={isCreatingSubject}
            >
              สร้างคอร์ส
            </Button>
            <Button onClick={handleCreateModalClose} disabled={isCreatingSubject}>
              ยกเลิก
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseManagement;
