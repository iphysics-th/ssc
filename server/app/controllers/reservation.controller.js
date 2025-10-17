const db = require("../models");

const Reservation = db.reservation;
const Subject = db.subject;
const lineNotifier = require('../../functions/lineNotify');
const generateLineMessage = require('../../functions/generateMessage');
const { appendReservationToSheet } = require('../../utils/googleSheets');
const { sendEmailNotification } = require('../../utils/emailer');

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildCaseInsensitiveCondition = (field, value) => ({
  [field]: { $regex: new RegExp(`^${escapeRegExp(value)}$`, 'i') },
});

const buildEmailRegexCondition = (field, email) => buildCaseInsensitiveCondition(field, email);
const buildUsernameRegexCondition = (field, username) => buildCaseInsensitiveCondition(field, username);

exports.createReservation = async (req, res) => {
  try {
    let reservation = new Reservation(req.body);
    reservation = await reservation.save();

    res.send(reservation);

    const message = generateLineMessage(reservation);
    lineNotifier.notifyLine(message);

    appendReservationToSheet(reservation).catch(err => {
      console.error('Google Sheets append error:', err.message);
    });

    sendEmailNotification(reservation).catch(err => {
      console.error('Email send error:', err.message);
    });
  } catch (error) {
    console.error('Reservation save error:', error);
    res.status(400).send(error);
  }
};

