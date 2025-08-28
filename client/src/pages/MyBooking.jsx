import { useEffect, useState } from 'react';
import BlurCircle from '../components/BlurCircle';
import { StarIcon, TicketCheck } from 'lucide-react'; // Added TicketCheck icon
import time from '../lib/Time';
import formatDateTime from '../lib/DateCalculate';
import { useAppContext } from '../context/Appcontext';
import toast from 'react-hot-toast';
// Add this line with your other imports
import { useSearchParams, useNavigate } from 'react-router-dom';

const MyBooking = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state
  const [searchParams] = useSearchParams();
const navigate = useNavigate();

useEffect(() => {
  const paymentStatus = searchParams.get('payment_status');
  if (paymentStatus === 'success') {
    toast.success('Payment successful! Your booking is confirmed.');
    navigate('/my-bookings', { replace: true }); // Cleans the URL
  } else if (paymentStatus === 'cancelled') {
    toast.error('Payment was cancelled.');
    navigate('/my-bookings', { replace: true }); // Cleans the URL
  }
}, [searchParams, navigate]);

  const getBooking = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/user/userbookings', {
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
      console.log(error);
      toast.error("Failed to fetch bookings.");
    } finally {
      setLoading(false); // Ensure loading is false after fetch
    }
  };

  useEffect(() => {
    if (user) {
      getBooking();
    }
  }, [user]);

  // --- NEW FUNCTION TO HANDLE RE-PAYMENT ---
  const handleRepay = async (bookingId) => {
    try {
      toast.loading("Generating new payment link...");
      // We will create this backend endpoint in the next step
      const { data } = await axios.post('/api/booking/repay', { bookingId }, {
        headers: {
            Authorization: `Bearer ${await getToken()}`
        }
      });
      toast.dismiss();

      if(data.success) {
        // Redirect to the new Stripe checkout URL
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Could not create new payment link.");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading bookings...</div>;
  }

  return bookings.length > 0 ? (
    <div className="relative mt-20 px-4 sm:px-6 md:px-14 lg:px-24 pt-10 min-h-[70vh] mb-10 max-md:mt-15">
      <BlurCircle top="0" left="0" />
      <BlurCircle bottom="0" right="80vh" />
      <h1 className="text-lg sm:text-xl font-medium text-gray-300 mb-6">Your Bookings</h1>
      <div className="flex flex-wrap gap-6 justify-start">
        {bookings.map((data, index) => {
          if (!data.show?.movie) return null;
          return (
            <div key={index} className="w-full md:w-[48%] bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col gap-4">
              <div className="flex gap-4">
                <img src={data.show.movie.primaryImage} alt="Poster" className="w-24 h-36 object-cover rounded-lg" />
                <div className="flex flex-col justify-between text-white text-sm">
                  <h1 className="text-3xl font-semibold">{data.show.movie.originalTitle}</h1>
                  <p>{time(data.show.movie.runtime)}</p>
                  <p className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {data.show.movie.averageRating}
                  </p>
                  <p className='text-md'>{formatDateTime(data.show.showDateTime)}</p>
                </div>
              </div>
              <div className="text-white text-sm flex flex-col gap-1 px-1">
                <div className='flex gap-4 items-center'> {/* Used items-center for alignment */}
                  <p className="font-semibold text-2xl">
                    {currency} {data.amount}
                  </p>
                  {/* --- UPDATED LOGIC HERE --- */}
                  {data.isPaid ? (
                    <div className='flex items-center gap-2 px-4 py-1.5 mb-2 text-sm bg-green-600/20 text-green-400 border border-green-500 rounded-full font-medium'>
                      <TicketCheck size={16} />
                      Booking Confirmed
                    </div>
                  ) : (
                    <button onClick={() => handleRepay(data._id)} className='px-4 py-1.5 mb-2 text-sm bg-primary hover:bg-primary-dull rounded-full transition font-medium cursor-pointer'>
                      Pay Now
                    </button>
                  )}
                </div>
                <p>Total Tickets: <span className="font-semibold">{data.bookedseats.length}</span></p>
                <p>Seat Numbers:{' '}<span className="font-semibold">{data.bookedseats.join(', ')}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center text-gray-400 min-h-screen text-4xl max-md:text-3xl font-semibold">No bookings found</div>
  );
};

export default MyBooking;