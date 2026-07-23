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
  {
    id: "user-003",
    name: "Standart Kullanıcı",
    email: "user@demo.com",
    role: "user",
    status: "active",
    lastLoginAt: "2026-07-22T14:20:00.000Z",
    createdAt: "2026-07-03T11:15:00.000Z",
  },
  {
    id: "user-004",
    name: "Viewer Kullanıcı",
    email: "viewer@demo.com",
    role: "viewer",
    status: "active",
    lastLoginAt: "2026-07-21T12:10:00.000Z",
    createdAt: "2026-07-04T13:40:00.000Z",
  },
  {
    id: "user-005",
    name: "Pasif Kullanıcı",
    email: "inactive@demo.com",
    role: "user",
    status: "inactive",
    lastLoginAt: null,
    createdAt: "2026-07-05T09:25:00.000Z",
  },
];

export async function getManagedUsers({
  token,
}: GetUsersParams = {}): Promise<ManagedUser[]> {
  if (useMockUsers) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return mockUsers;
  }

  const response = await fetch("/api/v1/admin/users", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("Kullanıcı listesi alınamadı.");
  }

  return response.json();
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

  const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw new Error("Kullanıcı rolü güncellenemedi.");
  }

  return response.json();
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

  const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Kullanıcı durumu güncellenemedi.");
  }

  return response.json();
}