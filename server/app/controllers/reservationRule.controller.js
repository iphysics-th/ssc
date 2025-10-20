const dayjs = require("dayjs");
const db = require("../models");
const ReservationRule = db.reservationRule;

const sanitizeRulePayload = (rule) => ({
  id: rule._id,
  type: rule.type,
  weekdays: rule.weekdays || [],
  startDate: rule.startDate,
  endDate: rule.endDate,
  level_en: rule.level_en,
  category_en: rule.category_en,
  subcategory_en: rule.subcategory_en,
  level_th: rule.level_th,
  category_th: rule.category_th,
  subcategory_th: rule.subcategory_th,
  note: rule.note || "",
  createdAt: rule.createdAt,
});


const validateRuleInput = (body) => {
  const { type, weekdays, startDate, endDate, subcategory_en } = body;

  if (!type || !["weekday", "date_range", "subcategory"].includes(type)) {
    return "ประเภทการปิดรับไม่ถูกต้อง";
  }

  if (type === "weekday") {
    if (!Array.isArray(weekdays) || !weekdays.length) {
      return "กรุณาเลือกวันอย่างน้อย 1 วัน";
    }
    const invalidDay = weekdays.some(
      (day) => typeof day !== "number" || day < 0 || day > 6
    );
    if (invalidDay) {
      return "รูปแบบวันไม่ถูกต้อง";
    }
  }

  if (type === "date_range" || type === "subcategory") {
    if (!startDate || !endDate) {
      return "กรุณาระบุช่วงวันที่";
    }
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      return "ช่วงวันที่ไม่ถูกต้อง";
    }
  }

  if (type === "subcategory") {
    if (!subcategory_en) {
      return "กรุณาเลือกหัวข้อย่อย";
    }
  }

  return null;
};

exports.listAdminRules = async (_req, res) => {
  try {
    const rules = await ReservationRule.find().sort({ createdAt: -1 }).lean();
    res.json(rules.map(sanitizeRulePayload));
  } catch (error) {
    console.error("Failed to list reservation rules:", error);
    res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลการปิดรับได้" });
  }
};

exports.createRule = async (req, res) => {
  const errorMessage = validateRuleInput(req.body);
  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  try {
    const payload = {
      type: req.body.type,
      weekdays: req.body.weekdays || [],
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      level_en: req.body.level_en,
      category_en: req.body.category_en,
      subcategory_en: req.body.subcategory_en,
      note: req.body.note || "",
    };

    const created = await ReservationRule.create(payload);
    res.status(201).json(sanitizeRulePayload(created));
  } catch (error) {
    console.error("Failed to create reservation rule:", error);
    res.status(500).json({ message: "ไม่สามารถบันทึกข้อมูลการปิดรับได้" });
  }
};

exports.deleteRule = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "กรุณาระบุไอดีของกฎ" });
  }

  try {
    const deleted = await ReservationRule.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกฎที่ต้องการลบ" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reservation rule:", error);
    res.status(500).json({ message: "ไม่สามารถลบข้อมูลการปิดรับได้" });
  }
};

exports.publicRules = async (_req, res) => {
  try {
    const rules = await ReservationRule.find().sort({ createdAt: -1 }).lean();
    res.json(rules.map(sanitizeRulePayload));
  } catch (error) {
    console.error("Failed to load public reservation rules:", error);
    res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลการปิดรับได้" });
  }
};
