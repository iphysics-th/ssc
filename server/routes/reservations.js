const express = require('express');
const router = express.Router();
const Reservation = require('../models/reservation');
const lineNotifier = require('../functions/lineNotify'); // Adjust the path to your notifyLine function
const generateLineMessage = require('../functions/generateMessage');
require('dotenv').config();

// Post a new reservation
router.post('/', async (req, res) => {
  console.log('Received data:', req.body); // Log the received data

  try {
    let reservation = new Reservation(req.body);
    reservation = await reservation.save();

    // Send LINE Notification
    const message = generateLineMessage(reservation);
    lineNotifier.notifyLine(message);

    res.send(reservation);
  } catch (error) {
    console.error('Error:', error);
    res.status(400).send(error);
  }
});

router.get('/check/:reservationNumber', async (req, res) => {
  try {
    const number = req.params.reservationNumber;
    const reservationExists = await Reservation.findOne({ reservationNumber: number });
    res.json({ exists: !!reservationExists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get a reservation by its number
router.get('/details/:reservationNumber', async (req, res) => {
  try {
      const number = req.params.reservationNumber;
      const reservation = await Reservation.findOne({ reservationNumber: number });
      if (reservation) {
          res.json(reservation); // Send the full reservation data
      } else {
          res.status(404).send('Reservation not found');
      }
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


// PUT route to update the confirmation status of a reservation
router.put('/update-confirmation', async (req, res) => {
  const { reservationNumber, confirmation } = req.body;

  try {
      const reservation = await Reservation.findOneAndUpdate(
          { reservationNumber: reservationNumber },
          { $set: { confirmation: confirmation } },
          { new: true } // Return the updated document
      );

      if (!reservation) {
          return res.status(404).send('Reservation not found');
      }

      res.json(reservation);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error updating reservation');
  }
});

// GET route to fetch confirmed reservations
router.get('/confirmed', async (req, res) => {
  try {
      const confirmedReservations = await Reservation.find({ confirmation: 'confirmed' });
      res.json(confirmedReservations);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

module.exports = router;