exports.checkReservation = async (req, res) => {
  try {
    const number = req.params.reservationNumber;
    const reservationExists = await Reservation.findOne({ reservationNumber: number });
    res.json({ exists: !!reservationExists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ensureClassSubjectsShape = async (reservationDoc) => {
  const reservation = reservationDoc.toObject();

  if (Array.isArray(reservation.slotSelections)) {
    for (const slot of reservation.slotSelections) {
      if (slot.subject && !slot.code) {
        try {
          const subjectDetails = await Subject.findById(slot.subject);
          if (subjectDetails) {
            slot.code = subjectDetails.code || slot.code;
            slot.name_th = subjectDetails.name_th || slot.name_th;
          }
        } catch (err) {
          console.error('Error fetching subject details:', err);
        }
      }
    }
  }

  if (!Array.isArray(reservation.classSubjects) || reservation.classSubjects.length === 0) {
    reservation.classSubjects = (reservation.slotSelections || []).map((slot, index) => ({
      classNumber: slot.classNumber || index + 1,
      slots: [{
        slotIndex: slot.slotIndex ?? index,
        date: slot.date || null,
        slot: slot.slot || slot.time || null,
        subject: slot.subject || (slot.name_th ? { code: slot.code, name_th: slot.name_th } : null),
        code: slot.code || null,
        name_th: slot.name_th || null,
        level: slot.level || null,
        levelLabel: slot.levelLabel || null,
        category: slot.category || null,
        categoryLabel: slot.categoryLabel || null,
        subcategory: slot.subcategory || null,
        subcategoryLabel: slot.subcategoryLabel || null,
      }],
    }));
  } else {
    reservation.classSubjects = reservation.classSubjects.map((classItem, index) => {
      if (Array.isArray(classItem?.slots) && classItem.slots.length > 0) {
        return classItem;
      }

      const fallbackSlot = {
        slotIndex: 0,
        date: classItem.date || null,
        slot: classItem.slot || classItem.time || null,
        subject: classItem.subject || (classItem.name_th ? { code: classItem.code, name_th: classItem.name_th } : null),
        code: classItem.code || null,
        name_th: classItem.name_th || null,
        level: classItem.level || null,
        levelLabel: classItem.levelLabel || null,
        category: classItem.category || null,
        categoryLabel: classItem.categoryLabel || null,
        subcategory: classItem.subcategory || null,
        subcategoryLabel: classItem.subcategoryLabel || null,
      };

      return {
        classNumber: classItem.classNumber || index + 1,
        slots: [fallbackSlot],
      };
    });
  }

  return reservation;
};

exports.getReservationDetails = async (req, res) => {
  try {
    const number = req.params.reservationNumber;
    const reservationDoc = await Reservation.findOne({ reservationNumber: number });

    if (!reservationDoc) {
      return res.status(404).send('Reservation not found');
    }

    const reservation = await ensureClassSubjectsShape(reservationDoc);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id, field, value } = req.body;

    if (!['status', 'confirmation'].includes(field)) {
      return res.status(400).send({ message: 'Invalid field' });
    }

    const updated = await Reservation.findByIdAndUpdate(
      id,
      { [field]: value },
      { new: true }
    );

    if (!updated) return res.status(404).send({ message: 'Reservation not found' });

    res.send(updated);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).send(error);
  }
};

exports.updateReservationConfirmation = async (req, res) => {
  const { reservationNumber, confirmation } = req.body;

  try {
    const reservation = await Reservation.findOneAndUpdate(
      { reservationNumber: reservationNumber },
      { $set: { confirmation: confirmation } },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).send('Reservation not found');
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error updating reservation');
  }
};

exports.getConfirmedReservations = async (req, res) => {
  try {
    const confirmedReservations = await Reservation.find({ confirmation: 'confirmed' });
    const processedReservations = await Reservation.find({ confirmation: 'processed' });
    res.json({ confirmed: confirmedReservations, processed: processedReservations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reservations = await Reservation.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    const shaped = await Promise.all(reservations.map(doc => ensureClassSubjectsShape(doc)));
    const totalReservations = await Reservation.countDocuments();

    res.status(200).json({
      data: shaped,
      total: totalReservations,
      page,
      totalPages: Math.ceil(totalReservations / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reservations', error });
  }
};

exports.getReservationByNumber = async (req, res) => {
  try {
    const reservationNumber = req.query.reservationNumber;
    if (!reservationNumber) {
      return res.status(400).json({ message: 'Reservation number is required' });
    }

    const reservationDoc = await Reservation.findOne({ reservationNumber });

    if (!reservationDoc) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const reservation = await ensureClassSubjectsShape(reservationDoc);
    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getReservationsForCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await db.user.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const email = (user.email || '').trim();
    const username = (user.username || '').trim();
    const conditions = [{ userId }];

    if (email) {
      conditions.push(
        buildEmailRegexCondition('userInfo.email', email),
        buildEmailRegexCondition('mail', email),
        buildEmailRegexCondition('email', email)
      );
    }

    if (username) {
      conditions.push(
        buildUsernameRegexCondition('userInfo.username', username)
      );
    }

    const reservations = await Reservation.find({ $or: conditions }).sort({ createdAt: -1 });
    const shaped = await Promise.all(reservations.map(doc => ensureClassSubjectsShape(doc)));

    const defaultUserInfo = {
      username: username || null,
      email: email || null,
    };

    const normalizedReservations = shaped.map((reservation) => {
      const existingUserInfo = reservation.userInfo && typeof reservation.userInfo === 'object'
        ? reservation.userInfo
        : {};

      return {
        ...reservation,
        userInfo: {
          ...existingUserInfo,
          username: existingUserInfo.username || defaultUserInfo.username,
          email: existingUserInfo.email || defaultUserInfo.email,
        },
      };
    });

    res.json(normalizedReservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
};

exports.getReservationsByEmail = async (req, res) => {
  try {
    const email = (req.query.email || '').trim();
    const username = (req.query.username || '').trim();

    if (!email && !username) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    const conditions = [];

    if (email) {
      conditions.push(
        buildEmailRegexCondition('userInfo.email', email),
        buildEmailRegexCondition('mail', email),
        buildEmailRegexCondition('email', email),
      );
    }

    if (username) {
      conditions.push(
        buildUsernameRegexCondition('userInfo.username', username)
      );
    }

    const reservations = await Reservation.find({ $or: conditions }).sort({ createdAt: -1 });
    const shaped = await Promise.all(reservations.map(doc => ensureClassSubjectsShape(doc)));
    res.json(shaped);
  } catch (error) {
    console.error('Error fetching reservations by email:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
};
