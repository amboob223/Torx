import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../utils/api';

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-neutral-700'}>★</span>
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

  if (!profile) return <div className="min-h-screen bg-neutral-950"><Navbar /></div>;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">

        {/* Profile card */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-950/50 flex items-center justify-center text-blue-400 text-xl font-bold">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-100">{profile.first_name} {profile.last_name}</h1>
              <span className="text-sm text-neutral-500 capitalize">{profile.role}</span>
            </div>
          </div>
          {profile.role === 'torka' && (
            <div className="space-y-3">
              {profile.service_types?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {profile.service_types.map(s => (
                    <span key={s} className="bg-blue-950/50 text-blue-400 text-xs px-3 py-1 rounded-full font-medium capitalize">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="font-semibold">{Number(profile.rating_avg).toFixed(1)}</span>
                <span className="text-neutral-500">({profile.rating_count} {profile.rating_count === 1 ? 'review' : 'reviews'})</span>
              </div>
              {profile.bio && <p className="text-neutral-400 text-sm">{profile.bio}</p>}
            </div>
          )}
        </div>

        {/* Reviews */}
        {profile.role === 'torka' && (
          <div>
            <h2 className="text-lg font-bold text-neutral-100 mb-3">Reviews</h2>

            {reviews.length === 0 && (
              <div className="text-center py-10 text-neutral-500">
                <p className="text-3xl mb-2">⭐</p>
                <p className="text-sm">No reviews yet</p>
              </div>
            )}

            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-950/50 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {review.reviewer_first[0]}{review.reviewer_last[0]}
                      </div>
                      <span className="text-sm font-semibold text-neutral-100">
                        {review.reviewer_first} {review.reviewer_last}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StarDisplay rating={review.rating} />
                  {review.comment && (
                    <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{review.comment}</p>
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