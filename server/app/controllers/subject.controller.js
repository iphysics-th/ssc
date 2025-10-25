const db = require("../models");
const Subject = db.subject; // Assuming your subject model is named 'subject' in db
const Reservation = db.reservation;
const CategoryStatus = db.categoryStatus;
const SubcategoryStatus = db.subcategoryStatus;

const parseBoolean = (value) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(normalized)) {
            return true;
        }
        if (["false", "0", "no", "off"].includes(normalized)) {
            return false;
        }
    }
    return undefined;
};


exports.findAllLevels = async (req, res) => {
    try {
        const levels = await Subject.aggregate([
            {
                $group: {
                    _id: "$level_en",
                    level_th: { $first: "$level_th" }
                }
            },
            {
                $project: {
                    _id: 0,
                    level_en: "$_id",
                    level_th: 1
                }
            }
        ]);

        // Predefined order
        const order = ["elementary", "medium", "high", "general"];

        // Separate the levels into ordered and others
        const orderedLevels = [];
        const otherLevels = [];

        levels.forEach(level => {
            const index = order.indexOf(level.level_en);
            if (index !== -1) {
                orderedLevels[index] = level; // Place in the correct order position
            } else {
                otherLevels.push(level); // Collect additional levels
            }
        });

        // Concatenate the ordered levels with any additional levels
        const finalLevels = orderedLevels.concat(otherLevels.filter(l => l)); // Filter to remove any undefined entries from orderedLevels

        res.status(200).send(finalLevels);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving levels." });
    }
};


// 1. Show all "category_en" where "level_en" is "high"
exports.findLevel = async (req, res) => {
    const level = req.params.level;
    try {
        // Fetch categories with their English and Thai names
        const subjects = await Subject.find({ level_en: level }, 'category_en category_th');
        const categoryStatuses = await CategoryStatus.find({ level_en: level }).lean();
        const categoryStatusMap = categoryStatuses.reduce((acc, item) => {
            acc[item.category_en] = item.isActive !== false;
            return acc;
        }, {});

        // Reduce the fetched subjects to a unique set of categories with both English and Thai names
        const categoriesMap = subjects.reduce((acc, subject) => {
            const { category_en, category_th } = subject;
            acc[category_en] = category_th; // Map English category to Thai
            return acc;
        }, {});

        // Predefined order of categories in English
        const order = ["Physics", "Chemistry", "Biology", "Mathematics", "Computer and Information Technology", "Applied Science and Innovation", "Environmental Science", "Home Economics", "Health Science"];

        // Sort and prepare the response according to the predefined order and include both English and Thai names
        const orderedCategories = order.reduce((acc, category) => {
            if (categoriesMap[category]) {
                acc.push({ category_en: category, category_th: categoriesMap[category] });
            }
            return acc;
        }, []);

        // Include any additional categories not predefined in the order
        Object.keys(categoriesMap).forEach((category) => {
            if (!order.includes(category)) {
                orderedCategories.push({
                    category_en: category,
                    category_th: categoriesMap[category],
                    isActive: categoryStatusMap[category] ?? true,
                });
            }
        });

        const response = orderedCategories.map((category, index) => {
            if (category.isActive === undefined) {
                return {
                    ...category,
                    isActive: categoryStatusMap[category.category_en] ?? true,
                };
            }

            return category;
        });

        res.status(200).send(response);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving subjects." });
    }
};


