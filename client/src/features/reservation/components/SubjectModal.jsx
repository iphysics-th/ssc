import React, { useEffect, useState } from 'react';
import { Modal, Button, Select } from 'antd';
import axios from 'axios';

const SubjectSelectionModal = ({
    isModalVisible,
    handleCancel,
    backendUrl,
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

    useEffect(() => {
        if (isModalVisible) {
            const fetchLevels = async () => {
                try {
                    const { data } = await axios.get(`${backendUrl}/api/subject`);
                    setLevels(data);
                } catch (error) {
                    console.error('Error fetching levels:', error);
                }
            };
            fetchLevels();
        } else {
            setLevels([]);
        }
    }, [isModalVisible, backendUrl]);

    useEffect(() => {
        if (selectedLevel) {
            const fetchCategories = async () => {
                try {
                    const { data } = await axios.get(`${backendUrl}/api/subject/${selectedLevel}`);
                    setCategories(data);
                    setSubcategories([]);
                    setSubjects([]);
                } catch (error) {
                    console.error(`Error fetching categories for level ${selectedLevel}:`, error);
                }
            };
            fetchCategories();
        }
    }, [selectedLevel, backendUrl]);

    useEffect(() => {
        if (selectedCategory) {
            const fetchSubcategories = async () => {
                try {
                    const { data } = await axios.get(`${backendUrl}/api/subject/${selectedLevel}/${selectedCategory}`);
                    setSubcategories(data);
                    setSubjects([]);
                } catch (error) {
                    console.error(`Error fetching subcategories for category ${selectedCategory}:`, error);
                }
            };
            fetchSubcategories();
        }
    }, [selectedCategory, selectedLevel, backendUrl]);

    useEffect(() => {
        if (selectedSubcategory) {
            const fetchSubjects = async () => {
                try {
                    const { data } = await axios.get(`${backendUrl}/api/subject/${selectedLevel}/${selectedCategory}/${selectedSubcategory}`);
                    setSubjects(data);
                } catch (error) {
                    console.error(`Error fetching subjects for subcategory ${selectedSubcategory}:`, error);
                }
            };
            fetchSubjects();
        }
    }, [selectedSubcategory, selectedCategory, selectedLevel, backendUrl]);

    const handleLevelChange = (value) => {
        setSelectedLevel(value);
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSelectedSubject(null);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setSelectedSubcategory(null);
        setSelectedSubject(null);
    };

    const handleSubcategoryChange = (value) => {
        setSelectedSubcategory(value);
        setSelectedSubject(null);
    };

    useEffect(() => {
        if (isModalVisible) {
            if (initialSelection) {
                setSelectedLevel(initialSelection.level || null);
                setSelectedCategory(initialSelection.category || null);
                setSelectedSubcategory(initialSelection.subcategory || null);
                setSelectedSubject(initialSelection.subject?.code || null);
            } else {
                setSelectedLevel(null);
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSelectedSubject(null);
            }
        } else {
            setCategories([]);
            setSubcategories([]);
            setSubjects([]);
        }
    }, [isModalVisible, initialSelection]);

    const handleOk = () => {
        const selected = subjects.find(sub => sub.code === selectedSubject);
        if (selected) {
            const levelMeta = levels.find(level => level.level_en === selectedLevel);
            const categoryMeta = categories.find(category => category.category_en === selectedCategory);
            const subcategoryMeta = subcategories.find(subcategory => subcategory.subcategory_en === selectedSubcategory);

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

    const isOkButtonDisabled = !selectedLevel || !selectedCategory || !selectedSubcategory || !selectedSubject;

    return (
        <Modal
            title="Select Subject"
            open={isModalVisible}
            onCancel={handleCancel}
            onOk={handleOk}
            footer={[
                <Button key="back" onClick={handleCancel}>ยกเลิก</Button>,
                <Button key="submit" type="primary" onClick={handleOk} disabled={isOkButtonDisabled}>ตกลง</Button>,
            ]}
            maskClosable={false}
        >
            <h4>เลือกระดับ</h4>
            <Select
                placeholder="Select Level"
                value={selectedLevel}
                onChange={handleLevelChange}
                style={{ width: '100%', marginBottom: '10px' }}
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
                >
                    {subjects.map((subject) => {
                        const isTooManyStudents = subject.student_max < numberOfStudents;
                        const isMathSubject = subject.code.toLowerCase().includes('math');
                        const isBioSubject = subject.code.toLowerCase().includes('bio1');

                        const isDisabled = isTooManyStudents || isMathSubject || isBioSubject;

                        return (
                            <Select.Option
                                key={subject.code}
                                value={subject.code}
                                disabled={isDisabled}
                                style={isDisabled ? { color: 'grey' } : {}}
                            >
                                {subject.name_th}
                                {isTooManyStudents && ' (จำนวนโรงเรียนที่เข้าอบรมเกินจำนวนที่คณะรับได้ในภาคการศึกษา)'}
                                {isMathSubject && ' (ปิดรับวิชาคณิตศาสตร์)'}
                                {isBioSubject && ' (ปิดรับวิชาชีววิทยา)'}
                            </Select.Option>
                        );
                    })}

                </Select>
            )}
        </Modal>
    );
};

export default SubjectSelectionModal;
