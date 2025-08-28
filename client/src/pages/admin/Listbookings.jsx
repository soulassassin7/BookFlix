import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/Title';
import formatDateTime from '../../lib/DateCalculate';
import BlurCircle from '../../components/BlurCircle';
import { useAppContext } from '../../context/Appcontext';
import toast from 'react-hot-toast';

const Listbookings = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchbookings = async () => {
    try {
      const { data } = await axios.get('/api/admin/getallbookings', {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // It's better to show the error message from the server if it exists
      const errorMessage = error.response?.data?.message || "An error occurred while fetching bookings.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchbookings();
    }
  }, [user]);

  return !loading ? (
    <div className="w-full md:px-4 max-md:px-0 relative">
      <Title text1="List" text2="Bookings" />
      <BlurCircle top='0' left='0' />
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full table-auto border-collapse text-sm text-white rounded-lg overflow-hidden max-md:text-xs">
          <thead>
            <tr className="bg-primary/20 text-left whitespace-nowrap">
              <th className="p-3 text-base font-semibold min-w-[140px]">User Name</th>
              <th className="p-3 text-base font-semibold min-w-[120px]">Movie Name</th>
              <th className="p-3 text-base font-semibold min-w-[120px]">Show Time</th>
              <th className="p-3 text-base font-semibold min-w-[100px]">Seats</th>
              <th className="p-3 text-base font-semibold min-w-[100px]">Amount</th>
              <th className="p-3 text-base font-semibold min-w-[100px]">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {bookings.map((booking, index) => {
              // --- SAFETY CHECK ---
              // If any critical data is missing, we skip rendering this row to prevent a crash.
              if (!booking || !booking.user || !booking.show || !booking.show.movie) {
                return null;
              }
              return (
                <tr
                  key={index}
                  className="border-b border-primary/10 bg-primary/5 even:bg-primary/10 whitespace-nowrap"
                >
                  {/* --- FIX #1: CORRECTLY DISPLAY USER'S FULL NAME --- */}
                  <td className="p-3 max-w-[180px] truncate">{booking.user ? booking.user.name : 'User Not Found'}</td>
                  
                  <td className="p-3 max-w-[180px] truncate">{booking.show.movie.originalTitle}</td>
                  <td className="p-3 max-w-[160px] truncate">{formatDateTime(booking.show.showDateTime).replace('•', ' at')}</td>
                  <td className="p-3">{booking.bookedseats.join(', ')}</td>
                  <td className="p-3">
                    {currency} {booking.amount}
                  </td>
                  {/* --- BONUS FIX: ADD A PAYMENT STATUS INDICATOR --- */}
                  <td className="p-3">
                    {booking.isPaid ? (
                      <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-600/20 rounded-full">Paid</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium text-yellow-400 bg-yellow-600/20 rounded-full">Unpaid</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  ) : <Loading />
}

export default Listbookings;