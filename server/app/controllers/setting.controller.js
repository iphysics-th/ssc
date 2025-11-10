const db = require("../models");
const Setting = db.setting;

const SECOND_SUBJECT_DISCOUNT_KEY = "second_subject_discount";
const DEFAULT_DISCOUNT_VALUE = Number(process.env.DEFAULT_SECOND_SUBJECT_DISCOUNT) || 4000;

const sanitizeSetting = (doc) => ({
  key: doc.key,
  value: doc.value,
  updatedAt: doc.updatedAt,
});

const ensureDiscountSetting = async () => {
  let setting = await Setting.findOne({ key: SECOND_SUBJECT_DISCOUNT_KEY });
  if (!setting) {
    setting = await Setting.create({
      key: SECOND_SUBJECT_DISCOUNT_KEY,
      value: DEFAULT_DISCOUNT_VALUE,
      description: "Discount amount applied to the second subject selection",
    });
  }
  return setting;
};

exports.getDiscountSetting = async (_req, res) => {
  try {
    const setting = await ensureDiscountSetting();
    res.json(sanitizeSetting(setting));
  } catch (error) {
    console.error("Failed to load discount setting:", error);
    res.status(500).json({ message: "ไม่สามารถโหลดข้อมูลส่วนลดได้" });
  }
};

exports.updateDiscountSetting = async (req, res) => {
  const rawValue = req.body?.value;
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < 0) {
    return res.status(400).json({ message: "กรุณาระบุจำนวนเงินส่วนลดที่ถูกต้อง" });
  }

  try {
    const setting = await Setting.findOneAndUpdate(
      { key: SECOND_SUBJECT_DISCOUNT_KEY },
      {
        value,
        description: "Discount amount applied to the second subject selection",
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(sanitizeSetting(setting));
  } catch (error) {
    console.error("Failed to update discount setting:", error);
    res.status(500).json({ message: "ไม่สามารถบันทึกจำนวนส่วนลดได้" });
  }
};
