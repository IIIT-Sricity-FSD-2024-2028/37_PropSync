import {
  createUser as createUserThunk,
  fetchUserById as fetchUserByIdThunk,
  fetchUsers as fetchUsersThunk,
  removeUser as removeUserThunk,
  saveUser as saveUserThunk,
} from "../redux/features/users/usersSlice";

function run({ dispatch }, thunk, { signal, ...arg }) {
  const request = dispatch(thunk(arg));
  signal?.addEventListener("abort", () => request.abort(), { once: true });
  return request.unwrap();
}

export const fetchUsers = (redux, arg) => run(redux, fetchUsersThunk, arg);
export const fetchUserById = (redux, arg) => run(redux, fetchUserByIdThunk, arg);
export const createUser = (redux, arg) => run(redux, createUserThunk, arg);
export const saveUser = (redux, arg) => run(redux, saveUserThunk, arg);
export const removeUser = (redux, arg) => run(redux, removeUserThunk, arg);