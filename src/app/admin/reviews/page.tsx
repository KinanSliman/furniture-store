'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Star,
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  ShieldCheck,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  productId: string;
  userId: string | null;
  orderId: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    fetchReviews();
  }, [pagination.page, ratingFilter, statusFilter, verifiedFilter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter);
      }

      if (statusFilter !== 'all') {
        params.append('isApproved', (statusFilter === 'approved').toString());
      }

      if (verifiedFilter !== 'all') {
        params.append('isVerifiedPurchase', (verifiedFilter === 'verified').toString());
      }

      const response = await fetch(`/api/admin/reviews?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve review');
      }

      toast.success('Review approved');
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject review');
      }

      toast.success('Review rejected');
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
          />
        ))}
      </div>
    );
  };

  const getUserName = (user: Review['user']) => {
    if (!user) return 'Guest';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  const goToPage = (page: number) => {
    setPagination({ ...pagination, page });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reviews & Ratings</h1>
          <p className="text-slate-600 mt-1">Manage customer product reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Purchase</label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Reviews</option>
              <option value="verified">Verified Purchase</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setRatingFilter('all');
                setStatusFilter('all');
                setVerifiedFilter('all');
              }}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <MessageSquare size={64} className="mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
            <p className="text-sm">Reviews will appear here when customers leave feedback</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-sm font-semibold text-slate-900">
                          {review.rating}.0
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <ShieldCheck size={12} />
                            Verified Purchase
                          </span>
                        )}
                        {review.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            <CheckCircle size={12} />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            <Eye size={12} />
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      {review.title && (
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {review.title}
                        </h3>
                      )}

                      {/* Content */}
                      {review.content && (
                        <p className="text-slate-700 mb-3 leading-relaxed">{review.content}</p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {getUserName(review.user)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(review.createdAt.toString())}
                        </div>
                        <Link
                          href={`/admin/products/${review.product.id}`}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
                        >
                          {review.product.name}
                        </Link>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!review.isApproved && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      {review.isApproved && (
                        <button
                          onClick={() => handleReject(review.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            pagination.page === page
                              ? 'bg-purple-600 text-white'
                              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
