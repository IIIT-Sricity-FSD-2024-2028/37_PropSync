import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import PerformanceSummary from "./components/PerformanceSummary";
import ProviderPerformanceCard from "./components/ProviderPerformanceCard";
import { MM_PATHS } from "../shared/paths";
import {
  fetchBills,
  selectAllBills,
} from "../../../redux/features/bills/billsSlice";
import {
  fetchEstimates,
  selectEstimates,
} from "../../../redux/features/estimates/estimatesSlice";
import {
  fetchRatings,
  selectRatings,
} from "../../../redux/features/ratings/ratingsSlice";
import {
  getManagerViewer,
  useManagerComplaints,
  useServiceProviders,
} from "../shared/useManagerData";

const DONE = ["completed", "billed", "paid", "closed"];
const avg = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/* provider-performance.html
   (HTML used Math.random(); here: jobs = finished complaints, rating = /ratings,
    on-time = bills without penalty, avg cost = approved estimates) */
export default function ProviderPerformance() {
  const dispatch = useDispatch();
  // bills, providers, complaints, ratings and estimates all come from the Redux store
  const bills = useSelector(selectAllBills);
  const estimates = useSelector(selectEstimates);
  const ratings = useSelector(selectRatings);
  const {
    complaints,
    loading: complaintsLoading,
    error,
  } = useManagerComplaints();
  const { providers, loading: providersLoading } = useServiceProviders();
  const data = complaintsLoading || providersLoading ? null : true;

  useEffect(() => {
    const viewer = getManagerViewer();
    dispatch(fetchBills());
    const ratingsReq = dispatch(fetchRatings({ viewer }));
    const estimatesReq = dispatch(fetchEstimates({ viewer }));
    return () => {
      ratingsReq.abort();
      estimatesReq.abort();
    };
  }, [dispatch]);

  const rows = useMemo(() => {
    if (!data) return [];
    return providers
      .map((p) => {
        const mine = complaints.filter(
          (c) => Number(c.assignedProviderId) === Number(p.id),
        );
        const ids = new Set(mine.map((c) => Number(c.id)));
        const done = mine.filter((c) => DONE.includes(c.status)).length;
        const myBills = bills.filter((b) => ids.has(Number(b.complaintId)));
        const reviews = ratings.filter((r) => ids.has(Number(r.complaintId)));
        return {
          ...p,
          jobs: done,
          active: mine.length - done,
          rating: avg(reviews.map((r) => Number(r.score))),
          onTime: myBills.length
            ? Math.round(
                (myBills.filter((b) => !Number(b.penalty)).length /
                  myBills.length) *
                  100,
              )
            : null,
          avgCost: avg(
            estimates
              .filter(
                (e) =>
                  Number(e.providerId) === Number(p.id) && e.approved === true,
              )
              .map((e) => Number(e.estimatedCost)),
          ),
          reviews,
        };
      })
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.jobs - a.jobs);
  }, [data, bills]);

  const kpis = useMemo(() => {
    const rated = rows.filter((r) => r.rating !== null).map((r) => r.rating);
    const timed = rows.filter((r) => r.onTime !== null).map((r) => r.onTime);
    return {
      total: rows.length,
      rating: rated.length ? avg(rated).toFixed(1) : "—",
      onTime: timed.length ? `${Math.round(avg(timed))}%` : "—",
      jobs: rows.reduce((s, r) => s + r.jobs, 0),
    };
  }, [rows]);

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader
        title="Service Provider Performance"
        subtitle="Track provider ratings, on-time delivery, cost metrics and customer reviews"
      />
      <PerformanceSummary kpis={kpis} />
      {error && (
        <div className="card" style={{ color: "#DC2626" }}>
          {error}
        </div>
      )}
      {!data && !error && <div className="card muted">Loading...</div>}
      {rows.map((p, i) => (
        <ProviderPerformanceCard key={p.id} provider={p} rank={i} />
      ))}
    </ManagerLayout>
  );
}
