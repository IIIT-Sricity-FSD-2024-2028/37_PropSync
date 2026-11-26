import test from "node:test";
import assert from "node:assert/strict";
import ratingsReducer, {
  createRating,
  setRatings,
  updateRating,
  deleteRating,
  clearRatings,
  selectRatingsByComplaint,
  selectRatingsByProviderComplaints,
} from "../src/redux/features/ratings/ratingsSlice.js";

test("ratingsSlice - initial state is an empty array", () => {
  const state = ratingsReducer(undefined, { type: "@@INIT" });
  assert.deepEqual(state, []);
});

test("ratingsSlice - CRUD Create: adds a new rating", () => {
  const newRating = {
    id: 1,
    ownerId: 2,
    complaintId: 10,
    score: 5,
    feedback: "Great job fixing the pipe!",
    ratedAt: "2026-11-26",
  };
  const state = ratingsReducer([], createRating(newRating));
  assert.equal(state.length, 1);
  assert.equal(state[0].score, 5);
  assert.equal(state[0].complaintId, 10);
  assert.equal(state[0].feedback, "Great job fixing the pipe!");
});

test("ratingsSlice - CRUD Create: replaces/updates existing rating for same complaint and owner", () => {
  const initial = [
    { id: 1, ownerId: 2, complaintId: 10, score: 3, feedback: "Average", ratedAt: "2026-11-20" },
  ];
  const updated = {
    ownerId: 2,
    complaintId: 10,
    score: 5,
    feedback: "Much better now!",
    ratedAt: "2026-11-26",
  };
  const state = ratingsReducer(initial, createRating(updated));
  assert.equal(state.length, 1);
  assert.equal(state[0].score, 5);
  assert.equal(state[0].feedback, "Much better now!");
});

test("ratingsSlice - CRUD Read: setRatings populates state", () => {
  const mockRatings = [
    { id: 1, ownerId: 2, complaintId: 10, score: 5 },
    { id: 2, ownerId: 3, complaintId: 11, score: 4 },
  ];
  const state = ratingsReducer([], setRatings(mockRatings));
  assert.deepEqual(state, mockRatings);
});

test("ratingsSlice - CRUD Update: updateRating updates score and feedback", () => {
  const initial = [
    { id: 1, ownerId: 2, complaintId: 10, score: 4, feedback: "Good" },
  ];
  const state = ratingsReducer(initial, updateRating({ id: 1, score: 5, feedback: "Excellent" }));
  assert.equal(state[0].score, 5);
  assert.equal(state[0].feedback, "Excellent");
});

test("ratingsSlice - CRUD Delete: deleteRating removes a rating by id", () => {
  const initial = [
    { id: 1, ownerId: 2, complaintId: 10, score: 5 },
    { id: 2, ownerId: 3, complaintId: 11, score: 4 },
  ];
  const state = ratingsReducer(initial, deleteRating(1));
  assert.equal(state.length, 1);
  assert.equal(state[0].id, 2);
});

test("ratingsSlice - clearRatings empties the array", () => {
  const initial = [{ id: 1, ownerId: 2, complaintId: 10, score: 5 }];
  const state = ratingsReducer(initial, clearRatings());
  assert.deepEqual(state, []);
});

test("ratingsSlice - selectors work as expected", () => {
  const rootState = {
    ratings: [
      { id: 1, ownerId: 1, complaintId: 10, score: 5 },
      { id: 2, ownerId: 2, complaintId: 20, score: 4 },
      { id: 3, ownerId: 3, complaintId: 30, score: 3 },
    ],
  };

  const byComplaint = selectRatingsByComplaint(rootState, 20);
  assert.equal(byComplaint.id, 2);

  const byProvider = selectRatingsByProviderComplaints(rootState, [10, 30]);
  assert.equal(byProvider.length, 2);
  assert.deepEqual(byProvider.map((r) => r.id), [1, 3]);
});
