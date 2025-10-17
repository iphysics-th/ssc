const db = require("../models");

const Lecturer = db.lecturer;

exports.create = async (req, res) => {
  if (!req.body?.name_th) {
    return res.status(400).send({ message: "เนื้อหาไม่ถูกต้อง กรุณาระบุชื่อภาษาไทย" });
  }

  try {
    const lecturer = new Lecturer({
      name_th: req.body.name_th,
      surname_th: req.body.surname_th,
      position_th: req.body.position_th,
      name_en: req.body.name_en,
      surname_en: req.body.surname_en,
      position_en: req.body.position_en,
      division_en: req.body.division_en,
      division_th: req.body.division_th,
      program: req.body.program,
      image: req.body.image,
      doctoral: req.body.doctoral,
      doctoral_year: req.body.doctoral_year,
      master: req.body.master,
      master_year: req.body.master_year,
      email: req.body.email,
      bachelor: req.body.bachelor,
      bachelor_year: req.body.bachelor_year,
      specialty: req.body.specialty,
      industrial: req.body.industrial,
      paper: req.body.paper,
      grant: req.body.grant,
      patent: req.body.patent,
    });

    const saved = await lecturer.save();
    res.json(saved);
  } catch (error) {
    res.status(500).send({ message: error.message || "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลอาจารย์" });
  }
};

exports.findAll = async (req, res) => {
  const { name_th, division } = req.query;
  const filter = {};

  if (name_th) {
    filter.name_th = { $regex: new RegExp(name_th), $options: "i" };
  }

  if (division) {
    filter.division_en = division;
  }

  try {
    const lecturers = await Lecturer.find(filter);
    res.json(lecturers);
  } catch (error) {
    res.status(500).send({ message: error.message || "เกิดข้อผิดพลาดระหว่างดึงข้อมูลอาจารย์" });
  }
};

exports.findOne = async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) {
      return res.status(404).send({ message: `ไม่พบข้อมูลอาจารย์รหัส ${req.params.id}` });
    }
    res.json(lecturer);
  } catch (error) {
    res.status(500).send({ message: error.message || "เกิดข้อผิดพลาดระหว่างค้นหาอาจารย์" });
  }
};

exports.update = async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: "ไม่พบข้อมูลที่ต้องการอัปเดต" });
  }

  try {
    const updated = await Lecturer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send({ message: `ไม่พบข้อมูลอาจารย์รหัส ${req.params.id}` });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).send({ message: error.message || "เกิดข้อผิดพลาดระหว่างอัปเดตข้อมูลอาจารย์" });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Lecturer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: `ไม่พบข้อมูลอาจารย์รหัส ${req.params.id}` });
    }

    res.json({ message: "ลบข้อมูลอาจารย์เรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).send({ message: error.message || "เกิดข้อผิดพลาดระหว่างลบข้อมูลอาจารย์" });
  }
};

exports.deleteAll = async (_req, res) => {
  try {
    const result = await Lecturer.deleteMany({});
    res.json({ message: `ลบข้อมูลอาจารย์ทั้งหมด ${result.deletedCount} รายการเรียบร้อยแล้ว` });
  } catch (error) {
    res.status(500).send({ message: error.message || "เกิดข้อผิดพลาดระหว่างลบข้อมูลอาจารย์ทั้งหมด" });
  }
};

exports.findSpecific = async (req, res) => {
  try {
    const name_en = req.query.name_en;
    const query = name_en ? { name_en: new RegExp(name_en, 'i') } : {};
    const lecturers = await Lecturer.find(query);
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findDivisions = async (_req, res) => {
  try {
    const divisions = await Lecturer.aggregate([
      {
        $group: {
          _id: "$division_en",
          division_th: { $first: "$division_th" },
          lecturerCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          division_en: "$_id",
          division_th: 1,
          lecturerCount: 1
        }
      }
    ]);
    res.json(divisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findByDivision = async (req, res) => {
  try {
    const divisionData = await Lecturer.find({ division_en: req.params.division_en })
      .select('name_th surname_th name_en division_th bachelor_year position_en doctoral');
    res.json(divisionData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findLecturerProfile = async (req, res) => {
  try {
    const { division_en, name_en } = req.params;
    const lecturerProfile = await Lecturer.findOne({ division_en, name_en })
      .select('name_th surname_th position_en name_en surname_en division_en division_th program image doctoral doctoral_year master master_year bachelor bachelor_year specialty industrial paper grant patent email');

    if (!lecturerProfile) {
      return res.status(404).send('Lecturer not found');
    }
    res.json(lecturerProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