// 2. Show all "subcategory_en" within a chosen "category_en"
exports.findSubcategoriesByCategory = async (req, res) => {
    const { level, category } = req.params; // Capture the level and category from the URL parameters

    try {
        const [subcategoryStatusDocs, categoryStatusDoc, subcategories] = await Promise.all([
            SubcategoryStatus.find({ level_en: level, category_en: category }).lean(),
            CategoryStatus.findOne({ level_en: level, category_en: category }).lean(),
            Subject.aggregate([
                {
                    $match: {
                        level_en: level,
                        category_en: category,
                    },
                },
                {
                    $group: {
                        _id: "$subcategory_en",
                        subcategory_th: { $first: "$subcategory_th" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        subcategory_en: "$_id",
                        subcategory_th: 1,
                    },
                },
                { $sort: { subcategory_en: 1 } },
            ]),
        ]);

        const subcategoryStatusMap = subcategoryStatusDocs.reduce((acc, item) => {
            acc[item.subcategory_en] = item.isActive !== false;
            return acc;
        }, {});

        const isCategoryActive = categoryStatusDoc ? categoryStatusDoc.isActive !== false : true;

        const response = subcategories.map((sub) => ({
            ...sub,
            isActive: subcategoryStatusMap[sub.subcategory_en] ?? true,
            isCategoryActive,
        }));

        res.status(200).send(response);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving subcategories." });
    }
};


// 3. Show all "code" within a chosen "category_en"
exports.findCodesByCategory = async (req, res) => {
    const { level, category, subcategory } = req.params;

    try {
        const [subjects, categoryStatusDoc, subcategoryStatusDoc] = await Promise.all([
            Subject.find(
                {
                    level_en: level,
                    category_en: category,
                    subcategory_en: subcategory,
                },
                "code name_th student_max price image description_th level_en level_th category_en category_th subcategory_en subcategory_th total_classrooms slot isActive"
            )
                .sort("code")
                .lean(),
            CategoryStatus.findOne({ level_en: level, category_en: category }).lean(),
            SubcategoryStatus.findOne({
                level_en: level,
                category_en: category,
                subcategory_en: subcategory,
            }).lean(),
        ]);

        const isCategoryActive = categoryStatusDoc ? categoryStatusDoc.isActive !== false : true;
        const isSubcategoryActive = subcategoryStatusDoc ? subcategoryStatusDoc.isActive !== false : true;

        const subjectCodes = subjects
            .map((subject) => subject.code)
            .filter((code) => typeof code === "string" && code.trim().length);
        const subjectCodeSet = new Set(subjectCodes);

        const reservedBySubject = {};

        if (subjectCodes.length > 0) {
            const reservations = await Reservation.find(
                {
                    confirmation: { $in: ["processed", "confirmed"] },
                    $or: [
                        { "classSubjects.slots.code": { $in: subjectCodes } },
                        { "classSubjects.slots.subject.code": { $in: subjectCodes } },
                        { "slotSelections.code": { $in: subjectCodes } },
                        { "slotSelections.subject.code": { $in: subjectCodes } },
                    ],
                },
                "classSubjects slotSelections"
            ).lean();

            const formatDateKey = (value) => {
                if (!value) return null;
                const dateObj = new Date(value);
                if (Number.isNaN(dateObj.getTime())) return null;
                return dateObj.toISOString().slice(0, 10);
            };

            const recordUsage = (slot) => {
                if (!slot) return;
                const code =
                    slot.code ||
                    (slot.subject && slot.subject.code) ||
                    null;
                if (!code || !subjectCodeSet.has(code)) return;

                const dateKey = formatDateKey(slot.date);
                if (!dateKey) return;

                const slotLabel =
                    slot.slot ||
                    slot.time ||
                    (Number.isFinite(Number(slot.slotIndex))
                        ? `slot-${Number(slot.slotIndex)}`
                        : null);
                if (!slotLabel) return;

                if (!reservedBySubject[code]) reservedBySubject[code] = {};
                if (!reservedBySubject[code][dateKey])
                    reservedBySubject[code][dateKey] = {};

                reservedBySubject[code][dateKey][slotLabel] =
                    (reservedBySubject[code][dateKey][slotLabel] || 0) + 1;
            };

            reservations.forEach((reservation) => {
                (reservation.classSubjects || []).forEach((classEntry) => {
                    (classEntry?.slots || []).forEach(recordUsage);
                });
                (reservation.slotSelections || []).forEach(recordUsage);
            });
        }

        const responseData = subjects.map((subject) => {
            const isSubjectActive = subject.isActive !== false;
            const reservedSlots =
                reservedBySubject[subject.code] && subject.code
                    ? reservedBySubject[subject.code]
                    : {};
            return {
                id: subject._id,
                code: subject.code,
                name_th: subject.name_th,
                student_max: subject.student_max,
                price: subject.price,
                image: subject.image,
                description_th: subject.description_th,
                level_en: subject.level_en,
                level_th: subject.level_th,
                category_en: subject.category_en,
                category_th: subject.category_th,
                subcategory_en: subject.subcategory_en,
                subcategory_th: subject.subcategory_th,
                total_classrooms: subject.total_classrooms,
                slot: subject.slot,
                isActive: isSubjectActive,
                isCategoryActive,
                isSubcategoryActive,
                reservedSlots,
            };
        });

        res.status(200).send(responseData);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving subjects." });
    }
};

exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to retrieve subject" });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name_th,
            code,
            student_max,
            description_th,
            price,
            image,
            level_en,
            level_th,
            category_en,
            category_th,
            subcategory_en,
            subcategory_th,
            total_classrooms,
        } = req.body;

        const updatePayload = {};

        if (name_th !== undefined) updatePayload.name_th = name_th;
        if (code !== undefined) updatePayload.code = code;
        if (student_max !== undefined) updatePayload.student_max = Number(student_max);
        if (level_en !== undefined) updatePayload.level_en = level_en;
        if (level_th !== undefined) updatePayload.level_th = level_th;
        if (category_en !== undefined) updatePayload.category_en = category_en;
        if (category_th !== undefined) updatePayload.category_th = category_th;
        if (subcategory_en !== undefined) updatePayload.subcategory_en = subcategory_en;
        if (subcategory_th !== undefined) updatePayload.subcategory_th = subcategory_th;
        if (total_classrooms !== undefined) {
            const parsedTotal = Number(total_classrooms);
            if (!Number.isNaN(parsedTotal)) {
                updatePayload.total_classrooms = parsedTotal;
            }
        }
        if (price !== undefined) {
            const parsedPrice = price === '' ? null : Number(price);
            if (parsedPrice === null || !Number.isNaN(parsedPrice)) {
                updatePayload.price = parsedPrice;
            }
        }
        if (req.body.slot !== undefined) {
            const parsedSlot = Number(req.body.slot);
            if (!Number.isNaN(parsedSlot)) {
                updatePayload.slot = parsedSlot;
            }
        }
        if (req.body.isActive !== undefined) {
            const parsedActive = parseBoolean(req.body.isActive);
            if (parsedActive !== undefined) {
                updatePayload.isActive = parsedActive;
            }
        }
        if (image !== undefined && image !== '') updatePayload.image = image;
        if (req.file) {
            updatePayload.image = `/course-images/${req.file.filename}`;
        }
        if (description_th !== undefined) {
            if (Array.isArray(description_th)) {
                updatePayload.description_th = description_th;
            } else if (typeof description_th === "string") {
                updatePayload.description_th = description_th
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean);
            }
        }

        const updatedSubject = await Subject.findByIdAndUpdate(id, updatePayload, {
            new: true,
            runValidators: true,
        });

        if (!updatedSubject) {
            return res.status(404).json({ message: "Subject not found" });
        }

        res.json(updatedSubject);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update subject" });
    }
};

