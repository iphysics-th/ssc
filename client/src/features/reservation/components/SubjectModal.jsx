import React, { useEffect, useState } from 'react';
import { Modal, Button, Select } from 'antd';
import {
  useGetSubjectLevelsQuery,
  useLazyGetSubjectsByCategoryQuery,
  useLazyGetSubjectsByLevelQuery,
  useLazyGetSubjectsBySubcategoryQuery,
} from '../reservationApiSlice';

const SubjectSelectionModal = ({
  isModalVisible,
  handleCancel,
  onSubjectSelected,
  numberOfStudents,
  initialSelection = null,
}) => {
  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

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
      setLevels([]);
      setCategories([]);
      setSubcategories([]);
      setSubjects([]);
      setSelectedLevel(null);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedSubject(null);
    }
  }, [isModalVisible, levelOptions]);

  useEffect(() => {
    if (!isModalVisible) {
      return;
    }

    let isActive = true;

    const bootstrapSelection = async () => {
      if (!initialSelection) {
        return;
      }

      const { level, category, subcategory, subject } = initialSelection;

      if (!level) {
        return;
      }

      try {
        setSelectedLevel(level);
        const levelCategories = await fetchCategories(level).unwrap();
        if (!isActive) return;
        setCategories(levelCategories ?? []);

        if (!category) {
          return;
        }

        setSelectedCategory(category);
        const categorySubcategories = await fetchSubcategories({
          level,
          category,
        }).unwrap();
        if (!isActive) return;
        setSubcategories(categorySubcategories ?? []);

        if (!subcategory) {
          return;
        }

        setSelectedSubcategory(subcategory);
        const subcategorySubjects = await fetchSubjects({
          level,
          category,
          subcategory,
        }).unwrap();
        if (!isActive) return;
        setSubjects(subcategorySubjects ?? []);
        if (subject?.code) {
          setSelectedSubject(subject.code);
        }
      } catch (error) {
        console.error('Failed to prefill subject selection', error);
      }
    };

    bootstrapSelection();

    return () => {
      isActive = false;
    };
  }, [
    isModalVisible,
    initialSelection,
    fetchCategories,
    fetchSubcategories,
    fetchSubjects,
  ]);

  const handleLevelChange = async (value) => {
    setSelectedLevel(value);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedSubject(null);
    setCategories([]);
    setSubcategories([]);
    setSubjects([]);

    if (!value) {
      return;
    }

    try {
      const levelCategories = await fetchCategories(value).unwrap();
      setCategories(levelCategories ?? []);
    } catch (error) {
      console.error(`Error fetching categories for level ${value}:`, error);
    }
  };

  const handleCategoryChange = async (value) => {
    setSelectedCategory(value);
    setSelectedSubcategory(null);
    setSelectedSubject(null);
    setSubcategories([]);
    setSubjects([]);

    if (!value || !selectedLevel) {
      return;
    }

    try {
      const categorySubcategories = await fetchSubcategories({
        level: selectedLevel,
        category: value,
      }).unwrap();
      setSubcategories(categorySubcategories ?? []);
    } catch (error) {
      console.error(`Error fetching subcategories for category ${value}:`, error);
    }
  };

  const handleSubcategoryChange = async (value) => {
    setSelectedSubcategory(value);
    setSelectedSubject(null);
    setSubjects([]);

    if (!value || !selectedLevel || !selectedCategory) {
      return;
    }

    try {
      const subcategorySubjects = await fetchSubjects({
        level: selectedLevel,
        category: selectedCategory,
        subcategory: value,
      }).unwrap();
      setSubjects(subcategorySubjects ?? []);
    } catch (error) {
      console.error(`Error fetching subjects for subcategory ${value}:`, error);
    }
  };

  const handleOk = () => {
    const selected = subjects.find((sub) => sub.code === selectedSubject);
    if (selected) {
      const levelMeta = levels.find((level) => level.level_en === selectedLevel);
      const categoryMeta = categories.find(
        (category) => category.category_en === selectedCategory
      );
      const subcategoryMeta = subcategories.find(
        (subcategory) => subcategory.subcategory_en === selectedSubcategory
      );

      onSubjectSelected({
        subject: selected,
        level: selectedLevel,
        levelLabel: levelMeta ? levelMeta.level_th : null,
        category: selectedCategory,
        categoryLabel: categoryMeta ? categoryMeta.category_th : null,
        subcategory: selectedSubcategory,
        subcategoryLabel: subcategoryMeta ? subcategoryMeta.subcategory_th : null,
      });
    }
    handleCancel();
  };

  const isOkButtonDisabled =
    !selectedLevel || !selectedCategory || !selectedSubcategory || !selectedSubject;

  return (
    <Modal
      title="Select Subject"
      open={isModalVisible}
      onCancel={handleCancel}
      onOk={handleOk}
      footer={[
        <Button key="back" onClick={handleCancel}>
          ยกเลิก
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk} disabled={isOkButtonDisabled}>
          ตกลง
        </Button>,
      ]}
      maskClosable={false}
    >
      <h4>เลือกระดับ</h4>
      <Select
        placeholder="Select Level"
        value={selectedLevel}
        onChange={handleLevelChange}
        style={{ width: '100%', marginBottom: '10px' }}
        allowClear
      >
        {levels.map((level) => (
          <Select.Option key={level.level_en} value={level.level_en}>
            {level.level_th}
          </Select.Option>
        ))}
      </Select>
      <h4>เลือกกลุ่มวิชา</h4>
      {selectedLevel && (
        <Select
          placeholder="Select Category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{ width: '100%', marginBottom: '10px' }}
          allowClear
        >
          {categories.map((category) => (
            <Select.Option key={category.category_en} value={category.category_en}>
              {category.category_th}
            </Select.Option>
          ))}
        </Select>
      )}
      <h4>เลือกสาขาย่อย</h4>
      {selectedCategory && (
        <Select
          placeholder="Select Subcategory"
          value={selectedSubcategory}
          onChange={handleSubcategoryChange}
          style={{ width: '100%', marginBottom: '10px' }}
          allowClear
        >
          {subcategories.map((subcategory) => (
            <Select.Option key={subcategory.subcategory_en} value={subcategory.subcategory_en}>
              {subcategory.subcategory_th}
            </Select.Option>
          ))}
        </Select>
      )}
      <h4>เลือกคอร์ส</h4>
      {selectedSubcategory && (
        <Select
          placeholder="Select Subject"
          value={selectedSubject}
          onChange={setSelectedSubject}
          style={{ width: '100%', marginBottom: '10px' }}
          allowClear
        >
          {subjects.map((subject) => {
            const isTooManyStudents = subject.student_max < numberOfStudents;
            const subjectCode = subject.code?.toLowerCase() || '';
            const isMathSubject = subjectCode.includes('math');
            const isBioSubject = subjectCode.includes('bio1');

            const isDisabled = isTooManyStudents || isMathSubject || isBioSubject;

            return (
              <Select.Option
                key={subject.code}
                value={subject.code}
                disabled={isDisabled}
                style={isDisabled ? { color: 'grey' } : {}}
              >
                {subject.name_th}
                {isTooManyStudents ? ' (จำนวนนักเรียนเกิน)' : ''}
              </Select.Option>
            );
          })}
        </Select>
      )}
    </Modal>
  );
};

export default SubjectSelectionModal;

