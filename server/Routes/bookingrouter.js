// Routes/bookingrouter.js

import express from 'express';
// --- ADD 'checkUnpaidBooking' TO THIS IMPORT ---
import { createBooking, getoccupiedSeats, repayBooking, checkUnpaidBooking } from '../Control/Bookingscontrol.js';

const bookingRouter = express.Router();

bookingRouter.post('/create', createBooking);
bookingRouter.get('/occupiedseats/:showId', getoccupiedSeats);
bookingRouter.post('/repay', repayBooking);

// --- ADD THIS NEW ROUTE ---
bookingRouter.post('/check-unpaid', checkUnpaidBooking);

export default bookingRouter;