import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get(`/api/users/${id}`).then(r => setProfile(r.data));
    api.get(`/api/reviews/user/${id}`).then(r => setReviews(r.data));
  }, [id]);

  if (!profile) return <div className="min-h-screen bg-gray-50"><Navbar /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl font-bold">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{profile.first_name} {profile.last_name}</h1>
              <span className="text-sm text-gray-400 capitalize">{profile.role}</span>
            </div>
          </div>
          {profile.role === 'torka' && (
            <div className="space-y-3">
              {profile.service_types?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {profile.service_types.map(s => (
                    <span key={s} className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium capitalize">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="font-semibold">{Number(profile.rating_avg).toFixed(1)}</span>
                <span className="text-gray-400">({profile.rating_count} {profile.rating_count === 1 ? 'review' : 'reviews'})</span>
              </div>
              {profile.bio && <p className="text-gray-600 text-sm">{profile.bio}</p>}
            </div>
          )}
        </div>

        {/* Reviews */}
        {profile.role === 'torka' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Reviews</h2>

            {reviews.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">⭐</p>
                <p className="text-sm">No reviews yet</p>
              </div>
            )}

            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                        {review.reviewer_first[0]}{review.reviewer_last[0]}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {review.reviewer_first} {review.reviewer_last}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StarDisplay rating={review.rating} />
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}