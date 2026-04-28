import { useUsersContext } from '../context/UsersContext';

export function useUsers() {
  return useUsersContext();
}
