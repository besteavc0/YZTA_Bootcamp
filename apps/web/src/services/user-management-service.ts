import { apiFetch } from "@/lib/api";

export type UserRole = "admin" | "user" | "viewer";

export type UserStatus = "active" | "inactive";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
};

type BackendManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
};

type GetUsersParams = {
  token?: string | null;
};

type UpdateUserRoleParams = {
  userId: string;
  role: UserRole;
  token?: string | null;
};

type UpdateUserStatusParams = {
  userId: string;
  status: UserStatus;
  token?: string | null;
};

const useMockUsers = process.env.NEXT_PUBLIC_USE_MOCK_USERS !== "false";

const mockUsers: ManagedUser[] = [
  {
    id: "user-001",
    name: "Admin Kullanıcı",
    email: "admin@demo.com",
    role: "admin",
    status: "active",
    lastLoginAt: "2026-07-23T09:45:00.000Z",
    createdAt: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "user-002",
    name: "Yusuf Eker",
    email: "yuseker.2@gmail.com",
    role: "admin",
    status: "active",
    lastLoginAt: "2026-07-23T16:45:00.000Z",
    createdAt: "2026-07-10T10:30:00.000Z",
  },
];

function mapBackendUser(user: BackendManagedUser): ManagedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

export async function getManagedUsers({
  token,
}: GetUsersParams = {}): Promise<ManagedUser[]> {
  if (useMockUsers) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return mockUsers;
  }

  const response = await apiFetch<BackendManagedUser[]>("/api/v1/users", {
    token,
    method: "GET",
  });

  return response.map(mapBackendUser);
}

export async function updateUserRole({
  userId,
  role,
  token,
}: UpdateUserRoleParams): Promise<ManagedUser> {
  if (useMockUsers) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers.find((item) => item.id === userId);

    if (!user) {
      throw new Error("Kullanıcı bulunamadı.");
    }

    return {
      ...user,
      role,
    };
  }

  const response = await apiFetch<BackendManagedUser>(
    `/api/v1/users/${userId}/role`,
    {
      token,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    }
  );

  return mapBackendUser(response);
}

export async function updateUserStatus({
  userId,
  status,
  token,
}: UpdateUserStatusParams): Promise<ManagedUser> {
  if (useMockUsers) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers.find((item) => item.id === userId);

    if (!user) {
      throw new Error("Kullanıcı bulunamadı.");
    }

    return {
      ...user,
      status,
    };
  }

  const response = await apiFetch<BackendManagedUser>(
    `/api/v1/users/${userId}/status`,
    {
      token,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  return mapBackendUser(response);
}