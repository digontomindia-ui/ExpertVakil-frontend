import useAuth from "../hooks/useAuth";

type User = {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
};

export default function ClientProfile() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your profile.</div>;

  const u = user as User;

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ fontWeight: "bold", fontSize: 24 }}>Welcome, {u.fullName || u.name}</h2>
      <p>Email: {u.email}</p>
      <p>Phone: {u.phone}</p>
      <button
        onClick={logout}
        style={{ marginTop: 16, padding: "8px 16px", background: "#222", color: "#fff", border: "none", borderRadius: 4 }}
      >
        Logout
      </button>
    </div>
  );
}