exports.createSubject = async (req, res) => {
    try {
        const {
            name_th,
            code,
            student_max,
            level_en,
            level_th,
            category_en,
            category_th,
            subcategory_en,
            subcategory_th,
            description_th,
            price,
            slot,
            total_classrooms,
            isActive,
        } = req.body;

        const parsedStudentMax = Number(student_max);
        const parsedPrice = Number(price);
        const parsedTotalClassrooms = Number(total_classrooms || 1);

        if (!name_th || !code || !level_en || !category_en || !subcategory_en ||
            Number.isNaN(parsedStudentMax) || parsedStudentMax <= 0 ||
            Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลคอร์สให้ครบถ้วน" });
        }

        const existing = await Subject.findOne({ code });
        if (existing) {
            return res.status(400).json({ message: "มีรหัสคอร์สนี้อยู่แล้ว" });
        }

        let descriptionArray = [];
        if (Array.isArray(description_th)) {
            descriptionArray = description_th;
        } else if (typeof description_th === "string") {
            descriptionArray = description_th
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);
        }

        const payload = {
            name_th,
            code,
            level_en,
            level_th: level_th || level_en,
            category_en,
            category_th: category_th || category_en,
            subcategory_en,
            subcategory_th: subcategory_th || subcategory_en,
            student_max: parsedStudentMax,
            price: price === '' ? null : parsedPrice,
            slot: Number(slot || 1),
            total_classrooms: Number.isNaN(parsedTotalClassrooms) || parsedTotalClassrooms <= 0 ? 1 : parsedTotalClassrooms,
            description_th: descriptionArray.length ? descriptionArray : [""],
        };

        const parsedIsActive = parseBoolean(isActive);
        if (parsedIsActive !== undefined) {
            payload.isActive = parsedIsActive;
        }

        if (req.file) {
            payload.image = `/course-images/${req.file.filename}`;
        }

        const subject = new Subject(payload);
        await subject.save();

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to create subject" });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Subject.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.status(200).json({ message: "Subject deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to delete subject" });
    }
};

exports.updateSubjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedActive = parseBoolean(req.body.isActive);
        if (parsedActive === undefined) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const updated = await Subject.findByIdAndUpdate(
            id,
            { isActive: parsedActive },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Subject not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update subject status" });
    }
};

exports.updateCategoryStatus = async (req, res) => {
    try {
        const { level_en, category_en, category_th, isActive } = req.body;
        const parsedActive = parseBoolean(isActive);

        if (!level_en || !category_en || parsedActive === undefined) {
            return res.status(400).json({ message: "Invalid category status payload" });
        }

        const update = {
            level_en,
            category_en,
            isActive: parsedActive,
        };

        if (category_th !== undefined) {
            update.category_th = category_th;
        }

        const result = await CategoryStatus.findOneAndUpdate(
            { level_en, category_en },
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update category status" });
    }
};

exports.updateSubcategoryStatus = async (req, res) => {
    try {
        const { level_en, category_en, subcategory_en, subcategory_th, isActive } = req.body;
        const parsedActive = parseBoolean(isActive);

        if (!level_en || !category_en || !subcategory_en || parsedActive === undefined) {
            return res.status(400).json({ message: "Invalid subcategory status payload" });
        }

        const update = {
            level_en,
            category_en,
            subcategory_en,
            isActive: parsedActive,
        };

        if (subcategory_th !== undefined) {
            update.subcategory_th = subcategory_th;
        }

        const result = await SubcategoryStatus.findOneAndUpdate(
            { level_en, category_en, subcategory_en },
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to update subcategory status" });
    }
};
