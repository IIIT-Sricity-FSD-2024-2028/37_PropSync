// =============================================================
// Service Provider – shared Redux hooks
// Pages read the provider's complaints, ratings and estimates from the
// Redux store; loading goes through the slices' thunks (backend first).
// =============================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/features/users/usersSlice";
import {
  complaintListKey,
  fetchProviderComplaints,
  selectComplaintList,
  selectComplaintsRequest,
} from "../../redux/features/complaints/complaintsSlice";
import {
  fetchRatings,
  selectRatings,
} from "../../redux/features/ratings/ratingsSlice";

const DEFAULT_PROVIDER_ID = 10; // same development default the pages used before

/** The logged-in provider's id (from the Redux auth state). */
export function useProviderId() {
  const user = useSelector(selectCurrentUser);
  return user?.id || DEFAULT_PROVIDER_ID;
}

/** { role, id } sent with every provider request */
export function providerViewer(providerId) {
  return { role: "service_provider", id: providerId };
}

/** The viewer object for the logged-in provider (stable between renders). */
export function useProviderViewer() {
  const providerId = useProviderId();
  return useMemo(() => providerViewer(providerId), [providerId]);
}

/**
 * Complaints assigned to this provider (raw backend objects).
 *   const { complaints, loading, error, reload } = useProviderComplaints();
 */
export function useProviderComplaints() {
  const dispatch = useDispatch();
  const viewer = useProviderViewer();
  const key = complaintListKey.provider(viewer.id);
  const complaints = useSelector((state) => selectComplaintList(state, key));
  const request = useSelector((state) => selectComplaintsRequest(state, key));
  const reload = useCallback(
    () => dispatch(fetchProviderComplaints({ viewer, providerId: viewer.id })),
    [dispatch, viewer],
  );
  useEffect(() => {
    const req = reload();
    return () => req.abort();
  }, [reload]);
  const loading =
    complaints.length === 0 &&
    (request.status === "idle" || request.status === "loading");
  return { complaints, loading, error: request.error, reload };
}

/**
 * All ratings visible to this provider (ratings slice) + load state.
 *   const { ratings, loading, error, reload } = useProviderRatings();
 */
export function useProviderRatings() {
  const dispatch = useDispatch();
  const viewer = useProviderViewer();
  const ratings = useSelector(selectRatings);
  const [state, setState] = useState({ loading: true, error: "" });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    const req = dispatch(fetchRatings({ viewer }));
    req
      .unwrap()
      .then(() => setState({ loading: false, error: "" }))
      .catch((e) => {
        if (e?.name !== "AbortError")
          setState({
            loading: false,
            error: e?.message || "Could not load ratings.",
          });
      });
    return req;
  }, [dispatch, viewer]);
  useEffect(() => {
    const req = reload();
    return () => req.abort();
  }, [reload]);
  return { ratings, loading: state.loading, error: state.error, reload };
}
